package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/netip"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type InventoryImportHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
}

func NewInventoryImportHandler(db *pgxpool.Pool, queries *database.Queries) *InventoryImportHandler {
	return &InventoryImportHandler{
		db:      db,
		queries: queries,
	}
}

// CreateImportBatchRequest represents the request body for creating an import batch
type CreateImportBatchRequest struct {
	BatchName      string                   `json:"batch_name" binding:"required"`
	SourceType     string                   `json:"source_type" binding:"required"` // excel, csv, ocr_image
	SourceFilename string                   `json:"source_filename"`
	TargetTable    string                   `json:"target_table" binding:"required"` // nvr_servers, cameras
	ColumnMapping  map[string]string        `json:"column_mapping" binding:"required"`
	Data           []map[string]interface{} `json:"data" binding:"required"`
}

type AnalyzeImportAssistantRequest struct {
	SourceFilename string                   `json:"source_filename"`
	SourceType     string                   `json:"source_type"`
	SheetNames     []string                 `json:"sheet_names"`
	Headers        []string                 `json:"headers"`
	SampleData     []map[string]interface{} `json:"sample_data"`
}

// ListImportBatches godoc
// @Summary List import batches
// @Description Get a paginated list of import batches for the authenticated tenant
// @Tags inventory-import
// @Accept json
// @Produce json
// @Param limit query int false "Number of items to return" default(20)
// @Param offset query int false "Number of items to skip" default(0)
// @Success 200 {array} ImportBatchResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/import/batches [get]
// @Security BearerAuth
func (h *InventoryImportHandler) ListImportBatches(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	limit := getIntQuery(c, "limit", 20)
	offset := getIntQuery(c, "offset", 0)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	batches, err := h.queries.ListImportBatchesByTenant(c.Request.Context(), pgTenantID, int32(limit), int32(offset))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch import batches"})
		return
	}

	c.JSON(http.StatusOK, batches)
}

// GetImportBatch godoc
// @Summary Get import batch by ID
// @Description Get detailed information about a specific import batch
// @Tags inventory-import
// @Accept json
// @Produce json
// @Param id path string true "Import Batch ID (UUID)"
// @Success 200 {object} ImportBatchDetailResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/import/batches/{id} [get]
// @Security BearerAuth
func (h *InventoryImportHandler) GetImportBatch(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	batchID := c.Param("id")

	pgBatchID, err := toPgUUID(batchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid batch ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	batch, err := h.queries.GetImportBatchByID(c.Request.Context(), pgBatchID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "import batch not found"})
		return
	}

	// Get item counts
	itemCounts, err := h.queries.CountImportBatchItemsByStatus(c.Request.Context(), pgBatchID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch item counts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"batch":       batch,
		"item_counts": itemCounts,
	})
}

// GetImportBatchItems godoc
// @Summary Get items from an import batch
// @Description Get paginated list of items from an import batch
// @Tags inventory-import
// @Accept json
// @Produce json
// @Param id path string true "Import Batch ID (UUID)"
// @Param status query string false "Filter by status" Enums(pending, success, error, skipped)
// @Param limit query int false "Number of items to return" default(50)
// @Param offset query int false "Number of items to skip" default(0)
// @Success 200 {array} ImportBatchItemResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/import/batches/{id}/items [get]
// @Security BearerAuth
func (h *InventoryImportHandler) GetImportBatchItems(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	batchID := c.Param("id")
	status := c.Query("status")
	limit := getIntQuery(c, "limit", 50)
	offset := getIntQuery(c, "offset", 0)

	pgBatchID, err := toPgUUID(batchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid batch ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	var items interface{}

	if status != "" {
		items, err = h.queries.ListImportBatchItemsByStatus(c.Request.Context(), pgBatchID, pgTenantID, &status, int32(limit), int32(offset))
	} else {
		items, err = h.queries.ListImportBatchItems(c.Request.Context(), pgBatchID, pgTenantID, int32(limit), int32(offset))
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch batch items"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GetImportBatchErrors godoc
// @Summary Get errors from an import batch
// @Description Get all items with errors from an import batch
// @Tags inventory-import
// @Accept json
// @Produce json
// @Param id path string true "Import Batch ID (UUID)"
// @Success 200 {array} ImportBatchItemResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/import/batches/{id}/errors [get]
// @Security BearerAuth
func (h *InventoryImportHandler) GetImportBatchErrors(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	batchID := c.Param("id")

	pgBatchID, err := toPgUUID(batchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid batch ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	errors, err := h.queries.GetImportBatchItemErrors(c.Request.Context(), pgBatchID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch batch errors"})
		return
	}

	c.JSON(http.StatusOK, errors)
}

// CreateImportBatch godoc
// @Summary Create an import batch
// @Description Create a new import batch with data to be processed
// @Tags inventory-import
// @Accept json
// @Produce json
// @Param body body CreateImportBatchRequest true "Import batch data"
// @Success 201 {object} ImportBatchResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/import/batches [post]
// @Security BearerAuth
func (h *InventoryImportHandler) CreateImportBatch(c *gin.Context) {
	var req CreateImportBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate target table
	validTables := map[string]bool{
		"nvr_servers": true,
		"cameras":     true,
	}
	if !validTables[req.TargetTable] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid target table, must be 'nvr_servers' or 'cameras'"})
		return
	}

	// Validate source type
	validSources := map[string]bool{
		"excel":     true,
		"csv":       true,
		"ocr_image": true,
		"api":       true,
		"manual":    true,
	}
	if !validSources[req.SourceType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid source type"})
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

	// Convert column mapping to JSON
	columnMappingJSON, err := json.Marshal(req.ColumnMapping)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid column mapping"})
		return
	}

	// Create the batch
	var sourceFilename *string
	if req.SourceFilename != "" {
		sourceFilename = &req.SourceFilename
	}

	totalRows := int32(len(req.Data))

	batch, err := h.queries.CreateImportBatch(
		c.Request.Context(),
		pgTenantID,
		req.BatchName,
		database.InventoryImportSourceType(req.SourceType),
		sourceFilename,
		req.TargetTable,
		columnMappingJSON,
		&totalRows,
		pgtype.UUID{}, // sourceFileID - empty for now
		pgUserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create import batch", "details": err.Error()})
		return
	}

	// Create batch items
	for i, row := range req.Data {
		rowJSON, err := json.Marshal(row)
		if err != nil {
			continue
		}

		pendingStatus := "pending"
		_, err = h.queries.CreateImportBatchItem(
			c.Request.Context(),
			pgTenantID,
			batch.ID,
			int32(i+1),
			rowJSON,
			&pendingStatus,
		)
		if err != nil {
			// Log error but continue
			continue
		}
	}

	c.JSON(http.StatusCreated, batch)
}

// ProcessImportBatch godoc
// @Summary Process an import batch
// @Description Start processing an import batch (async operation)
// @Tags inventory-import
// @Accept json
// @Produce json
// @Param id path string true "Import Batch ID (UUID)"
// @Success 202 {object} gin.H
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/import/batches/{id}/process [post]
// @Security BearerAuth
func (h *InventoryImportHandler) ProcessImportBatch(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	batchID := c.Param("id")

	pgBatchID, err := toPgUUID(batchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid batch ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	// Get the batch
	batch, err := h.queries.GetImportBatchByID(c.Request.Context(), pgBatchID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "import batch not found"})
		return
	}

	// Check if batch can be processed
	if batch.Status.InventoryImportStatus != database.InventoryImportStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "batch is already being processed or completed"})
		return
	}

	// Update status to processing
	err = h.queries.UpdateImportBatchStatus(c.Request.Context(), pgBatchID, pgTenantID, database.NullInventoryImportStatus{
		InventoryImportStatus: database.InventoryImportStatusProcessing,
		Valid:                 true,
	}, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update batch status"})
		return
	}

	result, processErr := h.processImportBatch(c.Request.Context(), batch, pgTenantID)
	if processErr != nil {
		errorMessage := processErr.Error()
		_ = h.queries.UpdateImportBatchStatus(c.Request.Context(), pgBatchID, pgTenantID, database.NullInventoryImportStatus{
			InventoryImportStatus: database.InventoryImportStatusFailed,
			Valid:                 true,
		}, &errorMessage)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process import batch", "details": processErr.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"message":  "import batch processed",
		"batch_id": batchID,
		"summary":  result,
	})
}

// CancelImportBatch godoc
// @Summary Cancel an import batch
// @Description Cancel a pending import batch
// @Tags inventory-import
// @Accept json
// @Produce json
// @Param id path string true "Import Batch ID (UUID)"
// @Success 200 {object} gin.H
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/import/batches/{id}/cancel [post]
// @Security BearerAuth
func (h *InventoryImportHandler) CancelImportBatch(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	batchID := c.Param("id")

	pgBatchID, err := toPgUUID(batchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid batch ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	err = h.queries.UpdateImportBatchStatus(c.Request.Context(), pgBatchID, pgTenantID, database.NullInventoryImportStatus{
		InventoryImportStatus: database.InventoryImportStatusCancelled,
		Valid:                 true,
	}, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel batch"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "import batch cancelled"})
}

// DeleteImportBatch godoc
// @Summary Delete an import batch
// @Description Delete an import batch and all its items
// @Tags inventory-import
// @Accept json
// @Produce json
// @Param id path string true "Import Batch ID (UUID)"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /inventory/import/batches/{id} [delete]
// @Security BearerAuth
func (h *InventoryImportHandler) DeleteImportBatch(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	batchID := c.Param("id")

	pgBatchID, err := toPgUUID(batchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid batch ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	// Delete items first
	err = h.queries.DeleteImportBatchItems(c.Request.Context(), pgBatchID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete batch items"})
		return
	}

	// Delete batch
	err = h.queries.DeleteImportBatch(c.Request.Context(), pgBatchID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete batch"})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetImportStats godoc
// @Summary Get import statistics
// @Description Get statistics about import batches for the authenticated tenant
// @Tags inventory-import
// @Accept json
// @Produce json
// @Success 200 {object} ImportStatsResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /inventory/import/stats [get]
// @Security BearerAuth
func (h *InventoryImportHandler) GetImportStats(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	stats, err := h.queries.GetImportBatchStats(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch import stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ValidateImportDataRequest represents a validation request
type ValidateImportDataRequest struct {
	TargetTable   string                   `json:"target_table" binding:"required"`
	ColumnMapping map[string]string        `json:"column_mapping" binding:"required"`
	SampleData    []map[string]interface{} `json:"sample_data" binding:"required"`
}

// ValidateImportData godoc
// @Summary Validate import data
// @Description Validate import data before creating a batch
// @Tags inventory-import
// @Accept json
// @Produce json
// @Param body body ValidateImportDataRequest true "Data to validate"
// @Success 200 {object} ValidationResultResponse
// @Failure 400 {object} ErrorResponse
// @Router /inventory/import/validate [post]
// @Security BearerAuth
func (h *InventoryImportHandler) ValidateImportData(c *gin.Context) {
	var req ValidateImportDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	errors := []map[string]interface{}{}
	warnings := []map[string]interface{}{}

	// Validate column mapping
	requiredColumns := getRequiredColumns(req.TargetTable)
	for _, col := range requiredColumns {
		found := false
		for _, mappedCol := range req.ColumnMapping {
			if mappedCol == col {
				found = true
				break
			}
		}
		if !found {
			errors = append(errors, map[string]interface{}{
				"type":    "missing_required_column",
				"column":  col,
				"message": "Required column is not mapped",
			})
		}
	}

	// Validate sample data
	for i, row := range req.SampleData {
		rowErrors := validateRow(row, req.ColumnMapping, req.TargetTable)
		for _, err := range rowErrors {
			err["row"] = i + 1
			if err["severity"] == "error" {
				errors = append(errors, err)
			} else {
				warnings = append(warnings, err)
			}
		}
	}

	isValid := len(errors) == 0

	c.JSON(http.StatusOK, gin.H{
		"valid":    isValid,
		"errors":   errors,
		"warnings": warnings,
	})
}

// AnalyzeImportAssistant godoc
// @Summary Analyze import source with assistant
// @Description Detect templates, recommend import mode, and suggest mappings before importing
// @Tags inventory-import
// @Accept json
// @Produce json
// @Param body body AnalyzeImportAssistantRequest true "Import source metadata"
// @Success 200 {object} gin.H
// @Failure 400 {object} ErrorResponse
// @Router /inventory/import/assistant/analyze [post]
// @Security BearerAuth
func (h *InventoryImportHandler) AnalyzeImportAssistant(c *gin.Context) {
	var req AnalyzeImportAssistantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	heuristicResult := buildHeuristicImportAssistantResult(req)
	execution := h.runInventoryImportAssistant(c.Request.Context(), middleware.GetTenantID(c), middleware.GetUserID(c), req, heuristicResult)
	resultPayload := execution.Result.toMap()

	tenantID := middleware.GetTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err == nil {
		inputData, _ := json.Marshal(req)
		resultData, _ := json.Marshal(resultPayload)
		confidenceNumeric := numericValue(fmt.Sprintf("%.2f", execution.Result.Confidence))
		modelUsed := execution.ModelUsed
		analysis, analysisErr := h.queries.CreateAnalysis(
			c.Request.Context(),
			pgTenantID,
			"inventory_import_assistant",
			"file_metadata",
			pgtype.UUID{},
			inputData,
			resultData,
			confidenceNumeric,
			execution.APICallID,
			&modelUsed,
			execution.ProcessingTimeMs,
		)
		if analysisErr == nil {
			resultPayload["analysis_id"] = pgUUIDToString(analysis.ID)
			resultPayload["model_used"] = modelUsed
		}
	}

	c.JSON(http.StatusOK, resultPayload)
}

// Helper functions

func buildHeuristicImportAssistantResult(req AnalyzeImportAssistantRequest) inventoryImportAssistantResult {
	templateName, confidence := detectImportTemplate(req)
	result := inventoryImportAssistantResult{
		TemplateName:        templateName,
		Confidence:          confidence,
		Mode:                "manual",
		SuggestedTargets:    []string{"cameras"},
		Findings:            []string{},
		RecommendedMappings: map[string]map[string]string{},
	}

	if templateName == "skyworks_inventory_excel" {
		result.Mode = "automatic"
		result.SuggestedTargets = []string{"nvr_servers", "cameras"}
		result.Findings = append(result.Findings,
			"Se detecto la plantilla Skyworks con hojas de NVRs y camaras.",
			"El archivo contiene informacion suficiente para crear NVRs, licencias y camaras.",
			"Se recomienda importar primero NVRs y despues camaras para enlazar infraestructura y evitar huerfanos.",
		)
		result.RecommendedMappings["nvr_servers"] = map[string]string{
			"NOMBRE":      "name",
			"Modelo":      "model",
			"SERVICE TAG": "service_tag",
			"IP":          "ip_address",
			"# CAMARAS":   "camera_channels",
		}
		result.RecommendedMappings["cameras"] = map[string]string{
			"Nombre de la camara": "name",
			"Tipo de camara":      "camera_model_name",
			"tipo":                "camera_type",
			"IP":                  "ip_address",
			"MAC ":                "mac_address",
			"Serie":               "serial_number",
			"NVR":                 "nvr_name",
		}
		return result
	}

	result.Findings = append(result.Findings,
		"No se detecto una plantilla conocida; se recomienda revisar el mapeo manual antes de importar.",
	)
	if len(req.Headers) > 0 {
		result.RecommendedMappings["cameras"] = suggestMappingsFromHeaders(req.Headers, "cameras")
		result.RecommendedMappings["nvr_servers"] = suggestMappingsFromHeaders(req.Headers, "nvr_servers")
	}

	return result
}

func detectImportTemplate(req AnalyzeImportAssistantRequest) (string, float64) {
	sheets := map[string]bool{}
	for _, name := range req.SheetNames {
		sheets[strings.ToLower(strings.TrimSpace(name))] = true
	}

	if sheets["nvrs"] && (sheets["camaras p1"] || sheets["camaras m3"]) {
		return "skyworks_inventory_excel", 0.98
	}

	headers := make(map[string]bool)
	for _, header := range req.Headers {
		headers[strings.ToLower(strings.TrimSpace(header))] = true
	}
	if headers["nombre de la camara"] && headers["tipo de camara"] && headers["ip"] {
		return "camera_inventory_sheet", 0.8
	}
	if headers["nombre"] && headers["modelo"] && headers["ip"] {
		return "nvr_inventory_sheet", 0.75
	}

	return "generic_import", 0.35
}

func suggestMappingsFromHeaders(headers []string, targetTable string) map[string]string {
	suggestions := map[string]string{}
	headerMappings := map[string]string{
		"nombre":               "name",
		"name":                 "name",
		"codigo":               "code",
		"code":                 "code",
		"tipo":                 "camera_type",
		"tipo de camara":       "camera_model_name",
		"modelo":               "model",
		"ip":                   "ip_address",
		"direccion ip":         "ip_address",
		"mac":                  "mac_address",
		"mac ":                 "mac_address",
		"serie":                "serial_number",
		"service tag":          "service_tag",
		"procesador":           "processor",
		"memoria":              "ram_gb",
		"so":                   "os_name",
		"canales de la camara": "camera_channels",
	}

	for _, header := range headers {
		key := strings.ToLower(strings.TrimSpace(header))
		if mapped, ok := headerMappings[key]; ok {
			if targetTable == "nvr_servers" && mapped == "camera_type" {
				continue
			}
			suggestions[header] = mapped
		}
	}

	return suggestions
}

func getRequiredColumns(targetTable string) []string {
	switch targetTable {
	case "nvr_servers":
		return []string{"name"}
	case "cameras":
		return []string{"name"}
	default:
		return []string{}
	}
}

func validateRow(row map[string]interface{}, columnMapping map[string]string, targetTable string) []map[string]interface{} {
	var issues []map[string]interface{}

	// Check for required fields
	requiredColumns := getRequiredColumns(targetTable)
	for _, reqCol := range requiredColumns {
		for sourceCol, targetCol := range columnMapping {
			if targetCol == reqCol {
				if val, ok := row[sourceCol]; !ok || val == nil || val == "" {
					issues = append(issues, map[string]interface{}{
						"severity": "error",
						"column":   sourceCol,
						"message":  "Required field is empty",
					})
				}
			}
		}
	}

	// Validate IP addresses if present
	for sourceCol, targetCol := range columnMapping {
		if targetCol == "ip_address" {
			if val, ok := row[sourceCol]; ok && val != nil && val != "" {
				// Basic IP validation (could be more sophisticated)
				ipStr, ok := val.(string)
				if ok && ipStr != "" {
					// Simple check - real validation would be more complex
					if len(ipStr) < 7 {
						issues = append(issues, map[string]interface{}{
							"severity": "warning",
							"column":   sourceCol,
							"message":  "IP address format may be invalid",
						})
					}
				}
			}
		}
	}

	return issues
}

type importProcessResult struct {
	Processed int32 `json:"processed"`
	Success   int32 `json:"success"`
	Errors    int32 `json:"errors"`
	Skipped   int32 `json:"skipped"`
}

func (h *InventoryImportHandler) processImportBatch(
	ctx context.Context,
	batch database.GetImportBatchByIDRow,
	tenantID pgtype.UUID,
) (importProcessResult, error) {
	items, err := h.queries.ListPendingImportBatchItems(ctx, batch.ID, tenantID, 100000)
	if err != nil {
		return importProcessResult{}, err
	}

	columnMapping := map[string]string{}
	if len(batch.ColumnMapping) > 0 {
		if err := json.Unmarshal(batch.ColumnMapping, &columnMapping); err != nil {
			return importProcessResult{}, fmt.Errorf("invalid column mapping: %w", err)
		}
	}

	result := importProcessResult{}
	for _, item := range items {
		result.Processed++

		var raw map[string]interface{}
		if err := json.Unmarshal(item.RawData, &raw); err != nil {
			msg := fmt.Sprintf("invalid row data: %v", err)
			_ = h.markImportItem(ctx, tenantID, item.ID, "error", &msg, pgtype.UUID{}, nil)
			result.Errors++
			continue
		}

		standardized := mapImportRow(raw, columnMapping)

		recordID, status, errMsg := h.processImportRow(ctx, batch, tenantID, standardized)
		if err := h.markImportItem(ctx, tenantID, item.ID, status, errMsg, recordID, &batch.TargetTable); err != nil {
			return result, err
		}

		switch status {
		case "success":
			result.Success++
		case "skipped":
			result.Skipped++
		default:
			result.Errors++
		}
	}

	if err := h.queries.UpdateImportBatchProgress(
		ctx,
		batch.ID,
		tenantID,
		&result.Processed,
		&result.Success,
		&result.Errors,
		&result.Skipped,
	); err != nil {
		return result, err
	}

	finalStatus := database.InventoryImportStatusCompleted
	if result.Errors > 0 {
		finalStatus = database.InventoryImportStatusCompletedWithErrors
	}
	if result.Success == 0 && result.Errors > 0 {
		finalStatus = database.InventoryImportStatusFailed
	}

	if err := h.queries.UpdateImportBatchStatus(ctx, batch.ID, tenantID, database.NullInventoryImportStatus{
		InventoryImportStatus: finalStatus,
		Valid:                 true,
	}, nil); err != nil {
		return result, err
	}

	return result, nil
}

func (h *InventoryImportHandler) processImportRow(
	ctx context.Context,
	batch database.GetImportBatchByIDRow,
	tenantID pgtype.UUID,
	row map[string]interface{},
) (pgtype.UUID, string, *string) {
	switch batch.TargetTable {
	case "nvr_servers":
		return h.createNvrFromImportRow(ctx, tenantID, batch.CreatedBy, row)
	case "cameras":
		return h.createCameraFromImportRow(ctx, tenantID, batch.CreatedBy, row)
	default:
		msg := fmt.Sprintf("unsupported target table: %s", batch.TargetTable)
		return pgtype.UUID{}, "error", &msg
	}
}

func (h *InventoryImportHandler) markImportItem(
	ctx context.Context,
	tenantID pgtype.UUID,
	itemID pgtype.UUID,
	status string,
	errorMessage *string,
	recordID pgtype.UUID,
	recordTable *string,
) error {
	return h.queries.UpdateImportBatchItemStatus(ctx, itemID, tenantID, &status, errorMessage, recordID, recordTable)
}

func mapImportRow(raw map[string]interface{}, columnMapping map[string]string) map[string]interface{} {
	standardized := make(map[string]interface{}, len(raw)+len(columnMapping))
	for key, value := range raw {
		trimmedKey := strings.TrimSpace(key)
		standardized[trimmedKey] = value
		if mapped, ok := columnMapping[trimmedKey]; ok && mapped != "" {
			standardized[mapped] = value
		}
	}
	return standardized
}

func (h *InventoryImportHandler) createNvrFromImportRow(
	ctx context.Context,
	tenantID pgtype.UUID,
	createdBy pgtype.UUID,
	row map[string]interface{},
) (pgtype.UUID, string, *string) {
	name := importStringValue(row["name"])
	if name == "" {
		msg := "name is required"
		return pgtype.UUID{}, "error", &msg
	}

	if ip := parseIPPointer(row["ip_address"]); ip != nil {
		if exists, err := h.queries.CheckNvrIPExists(ctx, tenantID, ip); err == nil && exists {
			msg := fmt.Sprintf("NVR with IP %s already exists", ip.String())
			return pgtype.UUID{}, "skipped", &msg
		}
	}

	if code := optionalString(row["code"]); code != nil {
		if exists, err := h.queries.CheckNvrCodeExists(ctx, tenantID, code); err == nil && exists {
			msg := fmt.Sprintf("NVR with code %s already exists", *code)
			return pgtype.UUID{}, "skipped", &msg
		}
	}

	params := database.CreateNvrServerParams{
		TenantID: tenantID,
		Name:     name,
		Status: database.NullInventoryEquipmentStatus{
			InventoryEquipmentStatus: database.InventoryEquipmentStatusActive,
			Valid:                    true,
		},
		HardwareSpecs: []byte("{}"),
		NetworkConfig: []byte("{}"),
		Metadata:      mustJSON(map[string]interface{}{"import_source": row["import_source"], "sheet_name": row["sheet_name"]}),
		CreatedBy:     createdBy,
	}

	params.Code = optionalString(row["code"])
	params.VmsServerID = optionalString(row["vms_server_id"])
	params.Edition = optionalString(row["edition"])
	params.VmsVersion = optionalString(row["vms_version"])
	params.CameraChannels = int32Pointer(row["camera_channels"])
	params.TpvChannels = int32Pointer(row["tpv_channels"])
	params.LprChannels = int32Pointer(row["lpr_channels"])
	params.IntegrationConnections = int32Pointer(row["integration_connections"])
	params.Model = optionalString(row["model"])
	params.ServiceTag = optionalString(row["service_tag"])
	params.ServiceCode = optionalString(row["service_code"])
	params.Processor = optionalString(row["processor"])
	params.RamGb = int32Pointer(row["ram_gb"])
	params.OsName = optionalString(row["os_name"])
	params.SystemType = optionalString(row["system_type"])
	params.IpAddress = parseIPPointer(row["ip_address"])
	params.SubnetMask = parseIPPointer(row["subnet_mask"])
	params.Gateway = parseIPPointer(row["gateway"])
	params.MacAddress = parseMAC(row["mac_address"])
	params.TotalStorageTb = numericValue(row["total_storage_tb"])
	params.RecordingDays = int32Pointer(row["recording_days"])
	params.LaunchDate = dateValue(row["launch_date"])
	params.WarrantyExpiryDate = dateValue(row["warranty_expiry_date"])
	params.InstallationDate = dateValue(row["installation_date"])
	params.Notes = optionalString(row["notes"])

	nvr, err := h.queries.CreateNvrServer(ctx, params)
	if err != nil {
		msg := err.Error()
		return pgtype.UUID{}, "error", &msg
	}

	if totalLicenses := int32Pointer(row["total_licenses"]); totalLicenses != nil && *totalLicenses > 0 {
		licenseType := "other"
		if v := strings.TrimSpace(strings.ToLower(importStringValue(row["license_type"]))); v != "" {
			licenseType = v
		} else if edition := strings.ToLower(importStringValue(row["edition"])); strings.Contains(edition, "enterprise") {
			licenseType = "enterprise"
		} else if strings.Contains(edition, "standard") {
			licenseType = "standard"
		}
		used := int32Pointer(row["used_licenses"])
		if used == nil {
			used = totalLicenses
		}
		perpetual := strings.Contains(strings.ToLower(importStringValue(row["license_expiry"])), "ilim")
		_, _ = h.queries.CreateNvrLicense(ctx, database.CreateNvrLicenseParams{
			TenantID:      tenantID,
			NvrServerID:   nvr.ID,
			LicenseType:   database.InventoryLicenseType(licenseType),
			Edition:       optionalString(row["edition"]),
			TotalLicenses: *totalLicenses,
			UsedLicenses:  derefInt32(used),
			IsPerpetual:   &perpetual,
			IsActive:      boolPointer(true),
			Metadata:      mustJSON(map[string]interface{}{"imported": true}),
		})
	}

	return nvr.ID, "success", nil
}

func (h *InventoryImportHandler) createCameraFromImportRow(
	ctx context.Context,
	tenantID pgtype.UUID,
	createdBy pgtype.UUID,
	row map[string]interface{},
) (pgtype.UUID, string, *string) {
	name := importStringValue(row["name"])
	if name == "" {
		msg := "name is required"
		return pgtype.UUID{}, "error", &msg
	}

	if ip := parseIPPointer(row["ip_address"]); ip != nil {
		if exists, err := h.queries.CheckCameraIPExists(ctx, tenantID, ip); err == nil && exists {
			msg := fmt.Sprintf("camera with IP %s already exists", ip.String())
			return pgtype.UUID{}, "skipped", &msg
		}
	}

	params := database.CreateCameraParams{
		TenantID: tenantID,
		Name:     name,
		CameraType: database.NullInventoryCameraType{
			InventoryCameraType: normalizeCameraType(importStringValue(row["camera_type"])),
			Valid:               true,
		},
		IpAddress:          parseIPPointer(row["ip_address"]),
		MacAddress:         parseMAC(row["mac_address"]),
		Megapixels:         numericValue(row["megapixels"]),
		HasCounting:        boolPointer(false),
		CountingEnabled:    boolPointer(false),
		Status:             equipmentStatusOrDefault(importStringValue(row["status"])),
		InstallationDate:   dateValue(row["installation_date"]),
		WarrantyExpiryDate: dateValue(row["warranty_expiry_date"]),
		Specifications:     mustJSON(map[string]interface{}{"source_type": row["source_camera_type"]}),
		AnalyticsConfig:    []byte("{}"),
		Metadata:           mustJSON(map[string]interface{}{"import_source": row["import_source"], "sheet_name": row["sheet_name"]}),
		CreatedBy:          createdBy,
	}

	params.NvrServerID = h.resolveNvrServerID(ctx, tenantID, row)
	params.Consecutive = int32Pointer(row["consecutive"])
	params.Code = optionalString(row["code"])
	params.CameraModelName = optionalString(row["camera_model_name"])
	params.Generation = optionalString(row["generation"])
	params.Resolution = optionalString(row["resolution"])
	params.Ips = int32Pointer(row["ips"])
	params.BitrateKbps = int32Pointer(row["bitrate_kbps"])
	params.Quality = int32Pointer(row["quality"])
	params.FirmwareVersion = optionalString(row["firmware_version"])
	params.SerialNumber = optionalString(row["serial_number"])
	params.Area = optionalString(row["area"])
	params.Zone = optionalString(row["zone"])
	params.LocationDescription = firstNonEmptyString(row["location_description"], row["ubicacion"])
	params.Project = optionalString(row["project"])
	params.Notes = optionalString(row["notes"])
	params.Comments = optionalString(row["comments"])

	camera, err := h.queries.CreateCamera(ctx, params)
	if err != nil {
		msg := err.Error()
		return pgtype.UUID{}, "error", &msg
	}

	return camera.ID, "success", nil
}

func (h *InventoryImportHandler) resolveNvrServerID(ctx context.Context, tenantID pgtype.UUID, row map[string]interface{}) pgtype.UUID {
	if direct := importStringValue(row["nvr_server_id"]); direct != "" {
		if parsed, err := toPgUUID(direct); err == nil {
			return parsed
		}
	}

	servers, err := h.queries.ListNvrServersByTenant(ctx, tenantID)
	if err != nil {
		return pgtype.UUID{}
	}

	targetIP := importStringValue(row["nvr_ip_address"])
	targetName := normalizeInventoryName(importStringValue(row["nvr_name"]))
	for _, server := range servers {
		if targetIP != "" && server.IpAddress != nil && server.IpAddress.String() == targetIP {
			return server.ID
		}
		if targetName != "" && normalizeInventoryName(server.Name) == targetName {
			return server.ID
		}
	}

	if targetName != "" {
		if found, err := h.queries.GetNvrServerByName(ctx, tenantID, targetName); err == nil {
			return found.ID
		}
	}

	return pgtype.UUID{}
}

func normalizeInventoryName(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	replacer := strings.NewReplacer("_", "-", " ", "", "skyworks", "", "hdnvr", "", "--", "-")
	value = replacer.Replace(value)
	value = strings.Trim(value, "-")
	return value
}

func normalizeCameraType(value string) database.InventoryCameraType {
	v := strings.ToLower(strings.TrimSpace(value))
	switch {
	case strings.Contains(v, "micro"):
		return database.InventoryCameraTypeMicroDome
	case strings.Contains(v, "360"):
		return database.InventoryCameraTypeDome360
	case strings.Contains(v, "ptz"):
		return database.InventoryCameraTypePtz
	case strings.Contains(v, "bala"), strings.Contains(v, "bullet"):
		return database.InventoryCameraTypeBullet
	case strings.Contains(v, "fish"):
		return database.InventoryCameraTypeFisheye
	case strings.Contains(v, "multisensor"):
		return database.InventoryCameraTypeMultisensor
	case strings.Contains(v, "thermal"), strings.Contains(v, "term"):
		return database.InventoryCameraTypeThermal
	case strings.Contains(v, "box"):
		return database.InventoryCameraTypeBox
	case strings.Contains(v, "dome"), strings.Contains(v, "domo"):
		return database.InventoryCameraTypeDome
	default:
		return database.InventoryCameraTypeOther
	}
}

func equipmentStatusOrDefault(value string) database.NullInventoryEquipmentStatus {
	status := database.InventoryEquipmentStatusActive
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "inactive", "inactivo":
		status = database.InventoryEquipmentStatusInactive
	case "faulty", "falla":
		status = database.InventoryEquipmentStatusFaulty
	case "under_maintenance", "maintenance", "mantenimiento":
		status = database.InventoryEquipmentStatusUnderMaintenance
	case "retired", "retirado":
		status = database.InventoryEquipmentStatusRetired
	}
	return database.NullInventoryEquipmentStatus{InventoryEquipmentStatus: status, Valid: true}
}

func importStringValue(value interface{}) string {
	switch v := value.(type) {
	case string:
		return strings.TrimSpace(v)
	case float64:
		if v == float64(int64(v)) {
			return strconv.FormatInt(int64(v), 10)
		}
		return strconv.FormatFloat(v, 'f', -1, 64)
	case int, int32, int64:
		return fmt.Sprintf("%v", v)
	case bool:
		return strconv.FormatBool(v)
	default:
		if value == nil {
			return ""
		}
		return strings.TrimSpace(fmt.Sprintf("%v", value))
	}
}

func optionalString(value interface{}) *string {
	if s := importStringValue(value); s != "" && strings.ToLower(s) != "n/d" && strings.ToLower(s) != "unknown" {
		return &s
	}
	return nil
}

func firstNonEmptyString(values ...interface{}) *string {
	for _, value := range values {
		if s := optionalString(value); s != nil {
			return s
		}
	}
	return nil
}

func int32Pointer(value interface{}) *int32 {
	s := strings.TrimSpace(importStringValue(value))
	if s == "" {
		return nil
	}
	s = strings.TrimSuffix(strings.ToLower(s), " kbps")
	s = strings.ReplaceAll(s, ",", "")
	if f, err := strconv.ParseFloat(s, 64); err == nil {
		n := int32(f)
		return &n
	}
	return nil
}

func parseIPPointer(value interface{}) *netip.Addr {
	s := strings.TrimSpace(importStringValue(value))
	if s == "" {
		return nil
	}
	s = strings.TrimPrefix(strings.TrimPrefix(s, "http://"), "https://")
	if idx := strings.Index(s, "/"); idx >= 0 {
		s = s[:idx]
	}
	if idx := strings.Index(s, ":"); idx >= 0 {
		s = s[:idx]
	}
	addr, err := netip.ParseAddr(s)
	if err != nil {
		return nil
	}
	return &addr
}

func parseMAC(value interface{}) net.HardwareAddr {
	s := strings.TrimSpace(importStringValue(value))
	if s == "" {
		return nil
	}
	s = strings.ReplaceAll(s, "-", ":")
	mac, err := net.ParseMAC(s)
	if err != nil {
		return nil
	}
	return mac
}

func dateValue(value interface{}) pgtype.Date {
	s := strings.TrimSpace(importStringValue(value))
	if s == "" || strings.Contains(strings.ToLower(s), "ilim") {
		return pgtype.Date{}
	}
	formats := []string{
		"2006-01-02",
		"01/02/2006",
		"1/2/2006",
		"01/02/06",
		"01/02/2006 15:04:05",
		"02 JAN. 2006",
		"02 JAN 2006",
		"2 JAN. 2006",
		"2 JAN 2006",
		"02 Jan 2006",
		"2 Jan 2006",
	}
	normalized := strings.ToUpper(strings.ReplaceAll(s, ".", ""))
	for _, format := range formats {
		if t, err := time.Parse(format, s); err == nil {
			return pgtype.Date{Time: t, Valid: true}
		}
		if t, err := time.Parse(strings.ReplaceAll(format, ".", ""), normalized); err == nil {
			return pgtype.Date{Time: t, Valid: true}
		}
	}
	return pgtype.Date{}
}

func numericValue(value interface{}) pgtype.Numeric {
	s := strings.TrimSpace(importStringValue(value))
	if s == "" {
		return pgtype.Numeric{}
	}
	s = strings.ReplaceAll(strings.ToLower(s), " gb", "")
	s = strings.ReplaceAll(s, " tb", "")
	s = strings.ReplaceAll(s, ",", "")
	var n pgtype.Numeric
	if err := n.Scan(s); err != nil {
		return pgtype.Numeric{}
	}
	return n
}

func boolPointer(value bool) *bool {
	v := value
	return &v
}

func derefInt32(value *int32) int32 {
	if value == nil {
		return 0
	}
	return *value
}

func mustJSON(value interface{}) []byte {
	data, err := json.Marshal(value)
	if err != nil {
		return []byte("{}")
	}
	return data
}
