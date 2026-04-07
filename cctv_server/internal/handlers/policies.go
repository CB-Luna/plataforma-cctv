package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type PolicyHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
}

func NewPolicyHandler(db *pgxpool.Pool, queries *database.Queries) *PolicyHandler {
	return &PolicyHandler{db: db, queries: queries}
}

type CreatePolicyRequest struct {
	PolicyNumber   string                 `json:"policy_number" binding:"required"`
	ClientID       string                 `json:"client_id" binding:"required"`
	SiteID         *string                `json:"site_id,omitempty"`
	CoveragePlanID *string                `json:"coverage_plan_id,omitempty"`
	Status         *string                `json:"status,omitempty"`
	StartDate      string                 `json:"start_date" binding:"required"`
	EndDate        string                 `json:"end_date" binding:"required"`
	MonthlyPayment float64                `json:"monthly_payment" binding:"required"`
	PaymentDay     *int32                 `json:"payment_day,omitempty"`
	Notes          *string                `json:"notes,omitempty"`
	TermsAccepted  *bool                  `json:"terms_accepted,omitempty"`
	ContractURL    *string                `json:"contract_url,omitempty"`
	Vendor         *string                `json:"vendor,omitempty"`
	ContractType   *string                `json:"contract_type,omitempty"`
	AnnualValue    *float64               `json:"annual_value,omitempty"`
	CoverageJSON   map[string]interface{} `json:"coverage_json,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

type UpdatePolicyRequest struct {
	PolicyNumber   *string                `json:"policy_number,omitempty"`
	ClientID       *string                `json:"client_id,omitempty"`
	SiteID         *string                `json:"site_id,omitempty"`
	CoveragePlanID *string                `json:"coverage_plan_id,omitempty"`
	Status         *string                `json:"status,omitempty"`
	StartDate      *string                `json:"start_date,omitempty"`
	EndDate        *string                `json:"end_date,omitempty"`
	MonthlyPayment *float64               `json:"monthly_payment,omitempty"`
	PaymentDay     *int32                 `json:"payment_day,omitempty"`
	Notes          *string                `json:"notes,omitempty"`
	TermsAccepted  *bool                  `json:"terms_accepted,omitempty"`
	ContractURL    *string                `json:"contract_url,omitempty"`
	Vendor         *string                `json:"vendor,omitempty"`
	ContractType   *string                `json:"contract_type,omitempty"`
	AnnualValue    *float64               `json:"annual_value,omitempty"`
	CoverageJSON   map[string]interface{} `json:"coverage_json,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

type AddPolicyAssetRequest struct {
	EquipmentID *string `json:"equipment_id,omitempty"`
	NvrServerID *string `json:"nvr_server_id,omitempty"`
	CameraID    *string `json:"camera_id,omitempty"`
	Notes       *string `json:"notes,omitempty"`
}

func (h *PolicyHandler) ListPolicies(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	status := c.DefaultQuery("status", "")
	provider := c.DefaultQuery("provider", "")
	clientID := c.DefaultQuery("client_id", "")

	rows, err := h.queries.ListPoliciesByTenant(c.Request.Context(), pgTenantID, status, provider, clientID, int32(limit), int32(offset))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list policies"})
		return
	}

	resp := make([]gin.H, 0, len(rows))
	for _, p := range rows {
		resp = append(resp, gin.H{
			"id":              pgUUIDToString(p.ID),
			"tenant_id":       pgUUIDToString(p.TenantID),
			"policy_number":   p.PolicyNumber,
			"client_id":       pgUUIDToString(p.ClientID),
			"site_id":         nullableUUID(p.SiteID),
			"status":          nullPolicyStatusToString(p.Status),
			"start_date":      dateToString(p.StartDate),
			"end_date":        dateToString(p.EndDate),
			"monthly_payment": numericToFloat(p.MonthlyPayment),
			"payment_day":     p.PaymentDay,
			"notes":           p.Notes,
			"contract_url":    p.ContractUrl,
			"vendor":          p.Vendor,
			"contract_type":   p.ContractType,
			"annual_value":    numericToFloat(p.AnnualValue),
			"client_name":     p.ClientName,
			"site_name":       p.SiteName,
			"created_at":      tsToString(p.CreatedAt),
			"updated_at":      tsToString(p.UpdatedAt),
		})
	}

	c.JSON(http.StatusOK, resp)
}

func (h *PolicyHandler) GetPolicy(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	policyID := c.Param("id")

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgPolicyID, err := toPgUUID(policyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid policy ID"})
		return
	}

	p, err := h.queries.GetPolicyByID(c.Request.Context(), pgPolicyID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "policy not found"})
		return
	}

	assets, _ := h.queries.ListPolicyAssets(c.Request.Context(), p.ID, p.TenantID)
	assetsResp := make([]gin.H, 0, len(assets))
	for _, a := range assets {
		assetsResp = append(assetsResp, gin.H{
			"id":               pgUUIDToString(a.ID),
			"equipment_id":     nullableUUID(a.EquipmentID),
			"nvr_server_id":    nullableUUID(a.NvrServerID),
			"camera_id":        nullableUUID(a.CameraID),
			"equipment_serial": a.EquipmentSerial,
			"nvr_name":         a.NvrName,
			"camera_name":      a.CameraName,
			"notes":            a.Notes,
			"created_at":       tsToString(a.CreatedAt),
		})
	}

	coverage := map[string]interface{}{}
	metadata := map[string]interface{}{}
	_ = json.Unmarshal(p.CoverageJson, &coverage)
	_ = json.Unmarshal(p.Metadata, &metadata)

	c.JSON(http.StatusOK, gin.H{
		"id":              pgUUIDToString(p.ID),
		"tenant_id":       pgUUIDToString(p.TenantID),
		"policy_number":   p.PolicyNumber,
		"client_id":       pgUUIDToString(p.ClientID),
		"site_id":         nullableUUID(p.SiteID),
		"status":          nullPolicyStatusToString(p.Status),
		"start_date":      dateToString(p.StartDate),
		"end_date":        dateToString(p.EndDate),
		"monthly_payment": numericToFloat(p.MonthlyPayment),
		"payment_day":     p.PaymentDay,
		"notes":           p.Notes,
		"contract_url":    p.ContractUrl,
		"vendor":          p.Vendor,
		"contract_type":   p.ContractType,
		"annual_value":    numericToFloat(p.AnnualValue),
		"coverage_json":   coverage,
		"metadata":        metadata,
		"client_name":     p.ClientName,
		"site_name":       p.SiteName,
		"assets":          assetsResp,
		"created_at":      tsToString(p.CreatedAt),
		"updated_at":      tsToString(p.UpdatedAt),
	})
}

func (h *PolicyHandler) CreatePolicy(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)

	var req CreatePolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgUserID, _ := toPgUUID(userID)
	pgClientID, err := toPgUUID(req.ClientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client ID"})
		return
	}

	startDate, err := parseDate(req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_date format (YYYY-MM-DD)"})
		return
	}
	endDate, err := parseDate(req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_date format (YYYY-MM-DD)"})
		return
	}

	monthlyPayment, err := toNumeric(req.MonthlyPayment)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid monthly_payment"})
		return
	}

	annualValue := pgtype.Numeric{}
	if req.AnnualValue != nil {
		annualValue, err = toNumeric(*req.AnnualValue)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid annual_value"})
			return
		}
	}

	siteID, err := parseOptionalUUID(req.SiteID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid site_id"})
		return
	}
	coveragePlanID, err := parseOptionalUUID(req.CoveragePlanID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid coverage_plan_id"})
		return
	}

	status := database.NullPoliciesPolicyStatus{
		PoliciesPolicyStatus: database.PoliciesPolicyStatus("active"),
		Valid:                true,
	}
	if req.Status != nil && *req.Status != "" {
		status = database.NullPoliciesPolicyStatus{
			PoliciesPolicyStatus: database.PoliciesPolicyStatus(*req.Status),
			Valid:                true,
		}
	}

	coverageRaw, _ := json.Marshal(req.CoverageJSON)
	if len(coverageRaw) == 0 {
		coverageRaw = []byte("{}")
	}
	metadataRaw, _ := json.Marshal(req.Metadata)
	if len(metadataRaw) == 0 {
		metadataRaw = []byte("{}")
	}

	p, err := h.queries.CreatePolicy(c.Request.Context(), database.CreatePolicyParams{
		TenantID:       pgTenantID,
		PolicyNumber:   req.PolicyNumber,
		ClientID:       pgClientID,
		SiteID:         siteID,
		CoveragePlanID: coveragePlanID,
		Status:         status,
		StartDate:      startDate,
		EndDate:        endDate,
		MonthlyPayment: monthlyPayment,
		PaymentDay:     req.PaymentDay,
		Notes:          req.Notes,
		TermsAccepted:  req.TermsAccepted,
		ContractUrl:    req.ContractURL,
		Vendor:         req.Vendor,
		ContractType:   req.ContractType,
		AnnualValue:    annualValue,
		CoverageJson:   coverageRaw,
		Metadata:       metadataRaw,
		CreatedBy:      pgUserID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create policy"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":            pgUUIDToString(p.ID),
		"tenant_id":     pgUUIDToString(p.TenantID),
		"policy_number": p.PolicyNumber,
		"status":        nullPolicyStatusToString(p.Status),
		"created_at":    tsToString(p.CreatedAt),
	})
}

func (h *PolicyHandler) UpdatePolicy(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	policyID := c.Param("id")

	var req UpdatePolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgPolicyID, err := toPgUUID(policyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid policy ID"})
		return
	}

	current, err := h.queries.GetPolicyByID(c.Request.Context(), pgPolicyID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "policy not found"})
		return
	}

	startDate, err := parseOptionalDate(req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_date"})
		return
	}
	endDate, err := parseOptionalDate(req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_date"})
		return
	}
	monthlyPayment, err := toOptionalNumeric(req.MonthlyPayment)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid monthly_payment"})
		return
	}
	annualValue, err := toOptionalNumeric(req.AnnualValue)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid annual_value"})
		return
	}

	clientID := current.ClientID
	if req.ClientID != nil {
		clientID, err = toPgUUID(*req.ClientID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client_id"})
			return
		}
	}
	siteID := current.SiteID
	if req.SiteID != nil {
		siteID, err = toPgUUID(*req.SiteID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid site_id"})
			return
		}
	}
	coveragePlanID := current.CoveragePlanID
	if req.CoveragePlanID != nil {
		coveragePlanID, err = toPgUUID(*req.CoveragePlanID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid coverage_plan_id"})
			return
		}
	}

	status := current.Status
	if req.Status != nil && *req.Status != "" {
		status = database.NullPoliciesPolicyStatus{
			PoliciesPolicyStatus: database.PoliciesPolicyStatus(*req.Status),
			Valid:                true,
		}
	}

	coverageRaw := current.CoverageJson
	metadataRaw := current.Metadata
	if req.CoverageJSON != nil {
		coverageRaw, _ = json.Marshal(req.CoverageJSON)
	}
	if req.Metadata != nil {
		metadataRaw, _ = json.Marshal(req.Metadata)
	}

	policyNumber := current.PolicyNumber
	if req.PolicyNumber != nil {
		policyNumber = *req.PolicyNumber
	}
	effectiveStartDate := current.StartDate
	if req.StartDate != nil {
		effectiveStartDate = startDate
	}
	effectiveEndDate := current.EndDate
	if req.EndDate != nil {
		effectiveEndDate = endDate
	}
	effectiveMonthly := current.MonthlyPayment
	if req.MonthlyPayment != nil {
		effectiveMonthly = monthlyPayment
	}
	effectiveAnnual := current.AnnualValue
	if req.AnnualValue != nil {
		effectiveAnnual = annualValue
	}

	p, err := h.queries.UpdatePolicy(c.Request.Context(), database.UpdatePolicyParams{
		ID:             pgPolicyID,
		TenantID:       pgTenantID,
		PolicyNumber:   policyNumber,
		ClientID:       clientID,
		SiteID:         siteID,
		CoveragePlanID: coveragePlanID,
		Status:         status,
		StartDate:      effectiveStartDate,
		EndDate:        effectiveEndDate,
		MonthlyPayment: effectiveMonthly,
		PaymentDay:     req.PaymentDay,
		Notes:          req.Notes,
		TermsAccepted:  req.TermsAccepted,
		ContractUrl:    req.ContractURL,
		Vendor:         req.Vendor,
		ContractType:   req.ContractType,
		AnnualValue:    effectiveAnnual,
		CoverageJson:   coverageRaw,
		Metadata:       metadataRaw,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update policy"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":            pgUUIDToString(p.ID),
		"tenant_id":     pgUUIDToString(p.TenantID),
		"policy_number": p.PolicyNumber,
		"status":        nullPolicyStatusToString(p.Status),
		"updated_at":    tsToString(p.UpdatedAt),
	})
}

func (h *PolicyHandler) DeletePolicy(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	policyID := c.Param("id")

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgPolicyID, err := toPgUUID(policyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid policy ID"})
		return
	}

	if err := h.queries.SoftDeletePolicy(c.Request.Context(), pgPolicyID, pgTenantID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete policy"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "policy cancelled"})
}

func (h *PolicyHandler) AddPolicyAsset(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	policyID := c.Param("id")

	var req AddPolicyAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgPolicyID, err := toPgUUID(policyID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid policy ID"})
		return
	}

	if req.EquipmentID != nil && *req.EquipmentID != "" {
		equipmentID, err := toPgUUID(*req.EquipmentID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid equipment_id"})
			return
		}
		asset, err := h.queries.AddPolicyAssetEquipment(c.Request.Context(), pgTenantID, pgPolicyID, equipmentID, req.Notes)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add policy asset"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"id": pgUUIDToString(asset.ID), "policy_id": pgUUIDToString(asset.PolicyID)})
		return
	}

	if req.NvrServerID != nil && *req.NvrServerID != "" {
		nvrID, err := toPgUUID(*req.NvrServerID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid nvr_server_id"})
			return
		}
		asset, err := h.queries.AddPolicyAssetNvr(c.Request.Context(), pgTenantID, pgPolicyID, nvrID, req.Notes)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add policy asset"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"id": pgUUIDToString(asset.ID), "policy_id": pgUUIDToString(asset.PolicyID)})
		return
	}

	if req.CameraID != nil && *req.CameraID != "" {
		cameraID, err := toPgUUID(*req.CameraID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid camera_id"})
			return
		}
		asset, err := h.queries.AddPolicyAssetCamera(c.Request.Context(), pgTenantID, pgPolicyID, cameraID, req.Notes)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add policy asset"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"id": pgUUIDToString(asset.ID), "policy_id": pgUUIDToString(asset.PolicyID)})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "one of equipment_id, nvr_server_id, camera_id is required"})
}

func (h *PolicyHandler) RemovePolicyAsset(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	assetID := c.Param("assetId")

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgAssetID, err := toPgUUID(assetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid asset ID"})
		return
	}

	if err := h.queries.RemovePolicyAsset(c.Request.Context(), pgAssetID, pgTenantID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove policy asset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "policy asset removed"})
}

func parseDate(v string) (pgtype.Date, error) {
	t, err := time.Parse("2006-01-02", v)
	if err != nil {
		return pgtype.Date{}, err
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}

func parseOptionalDate(v *string) (pgtype.Date, error) {
	if v == nil || *v == "" {
		return pgtype.Date{}, nil
	}
	return parseDate(*v)
}

func toNumeric(v float64) (pgtype.Numeric, error) {
	var n pgtype.Numeric
	err := n.Scan(v)
	return n, err
}

func toOptionalNumeric(v *float64) (pgtype.Numeric, error) {
	if v == nil {
		return pgtype.Numeric{}, nil
	}
	return toNumeric(*v)
}

func parseOptionalUUID(v *string) (pgtype.UUID, error) {
	if v == nil || *v == "" {
		return pgtype.UUID{}, nil
	}
	return toPgUUID(*v)
}

func dateToString(d pgtype.Date) string {
	if !d.Valid {
		return ""
	}
	return d.Time.Format("2006-01-02")
}

func tsToString(ts pgtype.Timestamptz) string {
	if !ts.Valid {
		return ""
	}
	return ts.Time.Format(time.RFC3339)
}

func nullPolicyStatusToString(s database.NullPoliciesPolicyStatus) string {
	if !s.Valid {
		return ""
	}
	return string(s.PoliciesPolicyStatus)
}

func numericToFloat(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	v, err := n.Float64Value()
	if err != nil {
		return 0
	}
	return v.Float64
}

func nullableUUID(id pgtype.UUID) *string {
	if !id.Valid {
		return nil
	}
	s := pgUUIDToString(id)
	return &s
}
