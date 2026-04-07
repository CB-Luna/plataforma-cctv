package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/symtickets/cctv_server/internal/database"
)

const (
	anthropicInventoryDefaultBaseURL = "https://api.anthropic.com/v1"
	anthropicInventoryDefaultVersion = "2023-06-01"
	heuristicImportAssistantModel    = "heuristic-import-assistant"
)

type inventoryImportAssistantResult struct {
	TemplateName        string                       `json:"template_name"`
	Confidence          float64                      `json:"confidence"`
	Mode                string                       `json:"mode"`
	SuggestedTargets    []string                     `json:"suggested_targets"`
	Findings            []string                     `json:"findings"`
	RecommendedMappings map[string]map[string]string `json:"recommended_mappings"`
}

func (r inventoryImportAssistantResult) toMap() map[string]interface{} {
	return map[string]interface{}{
		"template_name":        r.TemplateName,
		"confidence":           r.Confidence,
		"mode":                 r.Mode,
		"suggested_targets":    r.SuggestedTargets,
		"findings":             r.Findings,
		"recommended_mappings": r.RecommendedMappings,
	}
}

type inventoryImportAssistantExecution struct {
	Result           inventoryImportAssistantResult
	ModelUsed        string
	APICallID        pgtype.UUID
	ProcessingTimeMs *int32
}

type anthropicInventoryMessageResponse struct {
	ID      string `json:"id"`
	Model   string `json:"model"`
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text,omitempty"`
	} `json:"content"`
	StopReason string `json:"stop_reason"`
	Usage      struct {
		InputTokens  int32 `json:"input_tokens"`
		OutputTokens int32 `json:"output_tokens"`
	} `json:"usage"`
}

func (h *InventoryImportHandler) runInventoryImportAssistant(
	ctx context.Context,
	tenantID string,
	userID string,
	req AnalyzeImportAssistantRequest,
	heuristic inventoryImportAssistantResult,
) inventoryImportAssistantExecution {
	execution := inventoryImportAssistantExecution{
		Result:    heuristic,
		ModelUsed: heuristicImportAssistantModel,
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		return execution
	}

	config, err := h.queries.GetDefaultModelConfig(ctx, pgTenantID)
	if err != nil || !boolValue(config.IsActive) || strings.ToLower(config.Provider) != "anthropic" {
		return execution
	}
	if config.ApiKeyEncrypted == nil || strings.TrimSpace(*config.ApiKeyEncrypted) == "" {
		return execution
	}

	startedAt := time.Now()
	promptText := buildAnthropicInventoryPrompt(req, heuristic)
	systemPrompt := buildAnthropicInventorySystemPrompt(config)
	requestParameters, _ := json.Marshal(map[string]interface{}{
		"source_filename": req.SourceFilename,
		"source_type":     req.SourceType,
		"sheet_names":     req.SheetNames,
		"headers":         req.Headers,
		"sample_size":     len(req.SampleData),
	})

	pgUserID := pgtype.UUID{}
	if userID != "" {
		if parsedUserID, userErr := toPgUUID(userID); userErr == nil {
			pgUserID = parsedUserID
		}
	}

	apiCall, err := h.queries.CreateAPICall(ctx, database.CreateAPICallParams{
		TenantID:         pgTenantID,
		ModelConfigID:    config.ID,
		PromptTemplateID: pgtype.UUID{},
		Provider:         config.Provider,
		Model:            config.ModelName,
		PromptText:       promptText,
		SystemPrompt:     &systemPrompt,
		Temperature:      anthropicTemperature(config),
		MaxTokens:        anthropicMaxTokens(config),
		Parameters:       requestParameters,
		RelatedEntityType: stringPtr(
			"inventory_import_assistant",
		),
		RelatedEntityID: pgtype.UUID{},
		TriggeredBy:     pgUserID,
		Status:          "in_progress",
		StartedAt: pgtype.Timestamptz{
			Time:  startedAt,
			Valid: true,
		},
	})
	if err != nil {
		return execution
	}

	execution.APICallID = apiCall.ID

	result, responseText, usage, err := callAnthropicInventoryAssistant(ctx, config, systemPrompt, promptText)
	completedAt := pgtype.Timestamptz{Time: time.Now(), Valid: true}
	latencyMs := int32(time.Since(startedAt).Milliseconds())
	updateParams := database.UpdateAPICallResponseParams{
		ID:               apiCall.ID,
		ResponseText:     &responseText,
		FinishReason:     stringPtr("stop"),
		PromptTokens:     usage.promptTokens,
		CompletionTokens: usage.completionTokens,
		TotalTokens:      usage.totalTokens(),
		EstimatedCostUsd: numericValue("0"),
		LatencyMs:        &latencyMs,
		CompletedAt:      completedAt,
		Status:           "completed",
	}

	if err != nil {
		errMsg := err.Error()
		updateParams.Status = "failed"
		updateParams.ErrorMessage = &errMsg
		updateParams.FinishReason = nil
		_, _ = h.queries.UpdateAPICallResponse(ctx, updateParams)
		return execution
	}

	_, _ = h.queries.UpdateAPICallResponse(ctx, updateParams)
	execution.Result = mergeInventoryAssistantResults(heuristic, result)
	execution.ModelUsed = config.ModelName
	execution.ProcessingTimeMs = &latencyMs
	return execution
}

type anthropicTokenUsage struct {
	promptTokens     *int32
	completionTokens *int32
}

func (u anthropicTokenUsage) totalTokens() *int32 {
	if u.promptTokens == nil && u.completionTokens == nil {
		return nil
	}
	total := int32(0)
	if u.promptTokens != nil {
		total += *u.promptTokens
	}
	if u.completionTokens != nil {
		total += *u.completionTokens
	}
	return &total
}

func callAnthropicInventoryAssistant(
	ctx context.Context,
	config database.IntelligenceModelConfig,
	systemPrompt string,
	promptText string,
) (inventoryImportAssistantResult, string, anthropicTokenUsage, error) {
	requestBody := map[string]interface{}{
		"model":       config.ModelName,
		"max_tokens":  valueOrDefaultInt32(config.DefaultMaxTokens, 1200),
		"temperature": numericOrDefaultFloat64(config.DefaultTemperature, 0.2),
		"system":      systemPrompt,
		"messages": []map[string]interface{}{
			{
				"role":    "user",
				"content": promptText,
			},
		},
	}

	body, err := json.Marshal(requestBody)
	if err != nil {
		return inventoryImportAssistantResult{}, "", anthropicTokenUsage{}, err
	}

	baseURL := strings.TrimSpace(safeString(config.ApiEndpoint))
	if baseURL == "" {
		baseURL = anthropicInventoryDefaultBaseURL
	}
	baseURL = strings.TrimRight(baseURL, "/")
	if !strings.HasSuffix(baseURL, "/v1") {
		baseURL += "/v1"
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/messages", bytes.NewReader(body))
	if err != nil {
		return inventoryImportAssistantResult{}, "", anthropicTokenUsage{}, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", strings.TrimSpace(safeString(config.ApiKeyEncrypted)))
	httpReq.Header.Set("anthropic-version", strings.TrimSpace(valueOrDefaultString(config.ApiVersion, anthropicInventoryDefaultVersion)))

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return inventoryImportAssistantResult{}, "", anthropicTokenUsage{}, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return inventoryImportAssistantResult{}, "", anthropicTokenUsage{}, err
	}

	responseText := string(respBody)
	if resp.StatusCode != http.StatusOK {
		return inventoryImportAssistantResult{}, responseText, anthropicTokenUsage{}, fmt.Errorf("anthropic request failed with status %d", resp.StatusCode)
	}

	var parsed anthropicInventoryMessageResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return inventoryImportAssistantResult{}, responseText, anthropicTokenUsage{}, err
	}

	var textBuilder strings.Builder
	for _, block := range parsed.Content {
		if block.Type == "text" && strings.TrimSpace(block.Text) != "" {
			if textBuilder.Len() > 0 {
				textBuilder.WriteString("\n")
			}
			textBuilder.WriteString(block.Text)
		}
	}

	jsonPayload, err := extractJSONObject(textBuilder.String())
	if err != nil {
		return inventoryImportAssistantResult{}, responseText, anthropicTokenUsage{}, err
	}

	var result inventoryImportAssistantResult
	if err := json.Unmarshal([]byte(jsonPayload), &result); err != nil {
		return inventoryImportAssistantResult{}, responseText, anthropicTokenUsage{}, err
	}

	usage := anthropicTokenUsage{
		promptTokens:     int32PointerFromValue(parsed.Usage.InputTokens),
		completionTokens: int32PointerFromValue(parsed.Usage.OutputTokens),
	}
	return normalizeInventoryAssistantResult(result), responseText, usage, nil
}

func buildAnthropicInventoryPrompt(req AnalyzeImportAssistantRequest, heuristic inventoryImportAssistantResult) string {
	heuristicJSON, _ := json.MarshalIndent(heuristic.toMap(), "", "  ")
	sampleJSON, _ := json.MarshalIndent(req.SampleData, "", "  ")

	return fmt.Sprintf(`Analiza este archivo de inventario CCTV para importacion en SymTickets.

Debes decidir:
1. plantilla detectada
2. nivel de confianza entre 0 y 1
3. si conviene modo automatic o manual
4. targets sugeridos
5. hallazgos relevantes
6. mapeos de columnas recomendados por target

Responde UNICAMENTE un objeto JSON valido con esta estructura:
{
  "template_name": "string",
  "confidence": 0.0,
  "mode": "automatic|manual",
  "suggested_targets": ["nvr_servers","cameras"],
  "findings": ["texto"],
  "recommended_mappings": {
    "nvr_servers": {"columna origen": "campo_destino"},
    "cameras": {"columna origen": "campo_destino"}
  }
}

Reglas:
- Responde en espanol.
- Si el archivo coincide con un cliente/compania conocida, propon migracion directa automatica.
- Si el archivo es ambiguo, conserva modo manual.
- No inventes columnas que no existan en headers o sample_data.
- Usa el resultado heuristico como base y mejoralo solo si hay evidencia.

Archivo:
- source_filename: %s
- source_type: %s
- sheet_names: %s
- headers: %s

sample_data:
%s

resultado_heuristico_base:
%s
`, req.SourceFilename, req.SourceType, mustJSONString(req.SheetNames), mustJSONString(req.Headers), sampleJSON, heuristicJSON)
}

func buildAnthropicInventorySystemPrompt(config database.IntelligenceModelConfig) string {
	systemPrompt := `Eres un asistente especializado en migracion de inventario CCTV para SymTickets.
Analizas archivos de clientes y companias para decidir si se puede hacer una migracion directa con parseador o si hace falta revision manual.
Debes priorizar exactitud operativa, consistencia de mapeos y seguridad de datos por tenant.`

	if promptFromSettings := extractSystemPromptFromSettings(config.Settings); promptFromSettings != "" {
		return systemPrompt + "\n\nContexto adicional del tenant/modelo:\n" + promptFromSettings
	}
	if strings.TrimSpace(safeString(config.Description)) != "" {
		return systemPrompt + "\n\nContexto adicional del tenant/modelo:\n" + safeString(config.Description)
	}
	return systemPrompt
}

func extractSystemPromptFromSettings(raw []byte) string {
	if len(raw) == 0 {
		return ""
	}

	var settings map[string]interface{}
	if err := json.Unmarshal(raw, &settings); err != nil {
		return ""
	}

	for _, key := range []string{"system_prompt", "systemPrompt", "assistant_prompt", "assistantPrompt"} {
		if value, ok := settings[key].(string); ok && strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}

	return ""
}

func mergeInventoryAssistantResults(base inventoryImportAssistantResult, incoming inventoryImportAssistantResult) inventoryImportAssistantResult {
	merged := base
	incoming = normalizeInventoryAssistantResult(incoming)

	if incoming.TemplateName != "" {
		merged.TemplateName = incoming.TemplateName
	}
	if incoming.Confidence > 0 {
		merged.Confidence = incoming.Confidence
	}
	if incoming.Mode != "" {
		merged.Mode = incoming.Mode
	}
	if len(incoming.SuggestedTargets) > 0 {
		merged.SuggestedTargets = incoming.SuggestedTargets
	}
	if len(incoming.Findings) > 0 {
		merged.Findings = incoming.Findings
	}
	if len(incoming.RecommendedMappings) > 0 {
		if merged.RecommendedMappings == nil {
			merged.RecommendedMappings = map[string]map[string]string{}
		}
		for target, mapping := range incoming.RecommendedMappings {
			if len(mapping) == 0 {
				continue
			}
			merged.RecommendedMappings[target] = mapping
		}
	}

	return merged
}

func normalizeInventoryAssistantResult(result inventoryImportAssistantResult) inventoryImportAssistantResult {
	if result.Mode == "" {
		result.Mode = "manual"
	}
	if result.Confidence < 0 {
		result.Confidence = 0
	}
	if result.Confidence > 1 {
		result.Confidence = 1
	}
	if result.SuggestedTargets == nil {
		result.SuggestedTargets = []string{}
	}
	if result.Findings == nil {
		result.Findings = []string{}
	}
	if result.RecommendedMappings == nil {
		result.RecommendedMappings = map[string]map[string]string{}
	}
	return result
}

func extractJSONObject(raw string) (string, error) {
	cleaned := strings.TrimSpace(raw)
	cleaned = strings.TrimPrefix(cleaned, "```json")
	cleaned = strings.TrimPrefix(cleaned, "```")
	cleaned = strings.TrimSuffix(cleaned, "```")
	cleaned = strings.TrimSpace(cleaned)

	start := strings.Index(cleaned, "{")
	end := strings.LastIndex(cleaned, "}")
	if start == -1 || end == -1 || end < start {
		return "", fmt.Errorf("assistant response did not include a JSON object")
	}
	return cleaned[start : end+1], nil
}

func anthropicTemperature(config database.IntelligenceModelConfig) pgtype.Numeric {
	return numericValue(numericOrDefaultFloat64(config.DefaultTemperature, 0.2))
}

func anthropicMaxTokens(config database.IntelligenceModelConfig) *int32 {
	value := valueOrDefaultInt32(config.DefaultMaxTokens, 1200)
	return &value
}

func numericOrDefaultFloat64(value pgtype.Numeric, fallback float64) float64 {
	if !value.Valid {
		return fallback
	}
	parsed, err := value.Float64Value()
	if err != nil {
		return fallback
	}
	return parsed.Float64
}

func valueOrDefaultInt32(value *int32, fallback int32) int32 {
	if value == nil || *value <= 0 {
		return fallback
	}
	return *value
}

func valueOrDefaultString(value *string, fallback string) string {
	if value == nil || strings.TrimSpace(*value) == "" {
		return fallback
	}
	return strings.TrimSpace(*value)
}

func int32PointerFromValue(value int32) *int32 {
	if value <= 0 {
		return nil
	}
	return &value
}

func stringPtr(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return &value
}

func mustJSONString(value interface{}) string {
	data, err := json.Marshal(value)
	if err != nil {
		return "[]"
	}
	return string(data)
}
