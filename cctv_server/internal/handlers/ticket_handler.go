package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type TicketHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
}

func NewTicketHandler(db *pgxpool.Pool, queries *database.Queries) *TicketHandler {
	return &TicketHandler{
		db:      db,
		queries: queries,
	}
}

// ListTickets godoc
// @Summary List all tickets
// @Description Get a paginated list of tickets for the current tenant
// @Tags tickets
// @Accept json
// @Produce json
// @Param limit query int false "Number of items to return" default(20)
// @Param offset query int false "Number of items to skip" default(0)
// @Param status query string false "Filter by status"
// @Param type query string false "Filter by type"
// @Param priority query string false "Filter by priority"
// @Success 200 {array} TicketResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tickets [get]
// @Security BearerAuth
func (h *TicketHandler) ListTickets(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	status := c.Query("status")
	ticketType := c.Query("type")
	priority := c.Query("priority")
	slaStatus := c.Query("sla_status")
	coverageStatus := c.Query("coverage_status")

	var responses []TicketResponse

	if slaStatus != "" {
		tickets, err := h.queries.ListTicketsBySlaStatus(c.Request.Context(), pgTenantID,
			database.TicketsSlaStatus(slaStatus), int32(limit), int32(offset))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tickets by sla status"})
			return
		}
		for _, t := range tickets {
			responses = append(responses, h.slaStatusRowToResponse(t))
		}
	} else if coverageStatus != "" {
		tickets, err := h.queries.ListTicketsByCoverageStatus(c.Request.Context(), pgTenantID,
			database.TicketsCoverageStatus(coverageStatus), int32(limit), int32(offset))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tickets by coverage status"})
			return
		}
		for _, t := range tickets {
			responses = append(responses, h.coverageStatusRowToResponse(t))
		}
	} else if status != "" {
		tickets, err := h.queries.ListTicketsByStatus(c.Request.Context(), pgTenantID,
			database.NullTicketsTicketStatus{TicketsTicketStatus: database.TicketsTicketStatus(status), Valid: true},
			int32(limit), int32(offset))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tickets"})
			return
		}
		for _, t := range tickets {
			responses = append(responses, h.statusRowToResponse(t))
		}
	} else if ticketType != "" {
		tickets, err := h.queries.ListTicketsByType(c.Request.Context(), pgTenantID,
			database.TicketsTicketType(ticketType), int32(limit), int32(offset))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tickets"})
			return
		}
		for _, t := range tickets {
			responses = append(responses, h.typeRowToResponse(t))
		}
	} else if priority != "" {
		tickets, err := h.queries.ListTicketsByPriority(c.Request.Context(), pgTenantID,
			database.NullTicketsTicketPriority{TicketsTicketPriority: database.TicketsTicketPriority(priority), Valid: true},
			int32(limit), int32(offset))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tickets"})
			return
		}
		for _, t := range tickets {
			responses = append(responses, h.priorityRowToResponse(t))
		}
	} else {
		tickets, err := h.queries.ListTicketsByTenant(c.Request.Context(), pgTenantID, int32(limit), int32(offset))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tickets"})
			return
		}
		for _, t := range tickets {
			responses = append(responses, h.tenantRowToResponse(t))
		}
	}

	if responses == nil {
		responses = []TicketResponse{}
	}

	c.JSON(http.StatusOK, responses)
}

// GetTicket godoc
// @Summary Get a ticket by ID
// @Description Get detailed information about a specific ticket
// @Tags tickets
// @Accept json
// @Produce json
// @Param id path string true "Ticket ID (UUID)"
// @Success 200 {object} TicketDetailResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /tickets/{id} [get]
// @Security BearerAuth
func (h *TicketHandler) GetTicket(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	ticketID := c.Param("id")

	pgTicketID, err := toPgUUID(ticketID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	ticket, err := h.queries.GetTicketWithSlaAndPolicy(c.Request.Context(), pgTicketID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
		return
	}

	response := h.ticketDetailToResponse(ticket)
	c.JSON(http.StatusOK, response)
}

// CreateTicket godoc
// @Summary Create a new ticket
// @Description Create a new support ticket (preventive or corrective)
// @Tags tickets
// @Accept json
// @Produce json
// @Param ticket body CreateTicketRequest true "Ticket data"
// @Success 201 {object} TicketResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tickets [post]
// @Security BearerAuth
func (h *TicketHandler) CreateTicket(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)

	var req CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	// Generate ticket number
	nextNum, err := h.queries.GenerateTicketNumber(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate ticket number"})
		return
	}

	year := time.Now().Year()
	ticketNumber := fmt.Sprintf("TKT-%d-%05d", year, nextNum)

	pgClientID, err := toPgUUID(req.ClientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client ID format"})
		return
	}

	pgSiteID, err := toPgUUID(req.SiteID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid site ID format"})
		return
	}

	var pgEquipmentID pgtype.UUID
	if req.EquipmentID != nil && *req.EquipmentID != "" {
		pgEquipmentID, _ = toPgUUID(*req.EquipmentID)
	}
	var pgPolicyID pgtype.UUID
	if req.PolicyID != nil && *req.PolicyID != "" {
		pgPolicyID, err = toPgUUID(*req.PolicyID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid policy ID format"})
			return
		}
	}

	pgReportedBy, _ := toPgUUID(userID)

	ticketType := database.TicketsTicketType("corrective")
	if req.Type != "" {
		ticketType = database.TicketsTicketType(req.Type)
	}

	priority := database.NullTicketsTicketPriority{
		TicketsTicketPriority: database.TicketsTicketPriority("medium"),
		Valid:                 true,
	}
	if req.Priority != "" {
		priority = database.NullTicketsTicketPriority{
			TicketsTicketPriority: database.TicketsTicketPriority(req.Priority),
			Valid:                 true,
		}
	}

	ticket, err := h.queries.CreateTicket(c.Request.Context(), database.CreateTicketParams{
		TenantID:     pgTenantID,
		TicketNumber: ticketNumber,
		ClientID:     pgClientID,
		SiteID:       pgSiteID,
		PolicyID:     pgPolicyID,
		EquipmentID:  pgEquipmentID,
		Type:         ticketType,
		Priority:     priority,
		Title:        req.Title,
		Description:  req.Description,
		ReportedBy:   pgReportedBy,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create ticket: %v", err)})
		return
	}

	// Create timeline entry
	_, _ = h.queries.CreateTicketTimeline(c.Request.Context(),
		pgTenantID, ticket.ID, "created", strPtr("Ticket created"),
		pgReportedBy, nil, strPtr("open"), nil)

	_ = h.attachPolicyAndSLA(c, ticket, pgTenantID, pgClientID, pgSiteID, pgPolicyID, ticketType, priority)

	response := TicketResponse{
		ID:           pgUUIDToString(ticket.ID),
		TenantID:     pgUUIDToString(ticket.TenantID),
		TicketNumber: ticket.TicketNumber,
		Type:         string(ticket.Type),
		Priority:     nullPriorityToString(ticket.Priority),
		Status:       nullStatusToString(ticket.Status),
		Title:        ticket.Title,
		Description:  ticket.Description,
		CreatedAt:    ticket.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:    ticket.UpdatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateTicket godoc
// @Summary Update a ticket
// @Description Update ticket information
// @Tags tickets
// @Accept json
// @Produce json
// @Param id path string true "Ticket ID (UUID)"
// @Param ticket body UpdateTicketRequest true "Updated ticket data"
// @Success 200 {object} TicketResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /tickets/{id} [put]
// @Security BearerAuth
func (h *TicketHandler) UpdateTicket(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	ticketID := c.Param("id")

	var req UpdateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTicketID, err := toPgUUID(ticketID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	// Get title or use empty string
	title := ""
	if req.Title != nil {
		title = *req.Title
	}

	var pgSiteID pgtype.UUID
	if req.SiteID != nil && *req.SiteID != "" {
		pgSiteID, _ = toPgUUID(*req.SiteID)
	}

	var pgEquipmentID pgtype.UUID
	if req.EquipmentID != nil && *req.EquipmentID != "" {
		pgEquipmentID, _ = toPgUUID(*req.EquipmentID)
	}

	var scheduledDate pgtype.Timestamptz
	if req.ScheduledDate != nil && *req.ScheduledDate != "" {
		t, err := time.Parse(time.RFC3339, *req.ScheduledDate)
		if err == nil {
			scheduledDate = pgtype.Timestamptz{Time: t, Valid: true}
		}
	}

	priority := database.NullTicketsTicketPriority{}
	if req.Priority != nil {
		priority = database.NullTicketsTicketPriority{
			TicketsTicketPriority: database.TicketsTicketPriority(*req.Priority),
			Valid:                 true,
		}
	}

	ticketType := database.TicketsTicketType("")
	if req.Type != nil {
		ticketType = database.TicketsTicketType(*req.Type)
	}

	err = h.queries.UpdateTicket(c.Request.Context(),
		pgTicketID, pgTenantID, title, req.Description,
		priority, ticketType, pgSiteID, pgEquipmentID, scheduledDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update ticket"})
		return
	}

	// Fetch updated ticket
	ticket, err := h.queries.GetTicketByID(c.Request.Context(), pgTicketID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
		return
	}

	response := TicketResponse{
		ID:           pgUUIDToString(ticket.ID),
		TenantID:     pgUUIDToString(ticket.TenantID),
		TicketNumber: ticket.TicketNumber,
		Type:         string(ticket.Type),
		Priority:     nullPriorityToString(ticket.Priority),
		Status:       nullStatusToString(ticket.Status),
		Title:        ticket.Title,
		Description:  ticket.Description,
		ClientName:   ticket.ClientName,
		SiteName:     ticket.SiteName,
		CreatedAt:    ticket.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:    ticket.UpdatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// ChangeTicketStatus godoc
// @Summary Change ticket status
// @Description Update the status of a ticket (workflow transition)
// @Tags tickets
// @Accept json
// @Produce json
// @Param id path string true "Ticket ID (UUID)"
// @Param status body ChangeStatusRequest true "New status"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tickets/{id}/status [patch]
// @Security BearerAuth
func (h *TicketHandler) ChangeTicketStatus(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)
	ticketID := c.Param("id")

	var req ChangeStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTicketID, err := toPgUUID(ticketID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	pgUserID, _ := toPgUUID(userID)

	// Get current ticket for timeline
	currentTicket, err := h.queries.GetTicketByID(c.Request.Context(), pgTicketID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
		return
	}

	oldStatus := nullStatusToString(currentTicket.Status)

	// Handle special status transitions
	switch req.Status {
	case "in_progress":
		err = h.queries.StartTicket(c.Request.Context(), pgTicketID, pgTenantID)
	case "closed":
		err = h.queries.CloseTicket(c.Request.Context(), pgTicketID, pgTenantID)
	case "cancelled":
		err = h.queries.CancelTicket(c.Request.Context(), pgTicketID, pgTenantID, req.Reason)
	default:
		err = h.queries.UpdateTicketStatus(c.Request.Context(), pgTicketID, pgTenantID,
			database.NullTicketsTicketStatus{TicketsTicketStatus: database.TicketsTicketStatus(req.Status), Valid: true})
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update ticket status"})
		return
	}

	// Create timeline entry
	_, _ = h.queries.CreateTicketTimeline(c.Request.Context(),
		pgTenantID, pgTicketID, "status_change",
		strPtr(fmt.Sprintf("Status changed from %s to %s", oldStatus, req.Status)),
		pgUserID, strPtr(oldStatus), strPtr(req.Status), nil)

	// Actualización de snapshot SLA según transición de estado.
	if req.Status != "open" {
		_ = h.queries.MarkTicketSlaResponded(c.Request.Context(), pgTicketID, pgTenantID)
	}
	if req.Status == "completed" || req.Status == "closed" || req.Status == "cancelled" {
		_ = h.queries.MarkTicketSlaResolved(c.Request.Context(), pgTicketID, pgTenantID)
	}
	_ = h.queries.RefreshTicketSlaStatus(c.Request.Context(), pgTicketID, pgTenantID)

	c.JSON(http.StatusOK, gin.H{"message": "status updated successfully"})
}

// AssignTicket godoc
// @Summary Assign ticket to technician
// @Description Assign a ticket to a technician
// @Tags tickets
// @Accept json
// @Produce json
// @Param id path string true "Ticket ID (UUID)"
// @Param assignment body AssignTicketRequest true "Assignment data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tickets/{id}/assign [patch]
// @Security BearerAuth
func (h *TicketHandler) AssignTicket(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)
	ticketID := c.Param("id")

	var req AssignTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTicketID, err := toPgUUID(ticketID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	pgTechnicianID, err := toPgUUID(req.TechnicianID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid technician ID format"})
		return
	}

	pgUserID, _ := toPgUUID(userID)

	err = h.queries.AssignTicket(c.Request.Context(), pgTicketID, pgTenantID, pgTechnicianID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign ticket"})
		return
	}

	// Create timeline entry
	_, _ = h.queries.CreateTicketTimeline(c.Request.Context(),
		pgTenantID, pgTicketID, "assignment",
		strPtr("Ticket assigned to technician"),
		pgUserID, nil, strPtr(req.TechnicianID), nil)

	c.JSON(http.StatusOK, gin.H{"message": "ticket assigned successfully"})
}

// GetTicketTimeline godoc
// @Summary Get ticket timeline
// @Description Get the timeline/history of a ticket
// @Tags tickets
// @Produce json
// @Param id path string true "Ticket ID (UUID)"
// @Success 200 {array} TimelineEntryResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tickets/{id}/timeline [get]
// @Security BearerAuth
func (h *TicketHandler) GetTicketTimeline(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	ticketID := c.Param("id")

	pgTicketID, err := toPgUUID(ticketID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	timeline, err := h.queries.ListTicketTimeline(c.Request.Context(), pgTicketID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch timeline"})
		return
	}

	responses := make([]TimelineEntryResponse, len(timeline))
	for i, entry := range timeline {
		responses[i] = TimelineEntryResponse{
			ID:          pgUUIDToString(entry.ID),
			EventType:   entry.EventType,
			Description: entry.Description,
			UserName:    interfaceToStringPtr(entry.UserName),
			OldValue:    entry.OldValue,
			NewValue:    entry.NewValue,
			CreatedAt:   entry.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// ListTicketComments godoc
// @Summary List ticket comments
// @Description Get all comments for a ticket
// @Tags tickets
// @Produce json
// @Param id path string true "Ticket ID (UUID)"
// @Success 200 {array} CommentResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tickets/{id}/comments [get]
// @Security BearerAuth
func (h *TicketHandler) ListTicketComments(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	ticketID := c.Param("id")

	pgTicketID, err := toPgUUID(ticketID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	comments, err := h.queries.ListTicketComments(c.Request.Context(), pgTicketID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch comments"})
		return
	}

	responses := make([]CommentResponse, len(comments))
	for i, comment := range comments {
		responses[i] = CommentResponse{
			ID:         pgUUIDToString(comment.ID),
			Comment:    comment.Comment,
			UserName:   interfaceToStringPtr(comment.UserName),
			IsInternal: boolValue(comment.IsInternal),
			CreatedAt:  comment.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// AddTicketComment godoc
// @Summary Add comment to ticket
// @Description Add a new comment to a ticket
// @Tags tickets
// @Accept json
// @Produce json
// @Param id path string true "Ticket ID (UUID)"
// @Param comment body AddCommentRequest true "Comment data"
// @Success 201 {object} CommentResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tickets/{id}/comments [post]
// @Security BearerAuth
func (h *TicketHandler) AddTicketComment(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)
	ticketID := c.Param("id")

	var req AddCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTicketID, err := toPgUUID(ticketID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	isInternal := false
	if req.IsInternal != nil {
		isInternal = *req.IsInternal
	}

	comment, err := h.queries.CreateTicketComment(c.Request.Context(),
		pgTenantID, pgTicketID, pgUserID, req.Comment, &isInternal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create comment"})
		return
	}

	// Also add to timeline
	_, _ = h.queries.CreateTicketTimeline(c.Request.Context(),
		pgTenantID, pgTicketID, "comment",
		strPtr("Comment added"), pgUserID, nil, nil, nil)

	response := CommentResponse{
		ID:         pgUUIDToString(comment.ID),
		Comment:    comment.Comment,
		IsInternal: boolValue(comment.IsInternal),
		CreatedAt:  comment.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusCreated, response)
}

// GetTicketStats godoc
// @Summary Get ticket statistics
// @Description Get ticket counts by status, type, and priority
// @Tags tickets
// @Produce json
// @Success 200 {object} TicketStatsResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tickets/stats [get]
// @Security BearerAuth
func (h *TicketHandler) GetTicketStats(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	stats, err := h.queries.GetTicketStats(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch ticket stats"})
		return
	}

	response := TicketStatsResponse{
		Total:                stats.Total,
		OpenCount:            stats.OpenCount,
		AssignedCount:        stats.AssignedCount,
		InProgressCount:      stats.InProgressCount,
		PendingPartsCount:    stats.PendingPartsCount,
		PendingApprovalCount: stats.PendingApprovalCount,
		OnHoldCount:          stats.OnHoldCount,
		CompletedCount:       stats.CompletedCount,
		CancelledCount:       stats.CancelledCount,
		CriticalCount:        stats.CriticalCount,
		HighCount:            stats.HighCount,
		PreventiveCount:      stats.PreventiveCount,
		CorrectiveCount:      stats.CorrectiveCount,
	}

	c.JSON(http.StatusOK, response)
}

// GetTechniciansWorkload godoc
// @Summary Get technicians workload
// @Description Get active ticket counts for all technicians
// @Tags tickets
// @Produce json
// @Success 200 {array} TechnicianWorkloadResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tickets/technicians/workload [get]
// @Security BearerAuth
func (h *TicketHandler) GetTechniciansWorkload(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	workload, err := h.queries.GetTechniciansWorkload(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch technicians workload"})
		return
	}

	responses := make([]TechnicianWorkloadResponse, len(workload))
	for i, w := range workload {
		responses[i] = TechnicianWorkloadResponse{
			TechnicianID:    pgUUIDToString(w.TechnicianID),
			TechnicianName:  interfaceToStringPtr(w.TechnicianName),
			TechnicianEmail: strPtr(w.TechnicianEmail),
			ActiveTickets:   w.ActiveTickets,
			UrgentTickets:   w.UrgentTickets,
			HighTickets:     w.HighTickets,
		}
	}

	c.JSON(http.StatusOK, responses)
}

// DeleteTicket godoc
// @Summary Delete a ticket
// @Description Delete a ticket
// @Tags tickets
// @Param id path string true "Ticket ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /tickets/{id} [delete]
// @Security BearerAuth
func (h *TicketHandler) DeleteTicket(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	ticketID := c.Param("id")

	pgTicketID, err := toPgUUID(ticketID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	err = h.queries.DeleteTicket(c.Request.Context(), pgTicketID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete ticket"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ticket deleted successfully"})
}

// Helper functions

func (h *TicketHandler) statusRowToResponse(t database.ListTicketsByStatusRow) TicketResponse {
	var clientID *string
	if t.ClientID.Valid {
		id := pgUUIDToString(t.ClientID)
		clientID = &id
	}

	return TicketResponse{
		ID:           pgUUIDToString(t.ID),
		TenantID:     pgUUIDToString(t.TenantID),
		TicketNumber: t.TicketNumber,
		ClientID:     clientID,
		Type:         string(t.Type),
		Priority:     nullPriorityToString(t.Priority),
		Status:       nullStatusToString(t.Status),
		Title:        t.Title,
		Description:  t.Description,
		ClientName:   t.ClientName,
		CreatedAt:    t.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:    t.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func (h *TicketHandler) typeRowToResponse(t database.ListTicketsByTypeRow) TicketResponse {
	var clientID *string
	if t.ClientID.Valid {
		id := pgUUIDToString(t.ClientID)
		clientID = &id
	}

	return TicketResponse{
		ID:             pgUUIDToString(t.ID),
		TenantID:       pgUUIDToString(t.TenantID),
		TicketNumber:   t.TicketNumber,
		ClientID:       clientID,
		Type:           string(t.Type),
		Priority:       nullPriorityToString(t.Priority),
		Status:         nullStatusToString(t.Status),
		Title:          t.Title,
		Description:    t.Description,
		ClientName:     t.ClientName,
		AssignedToName: interfaceToStringPtr(t.AssignedToName),
		CreatedAt:      t.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:      t.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func (h *TicketHandler) priorityRowToResponse(t database.ListTicketsByPriorityRow) TicketResponse {
	var clientID *string
	if t.ClientID.Valid {
		id := pgUUIDToString(t.ClientID)
		clientID = &id
	}

	return TicketResponse{
		ID:             pgUUIDToString(t.ID),
		TenantID:       pgUUIDToString(t.TenantID),
		TicketNumber:   t.TicketNumber,
		ClientID:       clientID,
		Type:           string(t.Type),
		Priority:       nullPriorityToString(t.Priority),
		Status:         nullStatusToString(t.Status),
		Title:          t.Title,
		Description:    t.Description,
		ClientName:     t.ClientName,
		AssignedToName: interfaceToStringPtr(t.AssignedToName),
		CreatedAt:      t.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:      t.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func (h *TicketHandler) tenantRowToResponse(t database.ListTicketsByTenantRow) TicketResponse {
	var clientID, assignedTo *string
	if t.ClientID.Valid {
		id := pgUUIDToString(t.ClientID)
		clientID = &id
	}
	if t.AssignedTo.Valid {
		id := pgUUIDToString(t.AssignedTo)
		assignedTo = &id
	}

	return TicketResponse{
		ID:             pgUUIDToString(t.ID),
		TenantID:       pgUUIDToString(t.TenantID),
		TicketNumber:   t.TicketNumber,
		ClientID:       clientID,
		AssignedTo:     assignedTo,
		Type:           string(t.Type),
		Priority:       nullPriorityToString(t.Priority),
		Status:         nullStatusToString(t.Status),
		Title:          t.Title,
		Description:    t.Description,
		ClientName:     t.ClientName,
		AssignedToName: interfaceToStringPtr(t.AssignedToName),
		CreatedAt:      t.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:      t.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func (h *TicketHandler) slaStatusRowToResponse(t database.ListTicketsBySlaStatusRow) TicketResponse {
	var clientID, assignedTo *string
	if t.ClientID.Valid {
		id := pgUUIDToString(t.ClientID)
		clientID = &id
	}
	if t.AssignedTo.Valid {
		id := pgUUIDToString(t.AssignedTo)
		assignedTo = &id
	}
	sla := interfaceToStringWithDefault(t.SlaStatus, "unknown")
	coverage := interfaceToStringWithDefault(t.CoverageStatus, "unknown")

	return TicketResponse{
		ID:             pgUUIDToString(t.ID),
		TenantID:       pgUUIDToString(t.TenantID),
		TicketNumber:   t.TicketNumber,
		ClientID:       clientID,
		PolicyID:       nullableUUID(t.PolicyID),
		AssignedTo:     assignedTo,
		Type:           string(t.Type),
		Priority:       nullPriorityToString(t.Priority),
		Status:         nullStatusToString(t.Status),
		Title:          t.Title,
		Description:    t.Description,
		ClientName:     t.ClientName,
		AssignedToName: interfaceToStringPtr(t.AssignedToName),
		SlaStatus:      &sla,
		CoverageStatus: &coverage,
		CreatedAt:      t.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:      t.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func (h *TicketHandler) coverageStatusRowToResponse(t database.ListTicketsByCoverageStatusRow) TicketResponse {
	var clientID, assignedTo *string
	if t.ClientID.Valid {
		id := pgUUIDToString(t.ClientID)
		clientID = &id
	}
	if t.AssignedTo.Valid {
		id := pgUUIDToString(t.AssignedTo)
		assignedTo = &id
	}
	sla := interfaceToStringWithDefault(t.SlaStatus, "unknown")
	coverage := interfaceToStringWithDefault(t.CoverageStatus, "unknown")

	return TicketResponse{
		ID:             pgUUIDToString(t.ID),
		TenantID:       pgUUIDToString(t.TenantID),
		TicketNumber:   t.TicketNumber,
		ClientID:       clientID,
		PolicyID:       nullableUUID(t.PolicyID),
		AssignedTo:     assignedTo,
		Type:           string(t.Type),
		Priority:       nullPriorityToString(t.Priority),
		Status:         nullStatusToString(t.Status),
		Title:          t.Title,
		Description:    t.Description,
		ClientName:     t.ClientName,
		AssignedToName: interfaceToStringPtr(t.AssignedToName),
		SlaStatus:      &sla,
		CoverageStatus: &coverage,
		CreatedAt:      t.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:      t.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func (h *TicketHandler) ticketDetailToResponse(t database.GetTicketWithSlaAndPolicyRow) TicketDetailResponse {
	var clientID, siteID, assignedTo, reportedBy *string

	if t.ClientID.Valid {
		id := pgUUIDToString(t.ClientID)
		clientID = &id
	}
	if t.SiteID.Valid {
		id := pgUUIDToString(t.SiteID)
		siteID = &id
	}
	if t.AssignedTo.Valid {
		id := pgUUIDToString(t.AssignedTo)
		assignedTo = &id
	}
	if t.ReportedBy.Valid {
		id := pgUUIDToString(t.ReportedBy)
		reportedBy = &id
	}

	var scheduledDate, startedAt, completedAt, slaDeadline *string
	if t.ScheduledDate.Valid {
		s := t.ScheduledDate.Time.Format(time.RFC3339)
		scheduledDate = &s
	}
	if t.StartedAt.Valid {
		s := t.StartedAt.Time.Format(time.RFC3339)
		startedAt = &s
	}
	if t.CompletedAt.Valid {
		s := t.CompletedAt.Time.Format(time.RFC3339)
		completedAt = &s
	}
	if t.SlaDeadline.Valid {
		s := t.SlaDeadline.Time.Format(time.RFC3339)
		slaDeadline = &s
	}

	var dueResponseAt, dueResolutionAt, respondedAt, resolvedAt *string
	if t.DueResponseAt.Valid {
		s := t.DueResponseAt.Time.Format(time.RFC3339)
		dueResponseAt = &s
	}
	if t.DueResolutionAt.Valid {
		s := t.DueResolutionAt.Time.Format(time.RFC3339)
		dueResolutionAt = &s
	}
	if t.RespondedAt.Valid {
		s := t.RespondedAt.Time.Format(time.RFC3339)
		respondedAt = &s
	}
	if t.ResolvedAt.Valid {
		s := t.ResolvedAt.Time.Format(time.RFC3339)
		resolvedAt = &s
	}

	policyID := nullableUUID(t.PolicyID)
	slaStatus := interfaceToStringWithDefault(t.SlaStatus, "unknown")
	coverageStatus := interfaceToStringWithDefault(t.CoverageStatus, "unknown")
	timeToResponse := diffMinutes(t.CreatedAt.Time, t.RespondedAt, time.Now())
	timeToResolution := diffMinutes(t.CreatedAt.Time, t.ResolvedAt, time.Now())

	return TicketDetailResponse{
		ID:              pgUUIDToString(t.ID),
		TenantID:        pgUUIDToString(t.TenantID),
		TicketNumber:    t.TicketNumber,
		ClientID:        clientID,
		SiteID:          siteID,
		Type:            string(t.Type),
		Priority:        nullPriorityToString(t.Priority),
		Status:          nullStatusToString(t.Status),
		Title:           t.Title,
		Description:     t.Description,
		AssignedTo:      assignedTo,
		ReportedBy:      reportedBy,
		ClientName:      t.ClientName,
		ClientEmail:     t.ClientEmail,
		ClientPhone:     t.ClientPhone,
		SiteName:        t.SiteName,
		SiteAddress:     t.SiteAddress,
		SiteCity:        t.SiteCity,
		EquipmentSerial: t.EquipmentSerial,
		ReportedByName:  interfaceToStringPtr(t.ReportedByName),
		ReportedByEmail: t.ReportedByEmail,
		AssignedToName:  interfaceToStringPtr(t.AssignedToName),
		AssignedToEmail: t.AssignedToEmail,
		AssignedToPhone: t.AssignedToPhone,
		Policy: &TicketPolicyResponse{
			PolicyID:       policyID,
			PolicyNumber:   t.PolicyNumber,
			PolicyVendor:   t.PolicyVendor,
			ContractType:   t.PolicyContractType,
			CoverageStatus: &coverageStatus,
		},
		SLA: &TicketSLAResponse{
			SlaPolicyName:          t.SlaPolicyName,
			SlaStatus:              &slaStatus,
			DueResponseAt:          dueResponseAt,
			DueResolutionAt:        dueResolutionAt,
			RespondedAt:            respondedAt,
			ResolvedAt:             resolvedAt,
			BreachedResponse:       t.BreachedResponse,
			BreachedResolution:     t.BreachedResolution,
			TimeToResponseMinutes:  &timeToResponse,
			TimeToResolutionMinute: &timeToResolution,
		},
		ScheduledDate:   scheduledDate,
		StartedAt:       startedAt,
		CompletedAt:     completedAt,
		SlaHours:        t.SlaHours,
		SlaDeadline:     slaDeadline,
		SlaMet:          t.SlaMet,
		Resolution:      t.Resolution,
		Rating:          t.Rating,
		RatingComment:   t.RatingComment,
		CreatedAt:       t.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:       t.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func nullStatusToString(s database.NullTicketsTicketStatus) string {
	if s.Valid {
		return string(s.TicketsTicketStatus)
	}
	return "open"
}

func nullPriorityToString(p database.NullTicketsTicketPriority) string {
	if p.Valid {
		return string(p.TicketsTicketPriority)
	}
	return "medium"
}

func strPtr(s string) *string {
	return &s
}

func interfaceToStringPtr(v interface{}) *string {
	if v == nil {
		return nil
	}
	if s, ok := v.(string); ok {
		return &s
	}
	return nil
}

func interfaceToStringWithDefault(v interface{}, def string) string {
	if v == nil {
		return def
	}
	if s, ok := v.(string); ok && s != "" {
		return s
	}
	return def
}

func diffMinutes(start time.Time, target pgtype.Timestamptz, now time.Time) int64 {
	end := now
	if target.Valid {
		end = target.Time
	}
	if end.Before(start) {
		return 0
	}
	return int64(end.Sub(start).Minutes())
}

func (h *TicketHandler) attachPolicyAndSLA(
	c *gin.Context,
	ticket database.TicketsTicket,
	tenantID pgtype.UUID,
	clientID pgtype.UUID,
	siteID pgtype.UUID,
	policyID pgtype.UUID,
	ticketType database.TicketsTicketType,
	priority database.NullTicketsTicketPriority,
) error {
	effectivePolicyID := policyID
	coverageStatus := database.TicketsCoverageStatusUnknown

	if !effectivePolicyID.Valid {
		activePolicy, err := h.queries.GetActivePolicyForClientSite(c.Request.Context(), tenantID, clientID, siteID)
		if err == nil {
			effectivePolicyID = activePolicy.ID
		}
	}

	if effectivePolicyID.Valid {
		coverageStatus = database.TicketsCoverageStatusCovered
	}

	_, _ = h.queries.UpsertTicketPolicyLink(c.Request.Context(), tenantID, ticket.ID, effectivePolicyID, coverageStatus, nil)

	selectedSla, err := h.queries.SelectSlaPolicyForTicket(
		c.Request.Context(),
		tenantID,
		priority,
		database.NullTicketsTicketType{TicketsTicketType: ticketType, Valid: true},
	)
	if err != nil {
		// SLA opcional: si no hay regla, no bloquea creación de ticket.
		return nil
	}

	now := time.Now()
	dueResponse := pgtype.Timestamptz{Time: now.Add(time.Duration(selectedSla.ResponseTimeHours) * time.Hour), Valid: true}
	dueResolution := pgtype.Timestamptz{Time: now.Add(time.Duration(selectedSla.ResolutionTimeHours) * time.Hour), Valid: true}
	responseHours := selectedSla.ResponseTimeHours
	resolutionHours := selectedSla.ResolutionTimeHours

	_, _ = h.queries.CreateTicketSlaInstance(c.Request.Context(),
		tenantID,
		ticket.ID,
		selectedSla.ID,
		priority,
		database.NullTicketsTicketType{TicketsTicketType: ticketType, Valid: true},
		&responseHours,
		&resolutionHours,
		dueResponse,
		dueResolution,
		database.TicketsSlaStatusOk,
	)

	totalSlaHours := selectedSla.ResolutionTimeHours
	_ = h.queries.UpdateTicketSlaFields(c.Request.Context(), ticket.ID, tenantID, &totalSlaHours, dueResolution)
	return nil
}
