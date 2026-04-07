package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type StorageConfigHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
}

func NewStorageConfigHandler(db *pgxpool.Pool, queries *database.Queries) *StorageConfigHandler {
	return &StorageConfigHandler{
		db:      db,
		queries: queries,
	}
}

// ListProviders godoc
// @Summary List storage providers
// @Description Get all active storage providers
// @Tags storage
// @Produce json
// @Success 200 {array} StorageProviderResponse
// @Router /storage/providers [get]
func (h *StorageConfigHandler) ListProviders(c *gin.Context) {
	providers, err := h.queries.ListStorageProviders(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list providers"})
		return
	}

	responses := make([]StorageProviderResponse, len(providers))
	for i, p := range providers {
		var schema map[string]interface{}
		json.Unmarshal(p.ConfigurationSchema, &schema)

		responses[i] = StorageProviderResponse{
			ID:                  p.ID,
			ProviderName:        p.ProviderName,
			DisplayName:         p.DisplayName,
			Description:         p.Description,
			ProviderType:        p.ProviderType,
			IsActive:            boolValue(p.IsActive),
			SupportsCollections: boolValue(p.SupportsCollections),
			ConfigurationSchema: schema,
		}
	}

	c.JSON(http.StatusOK, responses)
}

// ListConfigurations godoc
// @Summary List storage configurations
// @Description Get all storage configurations for the tenant
// @Tags storage
// @Produce json
// @Success 200 {array} StorageConfigurationResponse
// @Router /storage/configurations [get]
func (h *StorageConfigHandler) ListConfigurations(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	pgTenantID, _ := toPgUUID(tenantID)

	configs, err := h.queries.ListStorageConfigurations(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list configurations"})
		return
	}

	responses := make([]StorageConfigurationResponse, 0, len(configs))
	for _, sc := range configs {
		var addConfig, modMappings map[string]interface{}
		json.Unmarshal(sc.AdditionalConfig, &addConfig)
		json.Unmarshal(sc.ModuleMappings, &modMappings)

		responses = append(responses, StorageConfigurationResponse{
			ID:                  pgUUIDToString(sc.ID),
			TenantID:            pgUUIDToString(sc.TenantID),
			ProviderID:          sc.ProviderID,
			ProviderName:        sc.ProviderName,
			ProviderDisplayName: sc.ProviderDisplayName,
			ConfigName:          sc.ConfigName,
			IsDefault:           boolValue(sc.IsDefault),
			IsActive:            boolValue(sc.IsActive),
			Host:                sc.Host,
			Port:                sc.Port,
			DatabaseName:        sc.DatabaseName,
			Username:            sc.Username,
			PasswordText:        sc.PasswordText,
			ApiKey:              sc.ApiKey,
			SecretKey:           sc.SecretKey,
			BaseUrl:             sc.BaseUrl,
			BucketName:          sc.BucketName,
			Region:              sc.Region,
			ProjectID:           sc.ProjectID,
			AdditionalConfig:    addConfig,
			ModuleMappings:      modMappings,
			CreatedAt:           sc.CreatedAt.Time.String(),
			UpdatedAt:           sc.UpdatedAt.Time.String(),
		})
	}

	c.JSON(http.StatusOK, responses)
}

// CreateConfiguration godoc
// @Summary Create a new storage configuration
// @Description Create a new storage configuration for the tenant
// @Tags storage
// @Accept json
// @Produce json
// @Param configuration body CreateStorageConfigurationRequest true "Storage configuration data"
// @Success 201 {object} StorageConfigurationResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /storage/configurations [post]
// @Security BearerAuth
func (h *StorageConfigHandler) CreateConfiguration(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	pgTenantID, _ := toPgUUID(tenantID)

	var req CreateStorageConfigurationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	addConfig, _ := json.Marshal(req.AdditionalConfig)

	config, err := h.queries.CreateStorageConfiguration(c.Request.Context(), database.CreateStorageConfigurationParams{
		TenantID:         pgTenantID,
		ProviderID:       req.ProviderID,
		ConfigName:       req.ConfigName,
		IsDefault:        boolPtr(req.IsDefault),
		IsActive:         boolPtr(true),
		Host:             req.Host,
		Port:             req.Port,
		DatabaseName:     req.DatabaseName,
		Username:         req.Username,
		PasswordText:     req.PasswordText,
		ApiKey:           req.ApiKey,
		SecretKey:        req.SecretKey,
		BaseUrl:          req.BaseUrl,
		BucketName:       req.BucketName,
		Region:           req.Region,
		ProjectID:        req.ProjectID,
		AdditionalConfig: addConfig,
		ModuleMappings:   []byte("{}"),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create configuration: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, config)
}

// UpdateConfiguration godoc
// @Summary Update a storage configuration
// @Description Update an existing storage configuration
// @Tags storage
// @Accept json
// @Produce json
// @Param id path string true "Configuration ID (UUID)"
// @Param configuration body UpdateStorageConfigurationRequest true "Updated storage configuration data"
// @Success 200 {object} StorageConfigurationResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /storage/configurations/{id} [put]
// @Security BearerAuth
func (h *StorageConfigHandler) UpdateConfiguration(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	pgTenantID, _ := toPgUUID(tenantID)
	configID := c.Param("id")
	pgConfigID, _ := toPgUUID(configID)

	var req UpdateStorageConfigurationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	addConfig, _ := json.Marshal(req.AdditionalConfig)

	config, err := h.queries.UpdateStorageConfiguration(c.Request.Context(), database.UpdateStorageConfigurationParams{
		ID:               pgConfigID,
		TenantID:         pgTenantID,
		ConfigName:       req.ConfigName,
		IsDefault:        boolPtr(req.IsDefault),
		IsActive:         boolPtr(req.IsActive),
		Host:             req.Host,
		Port:             req.Port,
		DatabaseName:     req.DatabaseName,
		Username:         req.Username,
		PasswordText:     req.PasswordText,
		ApiKey:           req.ApiKey,
		SecretKey:        req.SecretKey,
		BaseUrl:          req.BaseUrl,
		BucketName:       req.BucketName,
		Region:           req.Region,
		ProjectID:        req.ProjectID,
		AdditionalConfig: addConfig,
		ModuleMappings:   []byte("{}"), // Se maneja por separado si es necesario
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update configuration"})
		return
	}

	c.JSON(http.StatusOK, config)
}

// DeleteConfiguration godoc
// @Summary Delete a storage configuration
// @Description Delete a storage configuration by ID
// @Tags storage
// @Param id path string true "Configuration ID (UUID)"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /storage/configurations/{id} [delete]
// @Security BearerAuth
func (h *StorageConfigHandler) DeleteConfiguration(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	pgTenantID, _ := toPgUUID(tenantID)
	configID := c.Param("id")
	pgConfigID, _ := toPgUUID(configID)

	err := h.queries.DeleteStorageConfiguration(c.Request.Context(), pgConfigID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete configuration"})
		return
	}

	c.Status(http.StatusNoContent)
}
