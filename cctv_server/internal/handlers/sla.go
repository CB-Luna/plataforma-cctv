package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type SlaHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
}

func NewSlaHandler(db *pgxpool.Pool, queries *database.Queries) *SlaHandler {
	return &SlaHandler{db: db, queries: queries}
}

type CreateSlaPolicyRequest struct {
	Name                string                 `json:"name" binding:"required"`
	TicketPriority      *string                `json:"ticket_priority,omitempty"`
	TicketType          *string                `json:"ticket_type,omitempty"`
	ResponseTimeHours   int32                  `json:"response_time_hours" binding:"required"`
	ResolutionTimeHours int32                  `json:"resolution_time_hours" binding:"required"`
	IsDefault           *bool                  `json:"is_default,omitempty"`
	IsActive            *bool                  `json:"is_active,omitempty"`
	BusinessHours       map[string]interface{} `json:"business_hours,omitempty"`
}

type UpdateSlaPolicyRequest struct {
	Name                *string                `json:"name,omitempty"`
	TicketPriority      *string                `json:"ticket_priority,omitempty"`
	TicketType          *string                `json:"ticket_type,omitempty"`
	ResponseTimeHours   *int32                 `json:"response_time_hours,omitempty"`
	ResolutionTimeHours *int32                 `json:"resolution_time_hours,omitempty"`
	IsDefault           *bool                  `json:"is_default,omitempty"`
	IsActive            *bool                  `json:"is_active,omitempty"`
	BusinessHours       map[string]interface{} `json:"business_hours,omitempty"`
}

func (h *SlaHandler) ListPolicies(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	policies, err := h.queries.ListSlaPoliciesByTenant(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list sla policies"})
		return
	}

	resp := make([]gin.H, 0, len(policies))
	for _, p := range policies {
		var business map[string]interface{}
		_ = json.Unmarshal(p.BusinessHours, &business)
		resp = append(resp, gin.H{
			"id":                    pgUUIDToString(p.ID),
			"tenant_id":             pgUUIDToString(p.TenantID),
			"name":                  p.Name,
			"ticket_priority":       nullPriorityToString(p.TicketPriority),
			"ticket_type":           nullTypeToString(p.TicketType),
			"response_time_hours":   p.ResponseTimeHours,
			"resolution_time_hours": p.ResolutionTimeHours,
			"is_default":            p.IsDefault,
			"is_active":             p.IsActive,
			"business_hours":        business,
			"created_at":            tsToString(p.CreatedAt),
			"updated_at":            tsToString(p.UpdatedAt),
		})
	}

	c.JSON(http.StatusOK, resp)
}

func (h *SlaHandler) CreatePolicy(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)

	var req CreateSlaPolicyRequest
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

	priority := database.NullTicketsTicketPriority{}
	if req.TicketPriority != nil && *req.TicketPriority != "" {
		priority = database.NullTicketsTicketPriority{
			TicketsTicketPriority: database.TicketsTicketPriority(*req.TicketPriority),
			Valid:                 true,
		}
	}
	ticketType := database.NullTicketsTicketType{}
	if req.TicketType != nil && *req.TicketType != "" {
		ticketType = database.NullTicketsTicketType{
			TicketsTicketType: database.TicketsTicketType(*req.TicketType),
			Valid:             true,
		}
	}

	businessRaw, _ := json.Marshal(req.BusinessHours)
	if len(businessRaw) == 0 {
		businessRaw = []byte("{}")
	}

	isDefault := false
	if req.IsDefault != nil {
		isDefault = *req.IsDefault
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	item, err := h.queries.CreateSlaPolicy(
		c.Request.Context(),
		pgTenantID,
		req.Name,
		priority,
		ticketType,
		req.ResponseTimeHours,
		req.ResolutionTimeHours,
		isDefault,
		isActive,
		businessRaw,
		pgUserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create sla policy"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":                    pgUUIDToString(item.ID),
		"tenant_id":             pgUUIDToString(item.TenantID),
		"name":                  item.Name,
		"ticket_priority":       nullPriorityToString(item.TicketPriority),
		"ticket_type":           nullTypeToString(item.TicketType),
		"response_time_hours":   item.ResponseTimeHours,
		"resolution_time_hours": item.ResolutionTimeHours,
		"is_default":            item.IsDefault,
		"is_active":             item.IsActive,
	})
}

func (h *SlaHandler) UpdatePolicy(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)
	slaID := c.Param("id")

	var req UpdateSlaPolicyRequest
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
	pgSlaID, err := toPgUUID(slaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sla policy ID"})
		return
	}

	current, err := h.queries.GetSlaPolicyByID(c.Request.Context(), pgSlaID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "sla policy not found"})
		return
	}

	priority := database.NullTicketsTicketPriority{}
	if req.TicketPriority != nil && *req.TicketPriority != "" {
		priority = database.NullTicketsTicketPriority{
			TicketsTicketPriority: database.TicketsTicketPriority(*req.TicketPriority),
			Valid:                 true,
		}
	}
	ticketType := database.NullTicketsTicketType{}
	if req.TicketType != nil && *req.TicketType != "" {
		ticketType = database.NullTicketsTicketType{
			TicketsTicketType: database.TicketsTicketType(*req.TicketType),
			Valid:             true,
		}
	}

	businessRaw := current.BusinessHours
	if req.BusinessHours != nil {
		businessRaw, _ = json.Marshal(req.BusinessHours)
	}

	name := current.Name
	if req.Name != nil {
		name = *req.Name
	}
	responseHours := current.ResponseTimeHours
	if req.ResponseTimeHours != nil {
		responseHours = *req.ResponseTimeHours
	}
	resolutionHours := current.ResolutionTimeHours
	if req.ResolutionTimeHours != nil {
		resolutionHours = *req.ResolutionTimeHours
	}
	isDefault := current.IsDefault
	if req.IsDefault != nil {
		isDefault = *req.IsDefault
	}
	isActive := current.IsActive
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	item, err := h.queries.UpdateSlaPolicy(c.Request.Context(), database.UpdateSlaPolicyParams{
		ID:                  pgSlaID,
		TenantID:            pgTenantID,
		Name:                name,
		TicketPriority:      priority,
		TicketType:          ticketType,
		ResponseTimeHours:   responseHours,
		ResolutionTimeHours: resolutionHours,
		IsDefault:           isDefault,
		IsActive:            isActive,
		BusinessHours:       businessRaw,
		UpdatedBy:           pgUserID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update sla policy"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":                    pgUUIDToString(item.ID),
		"tenant_id":             pgUUIDToString(item.TenantID),
		"name":                  item.Name,
		"ticket_priority":       nullPriorityToString(item.TicketPriority),
		"ticket_type":           nullTypeToString(item.TicketType),
		"response_time_hours":   item.ResponseTimeHours,
		"resolution_time_hours": item.ResolutionTimeHours,
		"is_default":            item.IsDefault,
		"is_active":             item.IsActive,
		"updated_at":            tsToString(item.UpdatedAt),
	})
}

func (h *SlaHandler) DeletePolicy(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	slaID := c.Param("id")

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}
	pgSlaID, err := toPgUUID(slaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sla policy ID"})
		return
	}

	if err := h.queries.DeactivateSlaPolicy(c.Request.Context(), pgSlaID, pgTenantID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to deactivate sla policy"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "sla policy deactivated"})
}

func nullTypeToString(t database.NullTicketsTicketType) string {
	if !t.Valid {
		return ""
	}
	return string(t.TicketsTicketType)
}
