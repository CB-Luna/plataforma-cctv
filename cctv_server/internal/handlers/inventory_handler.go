package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	catalogintelligence "github.com/symtickets/cctv_server/internal/intelligence"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type InventoryHandler struct {
	db                *pgxpool.Pool
	queries           *database.Queries
	catalogEmbeddings *catalogintelligence.CatalogEmbeddingService
}

func NewInventoryHandler(db *pgxpool.Pool, queries *database.Queries, catalogEmbeddings *catalogintelligence.CatalogEmbeddingService) *InventoryHandler {
	return &InventoryHandler{
		db:                db,
		queries:           queries,
		catalogEmbeddings: catalogEmbeddings,
	}
}

// =============================================
// NVR SERVERS
// =============================================

// ListNvrServers godoc
// @Summary List all NVR servers
// @Description Get a list of all NVR servers for the authenticated tenant
// @Tags inventory-nvr
// @Accept json
// @Produce json
// @Param tenant_id query string false "Tenant ID (super admin only)"
// @Success 200 {array} NvrServerResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/nvrs [get]
// @Security BearerAuth
func (h *InventoryHandler) ListNvrServers(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	nvrs, err := h.queries.ListNvrServersByTenant(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch NVR servers", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, nvrs)
}

// getEffectiveTenantID returns the tenant ID to use for filtering.
// For super admins, if a tenant_id query param is provided, use that.
// Otherwise, use the authenticated user's tenant.
func (h *InventoryHandler) getEffectiveTenantID(c *gin.Context) string {
	// Check if user is super admin
	roles := middleware.GetRoles(c)
	isSuperAdmin := false
	for _, role := range roles {
		if role == "super_admin" || role == "superadmin" || role == "Super Administrador" || role == "SuperAdmin" {
			isSuperAdmin = true
			break
		}
	}

	// If super admin and tenant_id query param is provided, use it
	if isSuperAdmin {
		if queryTenantID := c.Query("tenant_id"); queryTenantID != "" {
			return queryTenantID
		}
	}

	// Otherwise, use the authenticated user's tenant
	return middleware.GetTenantID(c)
}

// GetNvrServer godoc
// @Summary Get NVR server by ID
// @Description Get detailed information about a specific NVR server
// @Tags inventory-nvr
// @Accept json
// @Produce json
// @Param id path string true "NVR Server ID (UUID)"
// @Success 200 {object} NvrServerResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/nvrs/{id} [get]
// @Security BearerAuth
func (h *InventoryHandler) GetNvrServer(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)
	nvrID := c.Param("id")

	pgNvrID, err := toPgUUID(nvrID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid NVR ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	nvr, err := h.queries.GetNvrServerByID(c.Request.Context(), pgNvrID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "NVR server not found"})
		return
	}

	c.JSON(http.StatusOK, nvr)
}

// CreateNvrServerRequest represents the request body for creating an NVR server
type CreateNvrServerRequest struct {
	SiteID                 string  `json:"site_id"`
	BrandID                string  `json:"brand_id"`
	Name                   string  `json:"name" binding:"required"`
	Code                   string  `json:"code"`
	VmsServerID            string  `json:"vms_server_id"`
	Edition                string  `json:"edition"`
	VmsVersion             string  `json:"vms_version"`
	CameraChannels         int     `json:"camera_channels"`
	TpvChannels            int     `json:"tpv_channels"`
	LprChannels            int     `json:"lpr_channels"`
	IntegrationConnections int     `json:"integration_connections"`
	Model                  string  `json:"model"`
	ServiceTag             string  `json:"service_tag"`
	ServiceCode            string  `json:"service_code"`
	Processor              string  `json:"processor"`
	RamGB                  int     `json:"ram_gb"`
	OsName                 string  `json:"os_name"`
	SystemType             string  `json:"system_type"`
	IPAddress              string  `json:"ip_address"`
	SubnetMask             string  `json:"subnet_mask"`
	Gateway                string  `json:"gateway"`
	MacAddress             string  `json:"mac_address"`
	TotalStorageTB         float64 `json:"total_storage_tb"`
	RecordingDays          int     `json:"recording_days"`
	LaunchDate             string  `json:"launch_date"`
	WarrantyExpiryDate     string  `json:"warranty_expiry_date"`
	InstallationDate       string  `json:"installation_date"`
	Status                 string  `json:"status"`
	Notes                  string  `json:"notes"`
}

// CreateNvrServer godoc
// @Summary Create a new NVR server
// @Description Create a new NVR server for the authenticated tenant
// @Tags inventory-nvr
// @Accept json
// @Produce json
// @Param body body CreateNvrServerRequest true "NVR Server data"
// @Success 201 {object} NvrServerResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/nvrs [post]
// @Security BearerAuth
func (h *InventoryHandler) CreateNvrServer(c *gin.Context) {
	var req CreateNvrServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	pgUserID, _ := toPgUUID(userID)

	// Build params
	cameraChannels := int32(req.CameraChannels)
	tpvChannels := int32(req.TpvChannels)
	lprChannels := int32(req.LprChannels)
	integrationConnections := int32(req.IntegrationConnections)

	params := database.CreateNvrServerParams{
		TenantID:               pgTenantID,
		Name:                   req.Name,
		CameraChannels:         &cameraChannels,
		TpvChannels:            &tpvChannels,
		LprChannels:            &lprChannels,
		IntegrationConnections: &integrationConnections,
		CreatedBy:              pgUserID,
	}

	if req.RamGB > 0 {
		ramGb := int32(req.RamGB)
		params.RamGb = &ramGb
	}
	if req.RecordingDays > 0 {
		recordingDays := int32(req.RecordingDays)
		params.RecordingDays = &recordingDays
	}

	// Optional string fields
	if req.SiteID != "" {
		pgSiteID, _ := toPgUUID(req.SiteID)
		params.SiteID = pgSiteID
	}
	if req.BrandID != "" {
		pgBrandID, _ := toPgUUID(req.BrandID)
		params.BrandID = pgBrandID
	}
	if req.Code != "" {
		params.Code = &req.Code
	}
	if req.VmsServerID != "" {
		params.VmsServerID = &req.VmsServerID
	}
	if req.Edition != "" {
		params.Edition = &req.Edition
	}
	if req.VmsVersion != "" {
		params.VmsVersion = &req.VmsVersion
	}
	if req.Model != "" {
		params.Model = &req.Model
	}
	if req.ServiceTag != "" {
		params.ServiceTag = &req.ServiceTag
	}
	if req.ServiceCode != "" {
		params.ServiceCode = &req.ServiceCode
	}
	if req.Processor != "" {
		params.Processor = &req.Processor
	}
	if req.OsName != "" {
		params.OsName = &req.OsName
	}
	if req.SystemType != "" {
		params.SystemType = &req.SystemType
	}
	if req.Notes != "" {
		params.Notes = &req.Notes
	}

	nvr, err := h.queries.CreateNvrServer(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create NVR server", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, nvr)
}

// UpdateNvrServer godoc
// @Summary Update an NVR server
// @Description Update an existing NVR server
// @Tags inventory-nvr
// @Accept json
// @Produce json
// @Param id path string true "NVR Server ID (UUID)"
// @Param body body CreateNvrServerRequest true "NVR Server data"
// @Success 200 {object} NvrServerResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/nvrs/{id} [put]
// @Security BearerAuth
func (h *InventoryHandler) UpdateNvrServer(c *gin.Context) {
	var req CreateNvrServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)
	nvrID := c.Param("id")

	pgNvrID, err := toPgUUID(nvrID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid NVR ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	pgUserID, _ := toPgUUID(userID)

	params := database.UpdateNvrServerParams{
		ID:        pgNvrID,
		TenantID:  pgTenantID,
		UpdatedBy: pgUserID,
	}

	// Set optional fields
	if req.Name != "" {
		params.Name = req.Name
	}
	if req.Code != "" {
		params.Code = &req.Code
	}
	if req.Edition != "" {
		params.Edition = &req.Edition
	}
	if req.VmsVersion != "" {
		params.VmsVersion = &req.VmsVersion
	}
	if req.Model != "" {
		params.Model = &req.Model
	}
	if req.Notes != "" {
		params.Notes = &req.Notes
	}

	nvr, err := h.queries.UpdateNvrServer(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update NVR server", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, nvr)
}

// DeleteNvrServer godoc
// @Summary Delete an NVR server
// @Description Delete an NVR server by ID
// @Tags inventory-nvr
// @Accept json
// @Produce json
// @Param id path string true "NVR Server ID (UUID)"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/nvrs/{id} [delete]
// @Security BearerAuth
func (h *InventoryHandler) DeleteNvrServer(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	nvrID := c.Param("id")

	pgNvrID, err := toPgUUID(nvrID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid NVR ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	err = h.queries.DeleteNvrServer(c.Request.Context(), pgNvrID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete NVR server"})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetNvrServerStats godoc
// @Summary Get NVR server statistics
// @Description Get statistics about NVR servers for the authenticated tenant
// @Tags inventory-nvr
// @Accept json
// @Produce json
// @Success 200 {object} NvrServerStatsResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/nvrs/stats [get]
// @Security BearerAuth
func (h *InventoryHandler) GetNvrServerStats(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	stats, err := h.queries.GetNvrServerStats(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch NVR stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetNvrLicenses godoc
// @Summary Get licenses for an NVR server
// @Description Get all licenses associated with an NVR server
// @Tags inventory-nvr
// @Accept json
// @Produce json
// @Param id path string true "NVR Server ID (UUID)"
// @Success 200 {array} NvrLicenseResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/nvrs/{id}/licenses [get]
// @Security BearerAuth
func (h *InventoryHandler) GetNvrLicenses(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)
	nvrID := c.Param("id")

	pgNvrID, err := toPgUUID(nvrID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid NVR ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	licenses, err := h.queries.ListNvrLicensesByServer(c.Request.Context(), pgNvrID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch licenses"})
		return
	}

	c.JSON(http.StatusOK, licenses)
}

// GetNvrCameras godoc
// @Summary Get cameras for an NVR server
// @Description Get all cameras associated with an NVR server
// @Tags inventory-nvr
// @Accept json
// @Produce json
// @Param id path string true "NVR Server ID (UUID)"
// @Success 200 {array} CameraResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/nvrs/{id}/cameras [get]
// @Security BearerAuth
func (h *InventoryHandler) GetNvrCameras(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)
	nvrID := c.Param("id")

	pgNvrID, err := toPgUUID(nvrID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid NVR ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	cameras, err := h.queries.ListCamerasByNvr(c.Request.Context(), pgNvrID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch cameras"})
		return
	}

	c.JSON(http.StatusOK, cameras)
}

// =============================================
// CAMERAS
// =============================================

// ListCameras godoc
// @Summary List all cameras
// @Description Get a paginated list of all cameras for the authenticated tenant
// @Tags inventory-cameras
// @Accept json
// @Produce json
// @Param limit query int false "Number of items to return" default(50)
// @Param offset query int false "Number of items to skip" default(0)
// @Success 200 {array} CameraResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/cameras [get]
// @Security BearerAuth
func (h *InventoryHandler) ListCameras(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)
	limit := getIntQuery(c, "limit", 50)
	offset := getIntQuery(c, "offset", 0)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	cameras, err := h.queries.ListCamerasByTenant(c.Request.Context(), pgTenantID, int32(limit), int32(offset))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch cameras", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cameras)
}

// GetCamera godoc
// @Summary Get camera by ID
// @Description Get detailed information about a specific camera
// @Tags inventory-cameras
// @Accept json
// @Produce json
// @Param id path string true "Camera ID (UUID)"
// @Success 200 {object} CameraResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/cameras/{id} [get]
// @Security BearerAuth
func (h *InventoryHandler) GetCamera(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)
	cameraID := c.Param("id")

	pgCameraID, err := toPgUUID(cameraID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid camera ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	camera, err := h.queries.GetCameraByID(c.Request.Context(), pgCameraID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "camera not found"})
		return
	}

	c.JSON(http.StatusOK, camera)
}

// CreateCameraRequest represents the request body for creating a camera
type CreateCameraRequest struct {
	NvrServerID         string  `json:"nvr_server_id"`
	SiteID              string  `json:"site_id"`
	AreaID              string  `json:"area_id"`
	ModelID             string  `json:"model_id"`
	Consecutive         int     `json:"consecutive"`
	Name                string  `json:"name" binding:"required"`
	Code                string  `json:"code"`
	CameraType          string  `json:"camera_type"`
	CameraModelName     string  `json:"camera_model_name"`
	Generation          string  `json:"generation"`
	IPAddress           string  `json:"ip_address"`
	MacAddress          string  `json:"mac_address"`
	Resolution          string  `json:"resolution"`
	Megapixels          float64 `json:"megapixels"`
	IPS                 int     `json:"ips"`
	BitrateKbps         int     `json:"bitrate_kbps"`
	Quality             int     `json:"quality"`
	FirmwareVersion     string  `json:"firmware_version"`
	SerialNumber        string  `json:"serial_number"`
	Area                string  `json:"area"`
	Zone                string  `json:"zone"`
	LocationDescription string  `json:"location_description"`
	Project             string  `json:"project"`
	HasCounting         bool    `json:"has_counting"`
	CountingEnabled     bool    `json:"counting_enabled"`
	Status              string  `json:"status"`
	Notes               string  `json:"notes"`
	Comments            string  `json:"comments"`
}

// CreateCamera godoc
// @Summary Create a new camera
// @Description Create a new camera for the authenticated tenant
// @Tags inventory-cameras
// @Accept json
// @Produce json
// @Param body body CreateCameraRequest true "Camera data"
// @Success 201 {object} CameraResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/cameras [post]
// @Security BearerAuth
func (h *InventoryHandler) CreateCamera(c *gin.Context) {
	var req CreateCameraRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	pgUserID, _ := toPgUUID(userID)

	params := database.CreateCameraParams{
		TenantID:        pgTenantID,
		Name:            req.Name,
		HasCounting:     &req.HasCounting,
		CountingEnabled: &req.CountingEnabled,
		CreatedBy:       pgUserID,
	}

	if req.Consecutive > 0 {
		consecutive := int32(req.Consecutive)
		params.Consecutive = &consecutive
	}
	if req.IPS > 0 {
		ips := int32(req.IPS)
		params.Ips = &ips
	}
	if req.BitrateKbps > 0 {
		bitrateKbps := int32(req.BitrateKbps)
		params.BitrateKbps = &bitrateKbps
	}
	if req.Quality > 0 {
		quality := int32(req.Quality)
		params.Quality = &quality
	}

	// Optional UUID fields
	if req.NvrServerID != "" {
		pgNvrID, _ := toPgUUID(req.NvrServerID)
		params.NvrServerID = pgNvrID
	}
	if req.SiteID != "" {
		pgSiteID, _ := toPgUUID(req.SiteID)
		params.SiteID = pgSiteID
	}
	if req.AreaID != "" {
		pgAreaID, _ := toPgUUID(req.AreaID)
		params.AreaID = pgAreaID
	}
	if req.ModelID != "" {
		pgModelID, _ := toPgUUID(req.ModelID)
		params.ModelID = pgModelID
	}

	// Optional string fields
	if req.Code != "" {
		params.Code = &req.Code
	}
	if req.CameraModelName != "" {
		params.CameraModelName = &req.CameraModelName
	}
	if req.Generation != "" {
		params.Generation = &req.Generation
	}
	if req.Resolution != "" {
		params.Resolution = &req.Resolution
	}
	if req.FirmwareVersion != "" {
		params.FirmwareVersion = &req.FirmwareVersion
	}
	if req.SerialNumber != "" {
		params.SerialNumber = &req.SerialNumber
	}
	if req.Area != "" {
		params.Area = &req.Area
	}
	if req.Zone != "" {
		params.Zone = &req.Zone
	}
	if req.LocationDescription != "" {
		params.LocationDescription = &req.LocationDescription
	}
	if req.Project != "" {
		params.Project = &req.Project
	}
	if req.Notes != "" {
		params.Notes = &req.Notes
	}
	if req.Comments != "" {
		params.Comments = &req.Comments
	}

	camera, err := h.queries.CreateCamera(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create camera", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, camera)
}

// DeleteCamera godoc
// @Summary Delete a camera
// @Description Delete a camera by ID
// @Tags inventory-cameras
// @Accept json
// @Produce json
// @Param id path string true "Camera ID (UUID)"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/cameras/{id} [delete]
// @Security BearerAuth
func (h *InventoryHandler) DeleteCamera(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	cameraID := c.Param("id")

	pgCameraID, err := toPgUUID(cameraID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid camera ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	err = h.queries.DeleteCamera(c.Request.Context(), pgCameraID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete camera"})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetCameraStats godoc
// @Summary Get camera statistics
// @Description Get statistics about cameras for the authenticated tenant
// @Tags inventory-cameras
// @Accept json
// @Produce json
// @Success 200 {object} CameraStatsResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/cameras/stats [get]
// @Security BearerAuth
func (h *InventoryHandler) GetCameraStats(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	stats, err := h.queries.GetCameraStats(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch camera stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// SearchCameras godoc
// @Summary Search cameras
// @Description Search cameras by name, serial number, model, area, or IP
// @Tags inventory-cameras
// @Accept json
// @Produce json
// @Param q query string true "Search query"
// @Param limit query int false "Number of items to return" default(50)
// @Param offset query int false "Number of items to skip" default(0)
// @Success 200 {array} CameraResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/cameras/search [get]
// @Security BearerAuth
func (h *InventoryHandler) SearchCameras(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)
	query := c.Query("q")
	limit := getIntQuery(c, "limit", 50)
	offset := getIntQuery(c, "offset", 0)

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "search query is required"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	cameras, err := h.queries.SearchCameras(c.Request.Context(), pgTenantID, &query, int32(limit), int32(offset))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search cameras"})
		return
	}

	c.JSON(http.StatusOK, cameras)
}

// SearchSemanticModels godoc
// @Summary Semantic search over catalog camera models
// @Description Uses Gemini embeddings to search global camera models by technical intent
// @Tags inventory-models
// @Accept json
// @Produce json
// @Param query query string true "Semantic query"
// @Param limit query int false "Limit" default(10)
// @Success 200 {array} SemanticModelSearchResponse
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/models/search/semantic [get]
// @Security BearerAuth
func (h *InventoryHandler) SearchSemanticModels(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)
	userID := middleware.GetUserID(c)
	query := strings.TrimSpace(c.Query("query"))
	if query == "" {
		query = strings.TrimSpace(c.Query("q"))
	}
	limit := getIntQuery(c, "limit", 10)
	if limit > 25 {
		limit = 25
	}

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "semantic query is required"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}
	pgUserID, err := toPgUUID(userID)
	if err != nil {
		pgUserID = pgtype.UUID{}
	}

	results, err := h.catalogEmbeddings.SearchCameraModels(c.Request.Context(), pgTenantID, pgUserID, query, limit)
	if err != nil {
		switch {
		case errors.Is(err, catalogintelligence.ErrGoogleEmbeddingConfigNotFound):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case errors.Is(err, catalogintelligence.ErrSemanticIndexEmpty):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to run semantic model search", "details": err.Error()})
		}
		return
	}

	response := make([]SemanticModelSearchResponse, len(results))
	for i, result := range results {
		response[i] = SemanticModelSearchResponse{
			ModelID:         result.ModelID,
			BrandName:       result.BrandName,
			ModelName:       result.ModelName,
			PartNumber:      result.PartNumber,
			DatasheetURL:    result.DatasheetURL,
			ImageURL:        result.ImageURL,
			ContentSummary:  result.ContentSummary,
			Distance:        result.Distance,
			SimilarityScore: result.SimilarityScore,
		}
	}

	c.JSON(http.StatusOK, response)
}

// =============================================
// EXECUTIVE SUMMARY
// =============================================

// GetExecutiveSummary godoc
// @Summary Get executive summary
// @Description Get executive summary of inventory for the authenticated tenant
// @Tags inventory
// @Accept json
// @Produce json
// @Success 200 {object} ExecutiveSummaryResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/summary [get]
// @Security BearerAuth
func (h *InventoryHandler) GetExecutiveSummary(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	summary, err := h.queries.GetExecutiveSummary(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch executive summary"})
		return
	}

	// Get camera types summary
	cameraTypes, err := h.queries.GetCameraTypesSummary(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch camera types summary"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"summary":      summary,
		"camera_types": cameraTypes,
	})
}

// =============================================
// HELPER FUNCTIONS
// =============================================

func getIntQuery(c *gin.Context, key string, defaultValue int) int {
	if val := c.Query(key); val != "" {
		if result, err := strconv.Atoi(val); err == nil {
			return result
		}
	}
	return defaultValue
}
