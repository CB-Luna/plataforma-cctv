package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
	objectstorage "github.com/symtickets/cctv_server/internal/storage"
)

type TenantHandler struct {
	db       *pgxpool.Pool
	queries  *database.Queries
	storage  *objectstorage.MinIOService
}

func NewTenantHandler(db *pgxpool.Pool, queries *database.Queries, storage *objectstorage.MinIOService) *TenantHandler {
	return &TenantHandler{
		db:       db,
		queries:  queries,
		storage:  storage,
	}
}

// ListTenants godoc
// @Summary List all tenants
// @Description Get paginated list of all tenants (super-admin only)
// @Tags tenants
// @Accept json
// @Produce json
// @Param limit query int false "Number of items to return" default(20)
// @Param offset query int false "Number of items to skip" default(0)
// @Success 200 {array} TenantResponse
// @Failure 500 {object} ErrorResponse
// @Router /tenants [get]
// @Security BearerAuth
func (h *TenantHandler) ListTenants(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	tenants, err := h.queries.ListTenants(c.Request.Context(), int32(limit), int32(offset))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tenants"})
		return
	}

	responses := make([]TenantResponse, len(tenants))
	for i, tenant := range tenants {
		var settings map[string]interface{}
		if len(tenant.Settings) > 0 {
			json.Unmarshal(tenant.Settings, &settings)
		} else {
			settings = make(map[string]interface{})
		}

		responses[i] = TenantResponse{
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
	}

	c.JSON(http.StatusOK, responses)
}

// GetTenant godoc
// @Summary Get a tenant by ID
// @Description Get detailed information about a specific tenant
// @Tags tenants
// @Accept json
// @Produce json
// @Param id path string true "Tenant ID (UUID)"
// @Success 200 {object} TenantResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /tenants/{id} [get]
// @Security BearerAuth
func (h *TenantHandler) GetTenant(c *gin.Context) {
	tenantID := c.Param("id")

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

	var settings map[string]interface{}
	if len(tenant.Settings) > 0 {
		json.Unmarshal(tenant.Settings, &settings)
	} else {
		settings = make(map[string]interface{})
	}

	response := TenantResponse{
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

// CreateTenant godoc
// @Summary Create a new tenant
// @Description Create a new tenant (super-admin only)
// @Tags tenants
// @Accept json
// @Produce json
// @Param tenant body CreateTenantRequest true "Tenant information"
// @Success 201 {object} TenantResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tenants [post]
// @Security BearerAuth
func (h *TenantHandler) CreateTenant(c *gin.Context) {
	var req CreateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Preparar settings
	settingsJSON := []byte("{}")
	if req.Settings != nil {
		var err error
		settingsJSON, err = json.Marshal(req.Settings)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid settings format"})
			return
		}
	}

	// Valores por defecto
	defaultPrimaryColor := "#1976D2"
	if req.PrimaryColor == nil {
		req.PrimaryColor = &defaultPrimaryColor
	}

	defaultSecondaryColor := "#424242"
	if req.SecondaryColor == nil {
		req.SecondaryColor = &defaultSecondaryColor
	}

	defaultTertiaryColor := "#757575"
	if req.TertiaryColor == nil {
		req.TertiaryColor = &defaultTertiaryColor
	}

	defaultPlan := "basic"
	if req.SubscriptionPlan == nil {
		req.SubscriptionPlan = &defaultPlan
	}

	defaultMaxUsers := int32(10)
	if req.MaxUsers == nil {
		req.MaxUsers = &defaultMaxUsers
	}

	defaultMaxClients := int32(50)
	if req.MaxClients == nil {
		req.MaxClients = &defaultMaxClients
	}

	tenant, err := h.queries.CreateTenant(
		c.Request.Context(),
		database.CreateTenantParams{
			Name:             req.Name,
			Slug:             req.Slug,
			Domain:           req.Domain,
			LogoUrl:          req.LogoURL,
			PrimaryColor:     req.PrimaryColor,
			SecondaryColor:   req.SecondaryColor,
			TertiaryColor:    req.TertiaryColor,
			Settings:         settingsJSON,
			SubscriptionPlan: req.SubscriptionPlan,
			MaxUsers:         req.MaxUsers,
			MaxClients:       req.MaxClients,
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create tenant"})
		return
	}

	var settings map[string]interface{}
	if len(tenant.Settings) > 0 {
		json.Unmarshal(tenant.Settings, &settings)
	}

	response := TenantResponse{
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

	c.JSON(http.StatusCreated, response)
}

// UpdateTenant godoc
// @Summary Update a tenant
// @Description Update tenant information
// @Tags tenants
// @Accept json
// @Produce json
// @Param id path string true "Tenant ID (UUID)"
// @Param tenant body UpdateTenantRequest true "Tenant information"
// @Success 200 {object} TenantResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tenants/{id} [put]
// @Security BearerAuth
func (h *TenantHandler) UpdateTenant(c *gin.Context) {
	tenantID := c.Param("id")

	var req UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	tenant, err := h.queries.UpdateTenant(
		c.Request.Context(),
		pgTenantID,
		req.Name,
		req.Domain,
		req.LogoURL,
		req.PrimaryColor,
		req.SecondaryColor,
		req.TertiaryColor,
		req.SubscriptionPlan,
		req.MaxUsers,
		req.MaxClients,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update tenant"})
		return
	}

	// Actualizar settings si se proporcionan
	if req.Settings != nil {
		settingsJSON, err := json.Marshal(req.Settings)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid settings format"})
			return
		}

		tenant, err = h.queries.UpdateTenantSettings(c.Request.Context(), pgTenantID, settingsJSON)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update tenant settings"})
			return
		}
	}

	var settings map[string]interface{}
	if len(tenant.Settings) > 0 {
		json.Unmarshal(tenant.Settings, &settings)
	}

	response := TenantResponse{
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

// ActivateTenant godoc
// @Summary Activate a tenant
// @Description Activate a tenant account
// @Tags tenants
// @Accept json
// @Produce json
// @Param id path string true "Tenant ID (UUID)"
// @Success 200 {object} TenantResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tenants/{id}/activate [patch]
// @Security BearerAuth
func (h *TenantHandler) ActivateTenant(c *gin.Context) {
	tenantID := c.Param("id")

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	tenant, err := h.queries.ActivateTenant(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to activate tenant"})
		return
	}

	var settings map[string]interface{}
	if len(tenant.Settings) > 0 {
		json.Unmarshal(tenant.Settings, &settings)
	}

	response := TenantResponse{
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

// DeactivateTenant godoc
// @Summary Deactivate a tenant
// @Description Deactivate a tenant account
// @Tags tenants
// @Accept json
// @Produce json
// @Param id path string true "Tenant ID (UUID)"
// @Success 200 {object} TenantResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tenants/{id}/deactivate [patch]
// @Security BearerAuth
func (h *TenantHandler) DeactivateTenant(c *gin.Context) {
	tenantID := c.Param("id")

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	tenant, err := h.queries.DeactivateTenant(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to deactivate tenant"})
		return
	}

	var settings map[string]interface{}
	if len(tenant.Settings) > 0 {
		json.Unmarshal(tenant.Settings, &settings)
	}

	response := TenantResponse{
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

// GetTenantStats godoc
// @Summary Get tenant statistics
// @Description Get overall tenant statistics
// @Tags tenants
// @Accept json
// @Produce json
// @Success 200 {object} TenantStatsResponse
// @Failure 500 {object} ErrorResponse
// @Router /tenants/stats [get]
// @Security BearerAuth
func (h *TenantHandler) GetTenantStats(c *gin.Context) {
	totalTenants, err := h.queries.CountTenants(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count tenants"})
		return
	}

	activeTenants, err := h.queries.CountActiveTenants(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count active tenants"})
		return
	}

	response := TenantStatsResponse{
		TotalTenants:  totalTenants,
		ActiveTenants: activeTenants,
	}

	c.JSON(http.StatusOK, response)
}

// UploadTenantLogo godoc
// @Summary Upload tenant logo
// @Description Upload a logo image for a tenant
// @Tags tenants
// @Accept multipart/form-data
// @Produce json
// @Param id path string true "Tenant ID (UUID)"
// @Param logo formData file true "Logo image file"
// @Param description formData string false "Logo description"
// @Success 200 {object} TenantResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /tenants/{id}/logo [post]
// @Security BearerAuth
func (h *TenantHandler) UploadTenantLogo(c *gin.Context) {
	tenantID := c.Param("id")
	currentUserID := middleware.GetUserID(c)

	// Parse file
	file, header, err := c.Request.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "logo file is required"})
		return
	}
	defer file.Close()

	// Validate file type (image)
	contentType := header.Header.Get("Content-Type")
	validImageTypes := map[string]bool{
		"image/jpeg":    true,
		"image/jpg":     true,
		"image/png":     true,
		"image/gif":     true,
		"image/webp":    true,
		"image/svg+xml": true,
	}

	if !validImageTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image format. Only JPEG, PNG, GIF, WebP, and SVG are allowed"})
		return
	}

	// Validate size (max 10MB)
	const maxFileSize = 10 * 1024 * 1024
	if header.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum size is 10MB"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	// Get tenant info for description
	tenant, err := h.queries.GetTenantByID(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tenant not found"})
		return
	}

	description := c.PostForm("description")
	if description == "" {
		description = fmt.Sprintf("Logo for %s", tenant.Name)
	}

	pgUserID, _ := toPgUUID(currentUserID)

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read logo file"})
		return
	}

	fileHash := sha256.Sum256(fileBytes)
	fileHashHex := hex.EncodeToString(fileHash[:])
	extension := filepath.Ext(header.Filename)
	objectFileName := fmt.Sprintf("%s%s", uuid.New().String(), extension)
	objectPath := fmt.Sprintf("tenants/%s/logos/%s", tenantID, objectFileName)

	metadata := map[string]interface{}{
		"tenant_id":     tenantID,
		"description":   description,
		"tenant_name":   tenant.Name,
		"original_name": header.Filename,
	}
	metadataJSON, _ := json.Marshal(metadata)

	storedObject, err := h.storage.UploadObject(
		c.Request.Context(),
		pgTenantID,
		"tenant_logo",
		objectPath,
		contentType,
		fileBytes,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to store logo in minio: %v", err)})
		return
	}

	category := "tenant_logo"
	entityType := "tenants"
	dbFile, err := h.queries.CreateFile(c.Request.Context(), database.CreateFileParams{
		TenantID:          pgTenantID,
		Filename:          objectFileName,
		OriginalFilename:  header.Filename,
		MimeType:          contentType,
		FileSize:          int64(len(fileBytes)),
		FileHash:          &fileHashHex,
		StorageProvider:   &storedObject.Provider,
		StorageBucket:     &storedObject.Bucket,
		StoragePath:       objectPath,
		StorageUrl:        nil,
		Category:          &category,
		RelatedEntityType: &entityType,
		RelatedEntityID:   pgTenantID,
		Metadata:          metadataJSON,
		UploadedBy:        pgUserID,
	})
	if err != nil {
		_ = h.storage.DeleteObject(c.Request.Context(), pgTenantID, "tenant_logo", storedObject.Bucket, objectPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to save logo metadata: %v", err)})
		return
	}

	logoURL := buildAbsoluteURL(c, fmt.Sprintf("/api/v1/storage/public/%s", pgUUIDToString(dbFile.ID)))

	// Update tenant logo_url in database
	updatedTenant, err := h.queries.UpdateTenantTheme(
		c.Request.Context(),
		pgTenantID,
		tenant.PrimaryColor,
		tenant.SecondaryColor,
		tenant.TertiaryColor,
		&logoURL,
	)

	if err != nil {
		_ = h.storage.DeleteObject(c.Request.Context(), pgTenantID, "tenant_logo", storedObject.Bucket, objectPath)
		_ = h.queries.DeleteFile(c.Request.Context(), dbFile.ID, pgTenantID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update tenant logo"})
		return
	}

	h.deleteTenantFilesByCategory(c, pgTenantID, category, dbFile.ID)

	var settings map[string]interface{}
	if len(updatedTenant.Settings) > 0 {
		json.Unmarshal(updatedTenant.Settings, &settings)
	}

	response := TenantResponse{
		ID:               pgUUIDToString(updatedTenant.ID),
		Name:             updatedTenant.Name,
		Slug:             updatedTenant.Slug,
		Domain:           updatedTenant.Domain,
		LogoURL:          updatedTenant.LogoUrl,
		PrimaryColor:     updatedTenant.PrimaryColor,
		SecondaryColor:   updatedTenant.SecondaryColor,
		TertiaryColor:    updatedTenant.TertiaryColor,
		IsActive:         boolValue(updatedTenant.IsActive),
		Settings:         settings,
		SubscriptionPlan: updatedTenant.SubscriptionPlan,
		MaxUsers:         updatedTenant.MaxUsers,
		MaxClients:       updatedTenant.MaxClients,
		CreatedAt:        updatedTenant.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:        updatedTenant.UpdatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

func (h *TenantHandler) deleteTenantFilesByCategory(
	c *gin.Context,
	tenantID pgtype.UUID,
	category string,
	keepFileID pgtype.UUID,
) {
	entityType := "tenants"
	files, err := h.queries.ListFilesByEntity(c.Request.Context(), tenantID, &entityType, tenantID)
	if err != nil {
		return
	}

	for _, file := range files {
		if file.Category == nil || *file.Category != category {
			continue
		}
		if keepFileID.Valid && file.ID == keepFileID {
			continue
		}

		_ = h.storage.DeleteObject(c.Request.Context(), tenantID, "tenant_logo", stringPtrValueOrEmpty(file.StorageBucket), file.StoragePath)
		_ = h.queries.DeleteFile(c.Request.Context(), file.ID, tenantID)
	}
}
