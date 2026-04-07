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

type StorageHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
	storage *objectstorage.MinIOService
}

func NewStorageHandler(db *pgxpool.Pool, queries *database.Queries, storage *objectstorage.MinIOService) *StorageHandler {
	return &StorageHandler{
		db:      db,
		queries: queries,
		storage: storage,
	}
}

// UploadFile godoc
// @Summary Upload a file
// @Description Upload a file to storage
// @Tags storage
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "File to upload"
// @Param category formData string false "File category"
// @Param related_entity_type formData string false "Related entity type"
// @Param related_entity_id formData string false "Related entity ID"
// @Success 201 {object} FileResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /storage/upload [post]
// @Security BearerAuth
func (h *StorageHandler) UploadFile(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)

	// Get form data
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	category := c.PostForm("category")
	relatedEntityType := c.PostForm("related_entity_type")
	relatedEntityID := c.PostForm("related_entity_id")

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	// Calculate file hash
	hasher := sha256.New()
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}
	hasher.Write(fileBytes)
	hash := hex.EncodeToString(hasher.Sum(nil))

	storagePath := fmt.Sprintf("tenants/%s/uploads/%s", tenantID, filename)

	// Metadata
	metadata := map[string]interface{}{
		"original_name": header.Filename,
		"size_bytes":    len(fileBytes),
	}
	metadataJSON, _ := json.Marshal(metadata)

	pgTenantID, _ := toPgUUID(tenantID)
	pgUserID, _ := toPgUUID(userID)

	var categoryPtr, relatedEntityTypePtr, relatedEntityIDPtr *string
	if category != "" {
		categoryPtr = &category
	}
	if relatedEntityType != "" {
		relatedEntityTypePtr = &relatedEntityType
	}
	if relatedEntityID != "" {
		relatedEntityIDPtr = &relatedEntityID
	}

	storedObject, err := h.storage.UploadObject(
		c.Request.Context(),
		pgTenantID,
		"storage",
		storagePath,
		header.Header.Get("Content-Type"),
		fileBytes,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload file to object storage"})
		return
	}

	provider := storedObject.Provider
	bucket := storedObject.Bucket

	// Save to database
	dbFile, err := h.queries.CreateFile(c.Request.Context(), database.CreateFileParams{
		TenantID:          pgTenantID,
		Filename:          filename,
		OriginalFilename:  header.Filename,
		MimeType:          header.Header.Get("Content-Type"),
		FileSize:          int64(len(fileBytes)),
		FileHash:          &hash,
		StorageProvider:   &provider,
		StorageBucket:     &bucket,
		StoragePath:       storagePath,
		StorageUrl:        nil,
		Category:          categoryPtr,
		RelatedEntityType: relatedEntityTypePtr,
		RelatedEntityID:   pgUUIDOrEmpty(relatedEntityIDPtr),
		Metadata:          metadataJSON,
		UploadedBy:        pgUserID,
	})

	if err != nil {
		_ = h.storage.DeleteObject(c.Request.Context(), pgTenantID, "storage", bucket, storagePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file metadata"})
		return
	}

	storageURL := buildAbsoluteURL(c, fmt.Sprintf("/api/v1/storage/files/%s/content", pgUUIDToString(dbFile.ID)))
	if isPublicCategory(categoryPtr) {
		storageURL = buildAbsoluteURL(c, fmt.Sprintf("/api/v1/storage/public/%s", pgUUIDToString(dbFile.ID)))
	}
	dbFile.StorageUrl = &storageURL

	// Parse metadata back
	var metadataMap map[string]interface{}
	json.Unmarshal(dbFile.Metadata, &metadataMap)

	response := FileResponse{
		ID:               pgUUIDToString(dbFile.ID),
		TenantID:         pgUUIDToString(dbFile.TenantID),
		Filename:         dbFile.Filename,
		OriginalFilename: dbFile.OriginalFilename,
		MimeType:         dbFile.MimeType,
		FileSize:         dbFile.FileSize,
		FileHash:         dbFile.FileHash,
		StorageProvider:  dbFile.StorageProvider,
		StorageURL:       dbFile.StorageUrl,
		Category:         dbFile.Category,
		IsProcessed:      boolValue(dbFile.IsProcessed),
		Metadata:         metadataMap,
		CreatedAt:        dbFile.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusCreated, response)
}

// ListFiles godoc
// @Summary List files
// @Description Get paginated list of files
// @Tags storage
// @Produce json
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {array} FileResponse
// @Failure 500 {object} ErrorResponse
// @Router /storage/files [get]
// @Security BearerAuth
func (h *StorageHandler) ListFiles(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	pgTenantID, _ := toPgUUID(tenantID)

	files, err := h.queries.ListFilesByTenant(
		c.Request.Context(),
		pgTenantID,
		int32(limit),
		int32(offset),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list files"})
		return
	}

	responses := make([]FileResponse, len(files))
	for i, file := range files {
		var metadataMap map[string]interface{}
		json.Unmarshal(file.Metadata, &metadataMap)

		responses[i] = FileResponse{
			ID:               pgUUIDToString(file.ID),
			TenantID:         pgUUIDToString(file.TenantID),
			Filename:         file.Filename,
			OriginalFilename: file.OriginalFilename,
			MimeType:         file.MimeType,
			FileSize:         file.FileSize,
			FileHash:         file.FileHash,
			StorageURL:       file.StorageUrl,
			Category:         file.Category,
			IsProcessed:      boolValue(file.IsProcessed),
			Metadata:         metadataMap,
			CreatedAt:        file.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// GetFileStats godoc
// @Summary Get file statistics
// @Description Get storage statistics for tenant
// @Tags storage
// @Produce json
// @Success 200 {object} FileStatsResponse
// @Failure 500 {object} ErrorResponse
// @Router /storage/stats [get]
// @Security BearerAuth
func (h *StorageHandler) GetFileStats(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	pgTenantID, _ := toPgUUID(tenantID)

	count, err := h.queries.CountFilesByTenant(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count files"})
		return
	}

	totalSize, err := h.queries.GetTotalStorageSize(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get total size"})
		return
	}

	response := FileStatsResponse{
		TotalFiles:       count,
		TotalStorageSize: totalSize,
	}

	c.JSON(http.StatusOK, response)
}

// GetFileContent godoc
// @Summary Get file content
// @Description Stream a file from object storage
// @Tags storage
// @Produce application/octet-stream
// @Param id path string true "File ID (UUID)"
// @Success 200 {file} binary
// @Failure 404 {object} ErrorResponse
// @Router /storage/files/{id}/content [get]
// @Security BearerAuth
func (h *StorageHandler) GetFileContent(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	fileID := c.Param("id")

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	pgFileID, err := toPgUUID(fileID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file ID format"})
		return
	}

	file, err := h.queries.GetFileByID(c.Request.Context(), pgFileID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	h.streamStoredFile(c, file, "storage")
}

// ServePublicFile godoc
// @Summary Get public avatar or logo
// @Description Stream a public file for avatars and tenant logos
// @Tags storage
// @Produce image/jpeg,image/png,image/gif,image/webp,image/svg+xml
// @Param id path string true "File ID (UUID)"
// @Success 200 {file} binary
// @Failure 404 {object} ErrorResponse
// @Router /storage/public/{id} [get]
func (h *StorageHandler) ServePublicFile(c *gin.Context) {
	fileID := c.Param("id")

	pgFileID, err := toPgUUID(fileID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file ID format"})
		return
	}

	file, err := h.queries.GetFileByIDGlobal(c.Request.Context(), pgFileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	if !isPublicCategory(file.Category) {
		c.JSON(http.StatusForbidden, gin.H{"error": "file is not public"})
		return
	}

	h.streamStoredFile(c, file, publicModuleForCategory(file.Category))
}

// Helper para convertir *string a pgtype.UUID (empty si nil)
func pgUUIDOrEmpty(s *string) pgtype.UUID {
	if s == nil || *s == "" {
		return pgtype.UUID{}
	}
	uuid, err := toPgUUID(*s)
	if err != nil {
		return pgtype.UUID{}
	}
	return uuid
}

func (h *StorageHandler) streamStoredFile(c *gin.Context, file database.StorageFile, moduleName string) {
	reader, objectInfo, err := h.storage.GetObject(
		c.Request.Context(),
		file.TenantID,
		moduleName,
		stringPtrValueOrEmpty(file.StorageBucket),
		file.StoragePath,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file content not available"})
		return
	}
	defer reader.Close()

	contentType := file.MimeType
	if contentType == "" {
		contentType = objectInfo.ContentType
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	c.Header("Content-Type", contentType)
	c.Header("Content-Length", strconv.FormatInt(file.FileSize, 10))
	c.Header("Cache-Control", "public, max-age=31536000")
	c.Header("Access-Control-Allow-Origin", "*")

	if _, err := io.Copy(c.Writer, reader); err != nil {
		c.Abort()
	}
}

func publicModuleForCategory(category *string) string {
	if category == nil {
		return "storage"
	}
	switch *category {
	case "user_avatar":
		return "users_avatar"
	case "tenant_logo":
		return "tenant_logo"
	case "floor_plan_background":
		return "storage"
	default:
		return "storage"
	}
}

func isPublicCategory(category *string) bool {
	if category == nil {
		return false
	}
	switch *category {
	case "user_avatar", "tenant_logo", "floor_plan_background":
		return true
	default:
		return false
	}
}

func buildAbsoluteURL(c *gin.Context, path string) string {
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	if forwardedProto := c.GetHeader("X-Forwarded-Proto"); forwardedProto != "" {
		scheme = forwardedProto
	}
	return fmt.Sprintf("%s://%s%s", scheme, c.Request.Host, path)
}

func stringPtrValueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
