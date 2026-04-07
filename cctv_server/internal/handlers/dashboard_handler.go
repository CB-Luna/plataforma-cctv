package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

// DashboardHandler maneja los endpoints del dashboard
type DashboardHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
}

// NewDashboardHandler crea una nueva instancia del handler
func NewDashboardHandler(db *pgxpool.Pool, queries *database.Queries) *DashboardHandler {
	return &DashboardHandler{
		db:      db,
		queries: queries,
	}
}

// numericToFloat64 convierte pgtype.Numeric a float64
func numericToFloat64(n interface{}) float64 {
	switch v := n.(type) {
	case pgtype.Numeric:
		if !v.Valid {
			return 0
		}
		f, _ := v.Float64Value()
		return f.Float64
	case float64:
		return v
	case int64:
		return float64(v)
	case int32:
		return float64(v)
	default:
		return 0
	}
}

// interfaceToInt64 convierte interface{} a int64
func interfaceToInt64(v interface{}) int64 {
	switch val := v.(type) {
	case int64:
		return val
	case int32:
		return int64(val)
	case int:
		return int64(val)
	case float64:
		return int64(val)
	default:
		return 0
	}
}

// interfaceToString convierte interface{} a string
func interfaceToString(v interface{}) string {
	if v == nil {
		return ""
	}
	switch val := v.(type) {
	case string:
		return val
	case *string:
		if val == nil {
			return ""
		}
		return *val
	default:
		return ""
	}
}

// DashboardSummaryResponse respuesta del resumen ejecutivo
type DashboardSummaryResponse struct {
	// Tickets
	OpenTickets      int64   `json:"openTickets"`
	CriticalTickets  int64   `json:"criticalTickets"`
	SLACompliancePct float64 `json:"slaCompliancePct"`
	SLAOkTickets     int64   `json:"slaOkTickets"`
	SLAAtRiskTickets int64   `json:"slaAtRiskTickets"`
	SLABreached      int64   `json:"slaBreachedTickets"`

	// Clients
	ActiveClients int64 `json:"activeClients"`

	// Policies
	ActivePolicies       int64 `json:"activePolicies"`
	PoliciesExpiringSoon int64 `json:"policiesExpiringSoon"`

	// Billing
	OverdueAmount       float64 `json:"overdueAmount"`
	CurrentMonthRevenue float64 `json:"currentMonthRevenue"`

	// Users
	ActiveUsers      int64 `json:"activeUsers"`
	UsersOnlineToday int64 `json:"usersOnlineToday"`

	// Inventory
	ActiveNVRs     int64   `json:"activeNvrs"`
	ActiveCameras  int64   `json:"activeCameras"`
	TotalStorageTB float64 `json:"totalStorageTb"`

	// Storage
	TotalFileSizeBytes int64 `json:"totalFileSizeBytes"`
}

// DashboardTicketStatsResponse estadísticas de tickets para dashboard
type DashboardTicketStatsResponse struct {
	OpenCount         int64 `json:"openCount"`
	AssignedCount     int64 `json:"assignedCount"`
	InProgressCount   int64 `json:"inProgressCount"`
	CompletedCount    int64 `json:"completedCount"`
	CancelledCount    int64 `json:"cancelledCount"`
	CriticalCount     int64 `json:"criticalCount"`
	HighPriorityCount int64 `json:"highPriorityCount"`
	PreventiveCount   int64 `json:"preventiveCount"`
	CorrectiveCount   int64 `json:"correctiveCount"`
	EmergencyCount    int64 `json:"emergencyCount"`
	TotalCount        int64 `json:"totalCount"`
	SLAMetCount       int64 `json:"slaMetCount"`
	SLAMissedCount    int64 `json:"slaMissedCount"`
}

// TicketTrendResponse tendencia de tickets
type TicketTrendResponse struct {
	Date      string `json:"date"`
	Opened    int64  `json:"opened"`
	Completed int64  `json:"completed"`
	Total     int64  `json:"total"`
}

// ClientStatsResponse estadísticas de clientes
type ClientStatsResponse struct {
	TotalClients    int64 `json:"totalClients"`
	ActiveClients   int64 `json:"activeClients"`
	InactiveClients int64 `json:"inactiveClients"`
}

// PolicyStatsResponse estadísticas de pólizas
type PolicyStatsResponse struct {
	TotalPolicies       int64   `json:"totalPolicies"`
	ActivePolicies      int64   `json:"activePolicies"`
	ExpiredPolicies     int64   `json:"expiredPolicies"`
	SuspendedPolicies   int64   `json:"suspendedPolicies"`
	ExpiringSoon        int64   `json:"expiringSoon"`
	TotalMonthlyRevenue float64 `json:"totalMonthlyRevenue"`
}

// InvoiceStatsResponse estadísticas de facturación
type InvoiceStatsResponse struct {
	TotalInvoices     int64   `json:"totalInvoices"`
	PendingCount      int64   `json:"pendingCount"`
	PaidCount         int64   `json:"paidCount"`
	OverdueCount      int64   `json:"overdueCount"`
	PendingAmount     float64 `json:"pendingAmount"`
	PaidAmount        float64 `json:"paidAmount"`
	OverdueAmount     float64 `json:"overdueAmount"`
	CurrentMonthTotal float64 `json:"currentMonthTotal"`
	LastMonthTotal    float64 `json:"lastMonthTotal"`
}

// UserStatsResponse estadísticas de usuarios
type UserStatsResponse struct {
	TotalUsers    int64 `json:"totalUsers"`
	ActiveUsers   int64 `json:"activeUsers"`
	InactiveUsers int64 `json:"inactiveUsers"`
	LoggedInToday int64 `json:"loggedInToday"`
	LoggedInWeek  int64 `json:"loggedInWeek"`
	LoggedInMonth int64 `json:"loggedInMonth"`
}

// InventoryStatsResponse estadísticas de inventario
type InventoryStatsResponse struct {
	TotalNVRs      int64   `json:"totalNvrs"`
	ActiveNVRs     int64   `json:"activeNvrs"`
	TotalCameras   int64   `json:"totalCameras"`
	ActiveCameras  int64   `json:"activeCameras"`
	TotalStorageTB float64 `json:"totalStorageTb"`
}

// DashboardTechnicianWorkload carga de trabajo por técnico
type DashboardTechnicianWorkload struct {
	TechnicianID     string  `json:"technicianId"`
	TechnicianName   string  `json:"technicianName"`
	ActiveTickets    int64   `json:"activeTickets"`
	CompletedTickets int64   `json:"completedTickets"`
	TotalTickets     int64   `json:"totalTickets"`
	AvgRating        float64 `json:"avgRating"`
}

// UsersByRoleResponse usuarios por rol
type UsersByRoleResponse struct {
	RoleName  string `json:"roleName"`
	UserCount int64  `json:"userCount"`
}

// GetDashboardSummary godoc
// @Summary Get dashboard summary
// @Description Get executive summary with KPIs for all modules
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {object} DashboardSummaryResponse
// @Failure 500 {object} ErrorResponse
// @Router /dashboard/summary [get]
// @Security BearerAuth
func (h *DashboardHandler) GetDashboardSummary(c *gin.Context) {
	tenantID := middleware.GetEffectiveTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	summary, err := h.queries.GetDashboardSummary(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch dashboard summary: " + err.Error()})
		return
	}

	// Convert pgtype values to Go native types
	response := DashboardSummaryResponse{
		OpenTickets:          summary.OpenTickets,
		CriticalTickets:      summary.CriticalTickets,
		SLACompliancePct:     numericToFloat64(summary.SlaCompliancePct),
		SLAOkTickets:         summary.SlaOkTickets,
		SLAAtRiskTickets:     summary.SlaAtRiskTickets,
		SLABreached:          summary.SlaBreachedTickets,
		ActiveClients:        summary.ActiveClients,
		ActivePolicies:       summary.ActivePolicies,
		PoliciesExpiringSoon: summary.PoliciesExpiringSoon,
		OverdueAmount:        numericToFloat64(summary.OverdueAmount),
		CurrentMonthRevenue:  numericToFloat64(summary.CurrentMonthRevenue),
		ActiveUsers:          summary.ActiveUsers,
		UsersOnlineToday:     summary.UsersOnlineToday,
		ActiveNVRs:           summary.ActiveNvrs,
		ActiveCameras:        summary.ActiveCameras,
		TotalStorageTB:       numericToFloat64(summary.TotalStorageTb),
		TotalFileSizeBytes:   interfaceToInt64(summary.TotalFileSizeBytes),
	}

	c.JSON(http.StatusOK, response)
}

// GetTicketStats godoc
// @Summary Get ticket statistics
// @Description Get detailed ticket statistics by status, priority and type
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {object} DashboardTicketStatsResponse
// @Failure 500 {object} ErrorResponse
// @Router /dashboard/tickets/stats [get]
// @Security BearerAuth
func (h *DashboardHandler) GetTicketStats(c *gin.Context) {
	tenantID := middleware.GetEffectiveTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	stats, err := h.queries.GetDashboardTicketStats(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch ticket stats: " + err.Error()})
		return
	}

	response := DashboardTicketStatsResponse{
		OpenCount:         stats.OpenCount,
		AssignedCount:     stats.AssignedCount,
		InProgressCount:   stats.InProgressCount,
		CompletedCount:    stats.CompletedCount,
		CancelledCount:    stats.CancelledCount,
		CriticalCount:     stats.CriticalCount,
		HighPriorityCount: stats.HighPriorityCount,
		PreventiveCount:   stats.PreventiveCount,
		CorrectiveCount:   stats.CorrectiveCount,
		EmergencyCount:    stats.EmergencyCount,
		TotalCount:        stats.TotalCount,
		SLAMetCount:       stats.SlaMetCount,
		SLAMissedCount:    stats.SlaMissedCount,
	}

	c.JSON(http.StatusOK, response)
}

// GetTicketsTrend godoc
// @Summary Get tickets trend
// @Description Get ticket trend for the last N days
// @Tags dashboard
// @Accept json
// @Produce json
// @Param days query int false "Number of days" default(30)
// @Success 200 {array} TicketTrendResponse
// @Failure 500 {object} ErrorResponse
// @Router /dashboard/tickets/trend [get]
// @Security BearerAuth
func (h *DashboardHandler) GetTicketsTrend(c *gin.Context) {
	tenantID := middleware.GetEffectiveTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	trend, err := h.queries.GetTicketsTrend(c.Request.Context(), pgTenantID, int32(days))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch ticket trend: " + err.Error()})
		return
	}

	response := make([]TicketTrendResponse, len(trend))
	for i, t := range trend {
		response[i] = TicketTrendResponse{
			Date:      t.Date.Time.Format("2006-01-02"),
			Opened:    t.Opened,
			Completed: t.Completed,
			Total:     t.Total,
		}
	}

	c.JSON(http.StatusOK, response)
}

// GetClientStats godoc
// @Summary Get client statistics
// @Description Get client statistics
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {object} ClientStatsResponse
// @Failure 500 {object} ErrorResponse
// @Router /dashboard/clients/stats [get]
// @Security BearerAuth
func (h *DashboardHandler) GetClientStats(c *gin.Context) {
	tenantID := middleware.GetEffectiveTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	stats, err := h.queries.GetClientStats(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch client stats: " + err.Error()})
		return
	}

	response := ClientStatsResponse{
		TotalClients:    stats.TotalClients,
		ActiveClients:   stats.ActiveClients,
		InactiveClients: stats.InactiveClients,
	}

	c.JSON(http.StatusOK, response)
}

// GetPolicyStats godoc
// @Summary Get policy statistics
// @Description Get policy statistics
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {object} PolicyStatsResponse
// @Failure 500 {object} ErrorResponse
// @Router /dashboard/policies/stats [get]
// @Security BearerAuth
func (h *DashboardHandler) GetPolicyStats(c *gin.Context) {
	tenantID := middleware.GetEffectiveTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	stats, err := h.queries.GetPolicyStats(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch policy stats: " + err.Error()})
		return
	}

	response := PolicyStatsResponse{
		TotalPolicies:       stats.TotalPolicies,
		ActivePolicies:      stats.ActivePolicies,
		ExpiredPolicies:     stats.ExpiredPolicies,
		SuspendedPolicies:   stats.SuspendedPolicies,
		ExpiringSoon:        stats.ExpiringSoon,
		TotalMonthlyRevenue: numericToFloat64(stats.TotalMonthlyRevenue),
	}

	c.JSON(http.StatusOK, response)
}

// GetInvoiceStats godoc
// @Summary Get invoice statistics
// @Description Get invoice/billing statistics
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {object} InvoiceStatsResponse
// @Failure 500 {object} ErrorResponse
// @Router /dashboard/invoices/stats [get]
// @Security BearerAuth
func (h *DashboardHandler) GetInvoiceStats(c *gin.Context) {
	tenantID := middleware.GetEffectiveTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	stats, err := h.queries.GetInvoiceStats(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch invoice stats: " + err.Error()})
		return
	}

	response := InvoiceStatsResponse{
		TotalInvoices:     stats.TotalInvoices,
		PendingCount:      stats.PendingCount,
		PaidCount:         stats.PaidCount,
		OverdueCount:      stats.OverdueCount,
		PendingAmount:     numericToFloat64(stats.PendingAmount),
		PaidAmount:        numericToFloat64(stats.PaidAmount),
		OverdueAmount:     numericToFloat64(stats.OverdueAmount),
		CurrentMonthTotal: numericToFloat64(stats.CurrentMonthTotal),
		LastMonthTotal:    numericToFloat64(stats.LastMonthTotal),
	}

	c.JSON(http.StatusOK, response)
}

// GetUserStats godoc
// @Summary Get user statistics
// @Description Get user activity statistics
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {object} UserStatsResponse
// @Failure 500 {object} ErrorResponse
// @Router /dashboard/users/stats [get]
// @Security BearerAuth
func (h *DashboardHandler) GetUserStats(c *gin.Context) {
	tenantID := middleware.GetEffectiveTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	stats, err := h.queries.GetUserStats(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user stats: " + err.Error()})
		return
	}

	response := UserStatsResponse{
		TotalUsers:    stats.TotalUsers,
		ActiveUsers:   stats.ActiveUsers,
		InactiveUsers: stats.InactiveUsers,
		LoggedInToday: stats.LoggedInToday,
		LoggedInWeek:  stats.LoggedInWeek,
		LoggedInMonth: stats.LoggedInMonth,
	}

	c.JSON(http.StatusOK, response)
}

// GetInventoryStats godoc
// @Summary Get inventory statistics
// @Description Get NVR and camera statistics
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {object} InventoryStatsResponse
// @Failure 500 {object} ErrorResponse
// @Router /dashboard/inventory/stats [get]
// @Security BearerAuth
func (h *DashboardHandler) GetInventoryStats(c *gin.Context) {
	tenantID := middleware.GetEffectiveTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	stats, err := h.queries.GetInventoryStats(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch inventory stats: " + err.Error()})
		return
	}

	response := InventoryStatsResponse{
		TotalNVRs:      stats.TotalNvrs,
		ActiveNVRs:     stats.ActiveNvrs,
		TotalCameras:   stats.TotalCameras,
		ActiveCameras:  stats.ActiveCameras,
		TotalStorageTB: numericToFloat64(stats.TotalStorageTb),
	}

	c.JSON(http.StatusOK, response)
}

// GetTechniciansWorkload godoc
// @Summary Get technicians workload
// @Description Get workload statistics per technician
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {array} DashboardTechnicianWorkload
// @Failure 500 {object} ErrorResponse
// @Router /dashboard/technicians/workload [get]
// @Security BearerAuth
func (h *DashboardHandler) GetTechniciansWorkload(c *gin.Context) {
	tenantID := middleware.GetEffectiveTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	workload, err := h.queries.GetTicketsByTechnician(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch technicians workload: " + err.Error()})
		return
	}

	response := make([]DashboardTechnicianWorkload, len(workload))
	for i, w := range workload {
		response[i] = DashboardTechnicianWorkload{
			TechnicianID:     pgUUIDToString(w.TechnicianID),
			TechnicianName:   interfaceToString(w.TechnicianName),
			ActiveTickets:    w.ActiveTickets,
			CompletedTickets: w.CompletedTickets,
			TotalTickets:     w.TotalTickets,
			AvgRating:        numericToFloat64(w.AvgRating),
		}
	}

	c.JSON(http.StatusOK, response)
}

// GetUsersByRole godoc
// @Summary Get users by role
// @Description Get user count by role
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {array} UsersByRoleResponse
// @Failure 500 {object} ErrorResponse
// @Router /dashboard/users/by-role [get]
// @Security BearerAuth
func (h *DashboardHandler) GetUsersByRole(c *gin.Context) {
	tenantID := middleware.GetEffectiveTenantID(c)
	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	roles, err := h.queries.GetDashboardUsersByRole(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users by role: " + err.Error()})
		return
	}

	response := make([]UsersByRoleResponse, len(roles))
	for i, r := range roles {
		response[i] = UsersByRoleResponse{
			RoleName:  r.RoleName,
			UserCount: r.UserCount,
		}
	}

	c.JSON(http.StatusOK, response)
}
