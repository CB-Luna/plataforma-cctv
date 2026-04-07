package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type SettingsHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
}

func NewSettingsHandler(db *pgxpool.Pool, queries *database.Queries) *SettingsHandler {
	return &SettingsHandler{
		db:      db,
		queries: queries,
	}
}

// GetSettings godoc
// @Summary Get tenant settings
// @Description Get configuration and settings for the authenticated tenant
// @Tags settings
// @Accept json
// @Produce json
// @Success 200 {object} TenantSettingsResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /settings [get]
// @Security BearerAuth
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	tenant, err := h.queries.GetTenantByID(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tenant not found"})
		return
	}

	// Parse settings JSONB
	var settings map[string]interface{}
	if len(tenant.Settings) > 0 {
		if err := json.Unmarshal(tenant.Settings, &settings); err != nil {
			settings = make(map[string]interface{})
		}
	} else {
		settings = make(map[string]interface{})
	}

	response := TenantSettingsResponse{
		ID:               pgUUIDToString(tenant.ID),
		Name:             tenant.Name,
		Slug:             tenant.Slug,
		Domain:           tenant.Domain,
		LogoURL:          tenant.LogoUrl,
		PrimaryColor:     tenant.PrimaryColor,
		SecondaryColor:   tenant.SecondaryColor,
		TertiaryColor:    tenant.TertiaryColor,
		IsActive:         boolValue(tenant.IsActive),
		Settings:         settings,
		SubscriptionPlan: tenant.SubscriptionPlan,
		MaxUsers:         tenant.MaxUsers,
		MaxClients:       tenant.MaxClients,
		CreatedAt:        tenant.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:        tenant.UpdatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// UpdateSettings godoc
// @Summary Update tenant settings
// @Description Update configuration settings for the authenticated tenant
// @Tags settings
// @Accept json
// @Produce json
// @Param settings body UpdateSettingsRequest true "Settings to update"
// @Success 200 {object} TenantSettingsResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /settings [put]
// @Security BearerAuth
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	// Convert settings map to JSONB
	settingsJSON, err := json.Marshal(req.Settings)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid settings format"})
		return
	}

	tenant, err := h.queries.UpdateTenantSettings(
		c.Request.Context(),
		pgTenantID,
		settingsJSON,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update settings"})
		return
	}

	// Parse settings back
	var settings map[string]interface{}
	if len(tenant.Settings) > 0 {
		json.Unmarshal(tenant.Settings, &settings)
	}

	response := TenantSettingsResponse{
		ID:               pgUUIDToString(tenant.ID),
		Name:             tenant.Name,
		Slug:             tenant.Slug,
		Domain:           tenant.Domain,
		LogoURL:          tenant.LogoUrl,
		PrimaryColor:     tenant.PrimaryColor,
		SecondaryColor:   tenant.SecondaryColor,
		TertiaryColor:    tenant.TertiaryColor,
		IsActive:         boolValue(tenant.IsActive),
		Settings:         settings,
		SubscriptionPlan: tenant.SubscriptionPlan,
		MaxUsers:         tenant.MaxUsers,
		MaxClients:       tenant.MaxClients,
		CreatedAt:        tenant.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:        tenant.UpdatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// UpdateTheme godoc
// @Summary Update tenant theme
// @Description Update visual theme (colors, logo) for the authenticated tenant
// @Tags settings
// @Accept json
// @Produce json
// @Param theme body UpdateThemeRequest true "Theme to update"
// @Success 200 {object} TenantSettingsResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /settings/theme [put]
// @Security BearerAuth
func (h *SettingsHandler) UpdateTheme(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	var req UpdateThemeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	tenant, err := h.queries.UpdateTenantTheme(
		c.Request.Context(),
		pgTenantID,
		req.PrimaryColor,
		req.SecondaryColor,
		req.TertiaryColor,
		req.LogoURL,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update theme"})
		return
	}

	// Parse settings
	var settings map[string]interface{}
	if len(tenant.Settings) > 0 {
		json.Unmarshal(tenant.Settings, &settings)
	}

	response := TenantSettingsResponse{
		ID:               pgUUIDToString(tenant.ID),
		Name:             tenant.Name,
		Slug:             tenant.Slug,
		Domain:           tenant.Domain,
		LogoURL:          tenant.LogoUrl,
		PrimaryColor:     tenant.PrimaryColor,
		SecondaryColor:   tenant.SecondaryColor,
		TertiaryColor:    tenant.TertiaryColor,
		IsActive:         boolValue(tenant.IsActive),
		Settings:         settings,
		SubscriptionPlan: tenant.SubscriptionPlan,
		MaxUsers:         tenant.MaxUsers,
		MaxClients:       tenant.MaxClients,
		CreatedAt:        tenant.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:        tenant.UpdatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}
