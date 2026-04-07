package intelligence

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
)

const (
	defaultGeminiEmbeddingModel   = "gemini-embedding-2-preview"
	defaultVertexLocation         = "us-central1"
	defaultVertexAPIVersion       = "v1beta1"
	defaultEmbeddingDimensions    = 3072
	defaultGoogleTokenURI         = "https://oauth2.googleapis.com/token"
	googleCloudPlatformScope      = "https://www.googleapis.com/auth/cloud-platform"
	retrievalDocumentTaskType     = "RETRIEVAL_DOCUMENT"
	retrievalQueryTaskType        = "RETRIEVAL_QUERY"
	defaultCatalogModelEntityType = "inventory_model"
	defaultCatalogModelSourceType = "catalog_model"
)

var (
	ErrGoogleEmbeddingConfigNotFound = errors.New("no active Google embedding model configured for tenant")
	ErrSemanticIndexEmpty            = errors.New("semantic index is empty for the selected Google embedding model")
)

type CatalogEmbeddingService struct {
	db         *pgxpool.Pool
	queries    *database.Queries
	httpClient *http.Client

	tokenMu          sync.Mutex
	cachedToken      string
	cachedTokenKey   string
	cachedTokenUntil time.Time
}

type ReindexModelsResult struct {
	ModelConfigID string   `json:"model_config_id"`
	Provider      string   `json:"provider"`
	ModelName     string   `json:"model_name"`
	Processed     int      `json:"processed"`
	Indexed       int      `json:"indexed"`
	Failed        int      `json:"failed"`
	Errors        []string `json:"errors,omitempty"`
}

type SemanticModelSearchResult struct {
	ModelID         string  `json:"model_id"`
	BrandName       string  `json:"brand_name"`
	ModelName       string  `json:"model_name"`
	PartNumber      *string `json:"part_number,omitempty"`
	DatasheetURL    *string `json:"datasheet_url,omitempty"`
	ImageURL        *string `json:"image_url,omitempty"`
	ContentSummary  *string `json:"content_summary,omitempty"`
	Distance        float64 `json:"distance"`
	SimilarityScore float64 `json:"similarity_score"`
}

type googleEmbeddingSettings struct {
	VertexProjectID      string
	VertexLocation       string
	APIBaseURL           string
	APIVersion           string
	ServiceAccountJSON   string
	AccessToken          string
	OutputDimensionality int
	QueryTaskType        string
	DocumentTaskType     string
}

type googleServiceAccount struct {
	ProjectID   string `json:"project_id"`
	PrivateKey  string `json:"private_key"`
	ClientEmail string `json:"client_email"`
	TokenURI    string `json:"token_uri"`
}

type vertexEmbedContentRequest struct {
	Content struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"content"`
	TaskType             string `json:"taskType,omitempty"`
	Title                string `json:"title,omitempty"`
	OutputDimensionality int    `json:"outputDimensionality,omitempty"`
	AutoTruncate         bool   `json:"autoTruncate"`
}

type vertexEmbedContentResponse struct {
	Embedding struct {
		Values     []float64 `json:"values"`
		Statistics struct {
			TokenCount int32 `json:"tokenCount"`
			Truncated  bool  `json:"truncated"`
		} `json:"statistics"`
	} `json:"embedding"`
	UsageMetadata struct {
		PromptTokenCount int32 `json:"promptTokenCount"`
		TotalTokenCount  int32 `json:"totalTokenCount"`
	} `json:"usageMetadata"`
}

type catalogModelRow struct {
	ID             pgtype.UUID
	BrandName      string
	EquipmentType  string
	Name           string
	PartNumber     *string
	Specifications []byte
	DatasheetURL   *string
	ImageURL       *string
}

func NewCatalogEmbeddingService(db *pgxpool.Pool, queries *database.Queries) *CatalogEmbeddingService {
	return &CatalogEmbeddingService{
		db:      db,
		queries: queries,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func (s *CatalogEmbeddingService) ReindexAllCameraModels(ctx context.Context, tenantID, userID pgtype.UUID) (ReindexModelsResult, error) {
	config, settings, err := s.selectGoogleEmbeddingConfig(ctx, tenantID)
	if err != nil {
		return ReindexModelsResult{}, err
	}

	rows, err := s.loadCameraCatalogModels(ctx)
	if err != nil {
		return ReindexModelsResult{}, err
	}

	result := ReindexModelsResult{
		ModelConfigID: uuidToString(config.ID),
		Provider:      config.Provider,
		ModelName:     config.ModelName,
	}

	for _, row := range rows {
		result.Processed++
		if err := s.reindexCatalogModel(ctx, tenantID, userID, config, settings, row); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("%s %s: %v", row.BrandName, row.Name, err))
			continue
		}
		result.Indexed++
	}

	return result, nil
}

func (s *CatalogEmbeddingService) ReindexCameraModel(ctx context.Context, tenantID, userID, modelID pgtype.UUID) (ReindexModelsResult, error) {
	config, settings, err := s.selectGoogleEmbeddingConfig(ctx, tenantID)
	if err != nil {
		return ReindexModelsResult{}, err
	}

	row, err := s.loadCameraCatalogModelByID(ctx, modelID)
	if err != nil {
		return ReindexModelsResult{}, err
	}

	result := ReindexModelsResult{
		ModelConfigID: uuidToString(config.ID),
		Provider:      config.Provider,
		ModelName:     config.ModelName,
		Processed:     1,
	}

	if err := s.reindexCatalogModel(ctx, tenantID, userID, config, settings, row); err != nil {
		result.Failed = 1
		result.Errors = append(result.Errors, err.Error())
		return result, nil
	}

	result.Indexed = 1
	return result, nil
}

func (s *CatalogEmbeddingService) SearchCameraModels(ctx context.Context, tenantID, userID pgtype.UUID, query string, limit int) ([]SemanticModelSearchResult, error) {
	config, settings, err := s.selectGoogleEmbeddingConfig(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	query = strings.TrimSpace(query)
	if query == "" {
		return []SemanticModelSearchResult{}, nil
	}

	if limit <= 0 {
		limit = 10
	}

	embedding, _, _, err := s.embedText(
		ctx,
		tenantID,
		userID,
		config,
		settings,
		query,
		settings.QueryTaskType,
		"",
		"inventory_model_search",
		pgtype.UUID{},
	)
	if err != nil {
		return nil, err
	}

	vectorLiteral := formatVectorLiteral(embedding)
	rows, err := s.db.Query(ctx, `
		SELECT
			m.id,
			b.name AS brand_name,
			m.name AS model_name,
			m.part_number,
			m.datasheet_url,
			m.image_url,
			d.content_summary,
			(v.embedding <=> $3::halfvec) AS distance,
			GREATEST(0, 1 - (v.embedding <=> $3::halfvec)) AS similarity_score
		FROM intelligence.embedding_vectors v
		JOIN intelligence.embedding_documents d
		  ON d.id = v.document_id
		JOIN inventory.models m
		  ON m.id = d.entity_id
		JOIN inventory.brands b
		  ON b.id = m.brand_id
		JOIN inventory.equipment_types et
		  ON et.id = m.equipment_type_id
		WHERE v.tenant_id = $1
		  AND v.model_config_id = $2
		  AND v.task_type = $4
		  AND d.entity_type = $5
		  AND m.is_active = true
		  AND et.category = 'cameras'
		ORDER BY v.embedding <=> $3::halfvec ASC
		LIMIT $6
	`, tenantID, config.ID, vectorLiteral, settings.DocumentTaskType, defaultCatalogModelEntityType, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]SemanticModelSearchResult, 0)
	for rows.Next() {
		var item SemanticModelSearchResult
		var modelID pgtype.UUID
		if err := rows.Scan(
			&modelID,
			&item.BrandName,
			&item.ModelName,
			&item.PartNumber,
			&item.DatasheetURL,
			&item.ImageURL,
			&item.ContentSummary,
			&item.Distance,
			&item.SimilarityScore,
		); err != nil {
			return nil, err
		}
		item.ModelID = uuidToString(modelID)
		results = append(results, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(results) == 0 {
		var indexedCount int
		if err := s.db.QueryRow(ctx, `
			SELECT COUNT(*)
			FROM intelligence.embedding_vectors v
			JOIN intelligence.embedding_documents d
			  ON d.id = v.document_id
			WHERE v.tenant_id = $1
			  AND v.model_config_id = $2
			  AND d.entity_type = $3
		`, tenantID, config.ID, defaultCatalogModelEntityType).Scan(&indexedCount); err == nil && indexedCount == 0 {
			return nil, ErrSemanticIndexEmpty
		}
	}

	return results, nil
}

func (s *CatalogEmbeddingService) reindexCatalogModel(
	ctx context.Context,
	tenantID, userID pgtype.UUID,
	config database.IntelligenceModelConfig,
	settings googleEmbeddingSettings,
	row catalogModelRow,
) error {
	title, summary, content := buildCatalogModelDocument(row)
	embedding, tokenCount, truncated, err := s.embedText(
		ctx,
		tenantID,
		userID,
		config,
		settings,
		content,
		settings.DocumentTaskType,
		title,
		defaultCatalogModelEntityType,
		row.ID,
	)
	if err != nil {
		return err
	}

	contentHash := sha256Hex(content)
	metadata, err := json.Marshal(map[string]interface{}{
		"brand_name":   row.BrandName,
		"model_name":   row.Name,
		"part_number":  derefString(row.PartNumber),
		"token_count":  tokenCount,
		"truncated":    truncated,
		"source_table": "inventory.models",
	})
	if err != nil {
		return err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		DELETE FROM intelligence.embedding_documents
		WHERE tenant_id = $1
		  AND entity_type = $2
		  AND entity_id = $3
	`, tenantID, defaultCatalogModelEntityType, row.ID); err != nil {
		return err
	}

	var documentID pgtype.UUID
	if err := tx.QueryRow(ctx, `
		INSERT INTO intelligence.embedding_documents (
			tenant_id,
			entity_type,
			entity_id,
			source_type,
			title,
			content_text,
			content_summary,
			chunk_index,
			content_hash,
			metadata
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, 0, $8, $9
		)
		RETURNING id
	`, tenantID, defaultCatalogModelEntityType, row.ID, defaultCatalogModelSourceType, title, content, summary, contentHash, metadata).Scan(&documentID); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO intelligence.embedding_vectors (
			tenant_id,
			document_id,
			model_config_id,
			provider,
			model_name,
			task_type,
			modality,
			dimensions,
			embedding
		) VALUES (
			$1, $2, $3, $4, $5, $6, 'text', $7, $8::halfvec
		)
	`, tenantID, documentID, config.ID, config.Provider, config.ModelName, settings.DocumentTaskType, defaultEmbeddingDimensions, formatVectorLiteral(embedding)); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *CatalogEmbeddingService) loadCameraCatalogModels(ctx context.Context) ([]catalogModelRow, error) {
	rows, err := s.db.Query(ctx, `
		SELECT
			m.id,
			b.name AS brand_name,
			et.name AS equipment_type,
			m.name,
			m.part_number,
			m.specifications,
			m.datasheet_url,
			m.image_url
		FROM inventory.models m
		JOIN inventory.brands b
		  ON b.id = m.brand_id
		JOIN inventory.equipment_types et
		  ON et.id = m.equipment_type_id
		WHERE m.is_active = true
		  AND et.category = 'cameras'
		ORDER BY b.name, m.name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []catalogModelRow
	for rows.Next() {
		var item catalogModelRow
		if err := rows.Scan(
			&item.ID,
			&item.BrandName,
			&item.EquipmentType,
			&item.Name,
			&item.PartNumber,
			&item.Specifications,
			&item.DatasheetURL,
			&item.ImageURL,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *CatalogEmbeddingService) loadCameraCatalogModelByID(ctx context.Context, modelID pgtype.UUID) (catalogModelRow, error) {
	var item catalogModelRow
	err := s.db.QueryRow(ctx, `
		SELECT
			m.id,
			b.name AS brand_name,
			et.name AS equipment_type,
			m.name,
			m.part_number,
			m.specifications,
			m.datasheet_url,
			m.image_url
		FROM inventory.models m
		JOIN inventory.brands b
		  ON b.id = m.brand_id
		JOIN inventory.equipment_types et
		  ON et.id = m.equipment_type_id
		WHERE m.id = $1
		  AND m.is_active = true
		  AND et.category = 'cameras'
		LIMIT 1
	`, modelID).Scan(
		&item.ID,
		&item.BrandName,
		&item.EquipmentType,
		&item.Name,
		&item.PartNumber,
		&item.Specifications,
		&item.DatasheetURL,
		&item.ImageURL,
	)
	if err != nil {
		return catalogModelRow{}, err
	}
	return item, nil
}

func (s *CatalogEmbeddingService) selectGoogleEmbeddingConfig(ctx context.Context, tenantID pgtype.UUID) (database.IntelligenceModelConfig, googleEmbeddingSettings, error) {
	configs, err := s.queries.ListActiveModelConfigs(ctx, tenantID)
	if err != nil {
		return database.IntelligenceModelConfig{}, googleEmbeddingSettings{}, err
	}

	for _, config := range configs {
		if !strings.EqualFold(config.Provider, "google") {
			continue
		}
		modelLower := strings.ToLower(strings.TrimSpace(config.ModelName))
		if strings.Contains(modelLower, "embedding") || hasEmbeddingCapability(config.Capabilities) {
			settings, err := parseGoogleEmbeddingSettings(config)
			if err != nil {
				return database.IntelligenceModelConfig{}, googleEmbeddingSettings{}, err
			}
			if strings.TrimSpace(settings.VertexProjectID) == "" {
				return database.IntelligenceModelConfig{}, googleEmbeddingSettings{}, fmt.Errorf("google embedding config '%s' is missing vertex_project_id", config.Name)
			}
			return config, settings, nil
		}
	}

	return database.IntelligenceModelConfig{}, googleEmbeddingSettings{}, ErrGoogleEmbeddingConfigNotFound
}

func (s *CatalogEmbeddingService) embedText(
	ctx context.Context,
	tenantID, userID pgtype.UUID,
	config database.IntelligenceModelConfig,
	settings googleEmbeddingSettings,
	text, taskType, title, relatedEntityType string,
	relatedEntityID pgtype.UUID,
) ([]float64, int32, bool, error) {
	token, err := s.googleAccessToken(ctx, settings)
	if err != nil {
		return nil, 0, false, err
	}

	var reqBody vertexEmbedContentRequest
	reqBody.Content.Parts = append(reqBody.Content.Parts, struct {
		Text string `json:"text"`
	}{Text: text})
	reqBody.TaskType = taskType
	reqBody.Title = title
	reqBody.OutputDimensionality = settings.OutputDimensionality
	reqBody.AutoTruncate = true

	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, 0, false, err
	}

	startedAt := time.Now().UTC()
	apiCall, apiCallLogged := s.startEmbeddingAPICall(ctx, tenantID, userID, config, relatedEntityType, relatedEntityID, text, taskType, settings)

	endpoint := fmt.Sprintf(
		"%s/%s/projects/%s/locations/%s/publishers/google/models/%s:embedContent",
		strings.TrimRight(settings.APIBaseURL, "/"),
		strings.TrimLeft(settings.APIVersion, "/"),
		settings.VertexProjectID,
		settings.VertexLocation,
		config.ModelName,
	)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return nil, 0, false, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		s.finishEmbeddingAPICall(ctx, apiCallLogged, apiCall.ID, nil, nil, nil, startedAt, "error", err.Error())
		return nil, 0, false, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		s.finishEmbeddingAPICall(ctx, apiCallLogged, apiCall.ID, nil, nil, nil, startedAt, "error", err.Error())
		return nil, 0, false, err
	}

	if resp.StatusCode >= 300 {
		errMsg := strings.TrimSpace(string(body))
		s.finishEmbeddingAPICall(ctx, apiCallLogged, apiCall.ID, nil, nil, nil, startedAt, "error", errMsg)
		return nil, 0, false, fmt.Errorf("vertex ai embedding request failed with status %d: %s", resp.StatusCode, errMsg)
	}

	var parsed vertexEmbedContentResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		s.finishEmbeddingAPICall(ctx, apiCallLogged, apiCall.ID, nil, nil, nil, startedAt, "error", err.Error())
		return nil, 0, false, err
	}

	responseSummary, _ := json.Marshal(map[string]interface{}{
		"dimensions":  len(parsed.Embedding.Values),
		"truncated":   parsed.Embedding.Statistics.Truncated,
		"token_count": parsed.Embedding.Statistics.TokenCount,
	})

	promptTokens := parsed.UsageMetadata.PromptTokenCount
	if promptTokens == 0 {
		promptTokens = parsed.Embedding.Statistics.TokenCount
	}
	totalTokens := parsed.UsageMetadata.TotalTokenCount
	if totalTokens == 0 {
		totalTokens = promptTokens
	}

	s.finishEmbeddingAPICall(
		ctx,
		apiCallLogged,
		apiCall.ID,
		responseSummary,
		int32Ptr(promptTokens),
		int32Ptr(totalTokens),
		startedAt,
		"success",
		"",
	)

	return parsed.Embedding.Values, parsed.Embedding.Statistics.TokenCount, parsed.Embedding.Statistics.Truncated, nil
}

func (s *CatalogEmbeddingService) startEmbeddingAPICall(
	ctx context.Context,
	tenantID, userID pgtype.UUID,
	config database.IntelligenceModelConfig,
	relatedEntityType string,
	relatedEntityID pgtype.UUID,
	promptText, taskType string,
	settings googleEmbeddingSettings,
) (database.IntelligenceApiCall, bool) {
	parameters, _ := json.Marshal(map[string]interface{}{
		"task_type":             taskType,
		"output_dimensionality": settings.OutputDimensionality,
		"vertex_location":       settings.VertexLocation,
		"vertex_project_id":     settings.VertexProjectID,
		"api_version":           settings.APIVersion,
	})

	apiCall, err := s.queries.CreateAPICall(ctx, database.CreateAPICallParams{
		TenantID:          tenantID,
		ModelConfigID:     config.ID,
		PromptTemplateID:  pgtype.UUID{},
		Provider:          config.Provider,
		Model:             config.ModelName,
		PromptText:        promptText,
		SystemPrompt:      nil,
		Temperature:       pgtype.Numeric{},
		MaxTokens:         nil,
		Parameters:        parameters,
		RelatedEntityType: nullableString(relatedEntityType),
		RelatedEntityID:   relatedEntityID,
		TriggeredBy:       userID,
		Status:            "processing",
		StartedAt:         pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	})
	if err != nil {
		return database.IntelligenceApiCall{}, false
	}

	return apiCall, true
}

func (s *CatalogEmbeddingService) finishEmbeddingAPICall(
	ctx context.Context,
	logged bool,
	apiCallID pgtype.UUID,
	responseText []byte,
	promptTokens, totalTokens *int32,
	startedAt time.Time,
	status string,
	errorMessage string,
) {
	if !logged {
		return
	}

	var responseTextPtr *string
	if len(responseText) > 0 {
		text := string(responseText)
		responseTextPtr = &text
	}

	var finishReason *string
	if status == "success" {
		reason := "embedded"
		finishReason = &reason
	}

	var errPtr *string
	if strings.TrimSpace(errorMessage) != "" {
		errText := strings.TrimSpace(errorMessage)
		errPtr = &errText
	}

	var latencyMs *int32
	elapsed := int32(time.Since(startedAt).Milliseconds())
	latencyMs = &elapsed

	_, _ = s.queries.UpdateAPICallResponse(ctx, database.UpdateAPICallResponseParams{
		ID:               apiCallID,
		ResponseText:     responseTextPtr,
		FinishReason:     finishReason,
		PromptTokens:     promptTokens,
		CompletionTokens: nil,
		TotalTokens:      totalTokens,
		EstimatedCostUsd: pgtype.Numeric{},
		LatencyMs:        latencyMs,
		CompletedAt:      pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
		Status:           status,
		ErrorMessage:     errPtr,
	})
}

func (s *CatalogEmbeddingService) googleAccessToken(ctx context.Context, settings googleEmbeddingSettings) (string, error) {
	if token := strings.TrimSpace(settings.AccessToken); token != "" {
		return token, nil
	}

	serviceAccountJSON := strings.TrimSpace(settings.ServiceAccountJSON)
	if serviceAccountJSON == "" {
		return "", errors.New("missing Google service account configuration")
	}

	cacheKey := sha256Hex(serviceAccountJSON)

	s.tokenMu.Lock()
	if s.cachedToken != "" && s.cachedTokenKey == cacheKey && time.Now().UTC().Before(s.cachedTokenUntil.Add(-2*time.Minute)) {
		token := s.cachedToken
		s.tokenMu.Unlock()
		return token, nil
	}
	s.tokenMu.Unlock()

	var account googleServiceAccount
	if err := json.Unmarshal([]byte(serviceAccountJSON), &account); err != nil {
		return "", fmt.Errorf("invalid Google service account JSON: %w", err)
	}
	if account.TokenURI == "" {
		account.TokenURI = defaultGoogleTokenURI
	}

	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM([]byte(account.PrivateKey))
	if err != nil {
		return "", fmt.Errorf("invalid Google service account private key: %w", err)
	}

	now := time.Now().UTC()
	claims := jwt.MapClaims{
		"iss":   account.ClientEmail,
		"sub":   account.ClientEmail,
		"aud":   account.TokenURI,
		"scope": googleCloudPlatformScope,
		"iat":   now.Unix(),
		"exp":   now.Add(time.Hour).Unix(),
	}

	assertion := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	signedAssertion, err := assertion.SignedString(privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign Google JWT assertion: %w", err)
	}

	form := url.Values{}
	form.Set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer")
	form.Set("assertion", signedAssertion)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, account.TokenURI, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("google oauth token exchange failed with status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var parsed struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int64  `json:"expires_in"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return "", err
	}
	if parsed.AccessToken == "" {
		return "", errors.New("google oauth token exchange did not return access_token")
	}

	expiresAt := now.Add(time.Duration(parsed.ExpiresIn) * time.Second)
	s.tokenMu.Lock()
	s.cachedToken = parsed.AccessToken
	s.cachedTokenKey = cacheKey
	s.cachedTokenUntil = expiresAt
	s.tokenMu.Unlock()

	return parsed.AccessToken, nil
}

func parseGoogleEmbeddingSettings(config database.IntelligenceModelConfig) (googleEmbeddingSettings, error) {
	settingsMap := map[string]interface{}{}
	if len(config.Settings) > 0 {
		if err := json.Unmarshal(config.Settings, &settingsMap); err != nil {
			return googleEmbeddingSettings{}, fmt.Errorf("invalid settings JSON for model config '%s': %w", config.Name, err)
		}
	}

	settings := googleEmbeddingSettings{
		VertexProjectID:      firstNonEmptyString(readString(settingsMap, "vertex_project_id"), readString(settingsMap, "project_id"), os.Getenv("GOOGLE_VERTEX_PROJECT_ID")),
		VertexLocation:       firstNonEmptyString(readString(settingsMap, "vertex_location"), readString(settingsMap, "location"), os.Getenv("GOOGLE_VERTEX_LOCATION"), defaultVertexLocation),
		APIBaseURL:           firstNonEmptyString(derefString(config.ApiEndpoint), readString(settingsMap, "vertex_api_base_url")),
		APIVersion:           firstNonEmptyString(derefString(config.ApiVersion), readString(settingsMap, "vertex_api_version"), defaultVertexAPIVersion),
		ServiceAccountJSON:   extractServiceAccountJSON(settingsMap),
		AccessToken:          firstNonEmptyString(readString(settingsMap, "access_token"), derefString(config.ApiKeyEncrypted), os.Getenv("GOOGLE_VERTEX_ACCESS_TOKEN")),
		OutputDimensionality: defaultEmbeddingDimensions,
		QueryTaskType:        firstNonEmptyString(readString(settingsMap, "query_task_type"), retrievalQueryTaskType),
		DocumentTaskType:     firstNonEmptyString(readString(settingsMap, "document_task_type"), retrievalDocumentTaskType),
	}

	if settings.APIBaseURL == "" {
		settings.APIBaseURL = fmt.Sprintf("https://%s-aiplatform.googleapis.com", settings.VertexLocation)
	}

	if rawDimension := readInt(settingsMap, "output_dimensionality"); rawDimension > 0 {
		if rawDimension != defaultEmbeddingDimensions {
			return googleEmbeddingSettings{}, fmt.Errorf("output_dimensionality=%d is not supported in this first cut; expected %d", rawDimension, defaultEmbeddingDimensions)
		}
		settings.OutputDimensionality = rawDimension
	}

	if strings.TrimSpace(settings.ServiceAccountJSON) == "" {
		settings.ServiceAccountJSON = firstNonEmptyString(
			os.Getenv("GOOGLE_SERVICE_ACCOUNT_JSON"),
			decodeBase64IfPresent(os.Getenv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64")),
		)
	}

	if settings.VertexProjectID == "" && strings.TrimSpace(settings.ServiceAccountJSON) != "" {
		var account googleServiceAccount
		if err := json.Unmarshal([]byte(settings.ServiceAccountJSON), &account); err == nil && account.ProjectID != "" {
			settings.VertexProjectID = account.ProjectID
		}
	}

	return settings, nil
}

func buildCatalogModelDocument(row catalogModelRow) (string, string, string) {
	lines := []string{
		fmt.Sprintf("Marca: %s", row.BrandName),
		fmt.Sprintf("Modelo: %s", row.Name),
		fmt.Sprintf("Tipo de equipo: %s", row.EquipmentType),
	}
	if row.PartNumber != nil && strings.TrimSpace(*row.PartNumber) != "" {
		lines = append(lines, fmt.Sprintf("Numero de parte: %s", strings.TrimSpace(*row.PartNumber)))
	}
	if row.DatasheetURL != nil && strings.TrimSpace(*row.DatasheetURL) != "" {
		lines = append(lines, fmt.Sprintf("Datasheet: %s", strings.TrimSpace(*row.DatasheetURL)))
	}

	specLines := flattenSpecifications(row.Specifications)
	if len(specLines) > 0 {
		lines = append(lines, "Especificaciones:")
		lines = append(lines, specLines...)
	}

	content := strings.Join(lines, "\n")
	title := strings.TrimSpace(strings.Join([]string{row.BrandName, row.Name}, " "))
	summary := truncateString(strings.ReplaceAll(content, "\n", " | "), 280)

	return title, summary, content
}

func flattenSpecifications(raw []byte) []string {
	if len(raw) == 0 || string(raw) == "{}" || string(raw) == "null" {
		return nil
	}

	var decoded interface{}
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return nil
	}

	var lines []string
	flattenJSONValue("", decoded, &lines)
	sort.Strings(lines)
	return lines
}

func flattenJSONValue(prefix string, value interface{}, lines *[]string) {
	switch typed := value.(type) {
	case map[string]interface{}:
		keys := make([]string, 0, len(typed))
		for key := range typed {
			keys = append(keys, key)
		}
		sort.Strings(keys)
		for _, key := range keys {
			nextPrefix := key
			if prefix != "" {
				nextPrefix = prefix + "." + key
			}
			flattenJSONValue(nextPrefix, typed[key], lines)
		}
	case []interface{}:
		values := make([]string, 0, len(typed))
		for _, item := range typed {
			values = append(values, normalizeScalar(item))
		}
		*lines = append(*lines, fmt.Sprintf("%s: %s", prefix, strings.Join(values, ", ")))
	default:
		*lines = append(*lines, fmt.Sprintf("%s: %s", prefix, normalizeScalar(typed)))
	}
}

func normalizeScalar(value interface{}) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(typed)
	case bool:
		if typed {
			return "si"
		}
		return "no"
	case float64:
		return strconv.FormatFloat(typed, 'f', -1, 64)
	default:
		return fmt.Sprintf("%v", typed)
	}
}

func hasEmbeddingCapability(raw []byte) bool {
	if len(raw) == 0 {
		return false
	}
	var capabilities map[string]interface{}
	if err := json.Unmarshal(raw, &capabilities); err != nil {
		return false
	}
	switch value := capabilities["embeddings"].(type) {
	case bool:
		return value
	case string:
		return strings.EqualFold(strings.TrimSpace(value), "true")
	default:
		return false
	}
}

func extractServiceAccountJSON(settings map[string]interface{}) string {
	if value := strings.TrimSpace(readString(settings, "service_account_json")); value != "" {
		return value
	}

	if value := strings.TrimSpace(readString(settings, "service_account_json_base64")); value != "" {
		return decodeBase64IfPresent(value)
	}

	if nested, ok := settings["service_account"].(map[string]interface{}); ok {
		encoded, err := json.Marshal(nested)
		if err == nil {
			return string(encoded)
		}
	}

	return ""
}

func formatVectorLiteral(values []float64) string {
	var builder strings.Builder
	builder.Grow(len(values) * 12)
	builder.WriteByte('[')
	for i, value := range values {
		if i > 0 {
			builder.WriteByte(',')
		}
		builder.WriteString(strconv.FormatFloat(value, 'f', -1, 64))
	}
	builder.WriteByte(']')
	return builder.String()
}

func sha256Hex(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func truncateString(value string, max int) string {
	if max <= 0 || len(value) <= max {
		return value
	}
	return strings.TrimSpace(value[:max-3]) + "..."
}

func readString(values map[string]interface{}, key string) string {
	value, ok := values[key]
	if !ok || value == nil {
		return ""
	}
	switch typed := value.(type) {
	case string:
		return strings.TrimSpace(typed)
	default:
		return strings.TrimSpace(fmt.Sprintf("%v", typed))
	}
}

func readInt(values map[string]interface{}, key string) int {
	value, ok := values[key]
	if !ok || value == nil {
		return 0
	}
	switch typed := value.(type) {
	case float64:
		return int(typed)
	case int:
		return typed
	case int32:
		return int(typed)
	case int64:
		return int(typed)
	case string:
		parsed, _ := strconv.Atoi(strings.TrimSpace(typed))
		return parsed
	default:
		return 0
	}
}

func decodeBase64IfPresent(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		return ""
	}
	return string(decoded)
}

func firstNonEmptyString(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func nullableString(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	trimmed := strings.TrimSpace(value)
	return &trimmed
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func uuidToString(value pgtype.UUID) string {
	if !value.Valid {
		return ""
	}
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		value.Bytes[0:4],
		value.Bytes[4:6],
		value.Bytes[6:8],
		value.Bytes[8:10],
		value.Bytes[10:16],
	)
}

func int32Ptr(value int32) *int32 {
	return &value
}
