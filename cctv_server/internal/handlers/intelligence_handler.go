package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	catalogintelligence "github.com/symtickets/cctv_server/internal/intelligence"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type IntelligenceHandler struct {
	db                *pgxpool.Pool
	queries           *database.Queries
	catalogEmbeddings *catalogintelligence.CatalogEmbeddingService
}

func NewIntelligenceHandler(db *pgxpool.Pool, queries *database.Queries, catalogEmbeddings *catalogintelligence.CatalogEmbeddingService) *IntelligenceHandler {
	return &IntelligenceHandler{
		db:                db,
		queries:           queries,
		catalogEmbeddings: catalogEmbeddings,
	}
}

// ListModelConfigs godoc
// @Summary List AI model configurations
// @Description Get list of AI model configurations for tenant
// @Tags intelligence
// @Produce json
// @Success 200 {array} ModelConfigResponse
// @Failure 500 {object} ErrorResponse
// @Router /intelligence/models [get]
// @Security BearerAuth
func (h *IntelligenceHandler) ListModelConfigs(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	pgTenantID, _ := toPgUUID(tenantID)

	configs, err := h.queries.ListModelConfigs(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list model configs"})
		return
	}

	responses := make([]ModelConfigResponse, len(configs))
	for i, config := range configs {
		responses[i] = modelConfigToResponse(config)
	}

	c.JSON(http.StatusOK, responses)
}

// GetModelConfig godoc
// @Summary Get AI model configuration
// @Description Get a single AI model configuration by ID
// @Tags intelligence
// @Produce json
// @Param id path string true "Model config ID"
// @Success 200 {object} ModelConfigResponse
// @Failure 404 {object} ErrorResponse
// @Router /intelligence/models/{id} [get]
// @Security BearerAuth
func (h *IntelligenceHandler) GetModelConfig(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	modelID := c.Param("id")

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgModelID, err := toPgUUID(modelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid model ID"})
		return
	}

	config, err := h.queries.GetModelConfig(c.Request.Context(), pgModelID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "model config not found"})
		return
	}

	c.JSON(http.StatusOK, modelConfigToResponse(config))
}

// CreateModelConfig godoc
// @Summary Create AI model configuration
// @Description Create a tenant AI model configuration
// @Tags intelligence
// @Accept json
// @Produce json
// @Param body body CreateModelConfigRequest true "Model config payload"
// @Success 201 {object} ModelConfigResponse
// @Failure 400 {object} ErrorResponse
// @Router /intelligence/models [post]
// @Security BearerAuth
func (h *IntelligenceHandler) CreateModelConfig(c *gin.Context) {
	var req CreateModelConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgUserID, err := toPgUUID(userID)
	if err != nil {
		pgUserID = pgtype.UUID{}
	}

	capabilities, err := marshalJSONMap(req.Capabilities)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid capabilities"})
		return
	}
	settings, err := marshalJSONMap(req.Settings)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid settings"})
		return
	}

	config, err := h.queries.CreateModelConfig(c.Request.Context(), database.CreateModelConfigParams{
		TenantID:            pgTenantID,
		Name:                strings.TrimSpace(req.Name),
		Provider:            strings.TrimSpace(req.Provider),
		ModelName:           strings.TrimSpace(req.ModelName),
		ApiKeyEncrypted:     normalizeOptionalString(req.APIKeyEncrypted),
		ApiEndpoint:         normalizeOptionalString(req.APIEndpoint),
		ApiVersion:          normalizeOptionalString(req.APIVersion),
		DefaultTemperature:  numericFromOptionalFloat(req.DefaultTemperature),
		DefaultMaxTokens:    req.DefaultMaxTokens,
		DefaultTopP:         numericFromOptionalFloat(req.DefaultTopP),
		MaxTokensPerRequest: req.MaxTokensPerRequest,
		MaxRequestsPerDay:   req.MaxRequestsPerDay,
		MaxRequestsPerHour:  req.MaxRequestsPerHour,
		MonthlyBudgetUsd:    numericFromOptionalFloat(req.MonthlyBudgetUSD),
		Description:         normalizeOptionalString(req.Description),
		Capabilities:        capabilities,
		Settings:            settings,
		CreatedBy:           pgUserID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create model config"})
		return
	}

	if req.IsDefault != nil && *req.IsDefault {
		_ = h.queries.SetDefaultModelConfig(c.Request.Context(), pgTenantID, config.ID)
		config, _ = h.queries.GetModelConfig(c.Request.Context(), config.ID, pgTenantID)
	}
	if req.IsActive != nil && !*req.IsActive {
		config, _ = h.queries.ToggleModelConfigActive(c.Request.Context(), config.ID, req.IsActive)
	}

	c.JSON(http.StatusCreated, modelConfigToResponse(config))
}

// UpdateModelConfig godoc
// @Summary Update AI model configuration
// @Description Update a tenant AI model configuration
// @Tags intelligence
// @Accept json
// @Produce json
// @Param id path string true "Model config ID"
// @Param body body UpdateModelConfigRequest true "Model config payload"
// @Success 200 {object} ModelConfigResponse
// @Failure 400 {object} ErrorResponse
// @Router /intelligence/models/{id} [put]
// @Security BearerAuth
func (h *IntelligenceHandler) UpdateModelConfig(c *gin.Context) {
	var req UpdateModelConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := middleware.GetTenantID(c)
	modelID := c.Param("id")
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgModelID, err := toPgUUID(modelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid model ID"})
		return
	}

	capabilities, err := marshalJSONMap(req.Capabilities)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid capabilities"})
		return
	}
	settings, err := marshalJSONMap(req.Settings)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid settings"})
		return
	}

	var updatedID string
	err = h.db.QueryRow(
		c.Request.Context(),
		`UPDATE intelligence.model_configs
		 SET name = $3,
		     provider = $4,
		     model_name = $5,
		     api_key_encrypted = CASE
		         WHEN $6::text IS NULL OR btrim($6::text) = '' THEN api_key_encrypted
		         ELSE $6
		     END,
		     api_endpoint = $7,
		     api_version = $8,
		     default_temperature = $9,
		     default_max_tokens = $10,
		     default_top_p = $11,
		     max_tokens_per_request = $12,
		     max_requests_per_day = $13,
		     max_requests_per_hour = $14,
		     monthly_budget_usd = $15,
		     description = $16,
		     capabilities = $17,
		     settings = $18,
		     updated_at = CURRENT_TIMESTAMP
		 WHERE id = $1
		   AND tenant_id = $2
		 RETURNING id::text`,
		pgModelID,
		pgTenantID,
		strings.TrimSpace(req.Name),
		strings.TrimSpace(req.Provider),
		strings.TrimSpace(req.ModelName),
		normalizeOptionalString(req.APIKeyEncrypted),
		normalizeOptionalString(req.APIEndpoint),
		normalizeOptionalString(req.APIVersion),
		numericFromOptionalFloat(req.DefaultTemperature),
		req.DefaultMaxTokens,
		numericFromOptionalFloat(req.DefaultTopP),
		req.MaxTokensPerRequest,
		req.MaxRequestsPerDay,
		req.MaxRequestsPerHour,
		numericFromOptionalFloat(req.MonthlyBudgetUSD),
		normalizeOptionalString(req.Description),
		capabilities,
		settings,
	).Scan(&updatedID)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "model config not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update model config"})
		return
	}

	if req.IsDefault != nil && *req.IsDefault {
		_ = h.queries.SetDefaultModelConfig(c.Request.Context(), pgTenantID, pgModelID)
	}
	if req.IsActive != nil {
		_, _ = h.queries.ToggleModelConfigActive(c.Request.Context(), pgModelID, req.IsActive)
	}

	config, err := h.queries.GetModelConfig(c.Request.Context(), pgModelID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reload model config"})
		return
	}

	c.JSON(http.StatusOK, modelConfigToResponse(config))
}

// DeleteModelConfig godoc
// @Summary Delete AI model configuration
// @Description Delete a tenant AI model configuration
// @Tags intelligence
// @Produce json
// @Param id path string true "Model config ID"
// @Success 204
// @Failure 400 {object} ErrorResponse
// @Router /intelligence/models/{id} [delete]
// @Security BearerAuth
func (h *IntelligenceHandler) DeleteModelConfig(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	modelID := c.Param("id")
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgModelID, err := toPgUUID(modelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid model ID"})
		return
	}

	if err := h.queries.DeleteModelConfig(c.Request.Context(), pgModelID, pgTenantID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete model config"})
		return
	}

	c.Status(http.StatusNoContent)
}

// SetDefaultModelConfig godoc
// @Summary Set default AI model configuration
// @Description Marks a model configuration as the tenant default
// @Tags intelligence
// @Produce json
// @Param id path string true "Model config ID"
// @Success 200 {object} ModelConfigResponse
// @Failure 400 {object} ErrorResponse
// @Router /intelligence/models/{id}/set-default [patch]
// @Security BearerAuth
func (h *IntelligenceHandler) SetDefaultModelConfig(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	modelID := c.Param("id")
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgModelID, err := toPgUUID(modelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid model ID"})
		return
	}

	if err := h.queries.SetDefaultModelConfig(c.Request.Context(), pgTenantID, pgModelID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set default model config"})
		return
	}

	config, err := h.queries.GetModelConfig(c.Request.Context(), pgModelID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reload model config"})
		return
	}

	c.JSON(http.StatusOK, modelConfigToResponse(config))
}

// ToggleModelConfigActive godoc
// @Summary Toggle AI model configuration active state
// @Description Activate or deactivate a tenant AI model configuration
// @Tags intelligence
// @Accept json
// @Produce json
// @Param id path string true "Model config ID"
// @Param body body map[string]bool true "Active state"
// @Success 200 {object} ModelConfigResponse
// @Failure 400 {object} ErrorResponse
// @Router /intelligence/models/{id}/active [patch]
// @Security BearerAuth
func (h *IntelligenceHandler) ToggleModelConfigActive(c *gin.Context) {
	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := middleware.GetTenantID(c)
	modelID := c.Param("id")
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgModelID, err := toPgUUID(modelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid model ID"})
		return
	}

	if _, err := h.queries.GetModelConfig(c.Request.Context(), pgModelID, pgTenantID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "model config not found"})
		return
	}

	config, err := h.queries.ToggleModelConfigActive(c.Request.Context(), pgModelID, &req.IsActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update active state"})
		return
	}

	c.JSON(http.StatusOK, modelConfigToResponse(config))
}

// ListPromptTemplates godoc
// @Summary List prompt templates
// @Description Get list of available prompt templates
// @Tags intelligence
// @Produce json
// @Param category query string false "Filter by category"
// @Success 200 {array} PromptTemplateResponse
// @Failure 500 {object} ErrorResponse
// @Router /intelligence/templates [get]
// @Security BearerAuth
func (h *IntelligenceHandler) ListPromptTemplates(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	category := c.Query("category")

	pgTenantID, _ := toPgUUID(tenantID)

	var templates []database.IntelligencePromptTemplate
	var err error

	if category != "" {
		templates, err = h.queries.ListPromptTemplatesByCategory(c.Request.Context(), category, pgTenantID)
	} else {
		templates, err = h.queries.ListPromptTemplates(c.Request.Context(), pgTenantID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list templates"})
		return
	}

	responses := make([]PromptTemplateResponse, len(templates))
	for i, template := range templates {
		var variables []string
		json.Unmarshal(template.Variables, &variables)

		responses[i] = PromptTemplateResponse{
			ID:                 pgUUIDToString(template.ID),
			Name:               template.Name,
			Category:           template.Category,
			SystemPrompt:       template.SystemPrompt,
			UserPromptTemplate: template.UserPromptTemplate,
			MaxTokens:          template.MaxTokens,
			ResponseFormat:     template.ResponseFormat,
			Description:        template.Description,
			Variables:          variables,
			IsActive:           boolValue(template.IsActive),
			Version:            int32Value(template.Version),
			CreatedAt:          template.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// ListAnalyses godoc
// @Summary List AI analyses
// @Description Get list of AI analyses
// @Tags intelligence
// @Produce json
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param type query string false "Filter by analysis type"
// @Success 200 {array} AnalysisResponse
// @Failure 500 {object} ErrorResponse
// @Router /intelligence/analyses [get]
// @Security BearerAuth
func (h *IntelligenceHandler) ListAnalyses(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	analysisType := c.DefaultQuery("type", "")

	pgTenantID, _ := toPgUUID(tenantID)

	analyses, err := h.queries.ListAnalysesByType(
		c.Request.Context(),
		pgTenantID,
		analysisType,
		int32(limit),
		int32(offset),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list analyses"})
		return
	}

	responses := make([]AnalysisResponse, len(analyses))
	for i, analysis := range analyses {
		var result map[string]interface{}
		json.Unmarshal(analysis.Result, &result)

		responses[i] = AnalysisResponse{
			ID:           pgUUIDToString(analysis.ID),
			AnalysisType: analysis.AnalysisType,
			InputType:    analysis.InputType,
			Result:       result,
			ModelUsed:    analysis.ModelUsed,
			IsVerified:   boolValue(analysis.IsVerified),
			IsCorrect:    analysis.IsCorrect,
			CreatedAt:    analysis.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// GetUsageStats godoc
// @Summary Get AI usage statistics
// @Description Get usage and cost statistics for AI
// @Tags intelligence
// @Produce json
// @Success 200 {object} UsageStatsResponse
// @Failure 500 {object} ErrorResponse
// @Router /intelligence/usage [get]
// @Security BearerAuth
func (h *IntelligenceHandler) GetUsageStats(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	pgTenantID, _ := toPgUUID(tenantID)

	totalTokens, err := h.queries.GetTotalTokensUsed(c.Request.Context(), pgTenantID)
	if err != nil {
		totalTokens = 0
	}

	totalCostInterface, err := h.queries.GetTotalCost(c.Request.Context(), pgTenantID)
	totalCost := 0.0
	if err == nil && totalCostInterface != nil {
		// Type assertion para convertir interface{} a float64
		switch v := totalCostInterface.(type) {
		case float64:
			totalCost = v
		case string:
			// Si viene como string, intentar parsear
			totalCost = 0.0
		}
	}

	// Estadísticas simplificadas
	response := UsageStatsResponse{
		TotalAPICalls:   0, // Requeriría query adicional
		SuccessfulCalls: 0,
		FailedCalls:     0,
		TotalTokens:     totalTokens,
		TotalCostUSD:    totalCost,
		UsageByProvider: make(map[string]interface{}),
	}

	c.JSON(http.StatusOK, response)
}

// ReindexCatalogModelEmbeddings godoc
// @Summary Reindex semantic embeddings for all catalog camera models
// @Description Generates Gemini embeddings for active camera models in the global catalog for the authenticated tenant
// @Tags intelligence
// @Produce json
// @Success 200 {object} EmbeddingReindexResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /intelligence/embeddings/reindex/models [post]
// @Security BearerAuth
func (h *IntelligenceHandler) ReindexCatalogModelEmbeddings(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgUserID, err := toPgUUID(userID)
	if err != nil {
		pgUserID = pgtype.UUID{}
	}

	result, err := h.catalogEmbeddings.ReindexAllCameraModels(c.Request.Context(), pgTenantID, pgUserID)
	if err != nil {
		if errors.Is(err, catalogintelligence.ErrGoogleEmbeddingConfigNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reindex semantic embeddings", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, EmbeddingReindexResponse{
		ModelConfigID: result.ModelConfigID,
		Provider:      result.Provider,
		ModelName:     result.ModelName,
		Processed:     result.Processed,
		Indexed:       result.Indexed,
		Failed:        result.Failed,
		Errors:        result.Errors,
	})
}

// ReindexSingleCatalogModelEmbedding godoc
// @Summary Reindex semantic embedding for a single camera model
// @Description Generates Gemini embedding for a single active camera model in the global catalog
// @Tags intelligence
// @Produce json
// @Param id path string true "Model ID"
// @Success 200 {object} EmbeddingReindexResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /intelligence/embeddings/reindex/model/{id} [post]
// @Security BearerAuth
func (h *IntelligenceHandler) ReindexSingleCatalogModelEmbedding(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)
	modelID := c.Param("id")

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgUserID, err := toPgUUID(userID)
	if err != nil {
		pgUserID = pgtype.UUID{}
	}
	pgModelID, err := toPgUUID(modelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid model ID"})
		return
	}

	result, err := h.catalogEmbeddings.ReindexCameraModel(c.Request.Context(), pgTenantID, pgUserID, pgModelID)
	if err != nil {
		if errors.Is(err, catalogintelligence.ErrGoogleEmbeddingConfigNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reindex semantic embedding", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, EmbeddingReindexResponse{
		ModelConfigID: result.ModelConfigID,
		Provider:      result.Provider,
		ModelName:     result.ModelName,
		Processed:     result.Processed,
		Indexed:       result.Indexed,
		Failed:        result.Failed,
		Errors:        result.Errors,
	})
}

func modelConfigToResponse(config database.IntelligenceModelConfig) ModelConfigResponse {
	var capabilities map[string]interface{}
	if len(config.Capabilities) > 0 {
		_ = json.Unmarshal(config.Capabilities, &capabilities)
	}
	if capabilities == nil {
		capabilities = map[string]interface{}{}
	}

	var settings map[string]interface{}
	if len(config.Settings) > 0 {
		_ = json.Unmarshal(config.Settings, &settings)
	}
	if settings == nil {
		settings = map[string]interface{}{}
	}

	return ModelConfigResponse{
		ID:                  pgUUIDToString(config.ID),
		TenantID:            pgUUIDToString(config.TenantID),
		Name:                config.Name,
		Provider:            config.Provider,
		ModelName:           config.ModelName,
		APIEndpoint:         config.ApiEndpoint,
		APIVersion:          config.ApiVersion,
		HasAPIKey:           config.ApiKeyEncrypted != nil && strings.TrimSpace(*config.ApiKeyEncrypted) != "",
		DefaultTemperature:  numericPtrToFloat(config.DefaultTemperature),
		DefaultMaxTokens:    config.DefaultMaxTokens,
		DefaultTopP:         numericPtrToFloat(config.DefaultTopP),
		MaxTokensPerRequest: config.MaxTokensPerRequest,
		MaxRequestsPerDay:   config.MaxRequestsPerDay,
		MaxRequestsPerHour:  config.MaxRequestsPerHour,
		MonthlyBudgetUSD:    numericPtrToFloat(config.MonthlyBudgetUsd),
		IsActive:            boolValue(config.IsActive),
		IsDefault:           boolValue(config.IsDefault),
		Description:         config.Description,
		Capabilities:        capabilities,
		Settings:            settings,
		CreatedAt:           config.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:           config.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func marshalJSONMap(value map[string]interface{}) ([]byte, error) {
	if value == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(value)
}

func numericPtrToFloat(n pgtype.Numeric) *float64 {
	if !n.Valid {
		return nil
	}
	value, err := n.Float64Value()
	if err != nil {
		return nil
	}
	return &value.Float64
}

func numericFromOptionalFloat(value *float64) pgtype.Numeric {
	if value == nil {
		return pgtype.Numeric{}
	}
	return numericValue(*value)
}

func normalizeOptionalString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
