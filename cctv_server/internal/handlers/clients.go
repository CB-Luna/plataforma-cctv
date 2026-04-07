package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type ClientHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
}

func NewClientHandler(db *pgxpool.Pool, queries *database.Queries) *ClientHandler {
	return &ClientHandler{
		db:      db,
		queries: queries,
	}
}

// ListClients godoc
// @Summary List all clients
// @Description Get a paginated list of all clients for the authenticated tenant
// @Tags clients
// @Accept json
// @Produce json
// @Param limit query int false "Number of items to return" default(20)
// @Param offset query int false "Number of items to skip" default(0)
// @Success 200 {array} ClientResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /clients [get]
// @Security BearerAuth
func (h *ClientHandler) ListClients(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	clients, err := h.queries.ListClientsByTenant(c.Request.Context(), pgTenantID, 20, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch clients"})
		return
	}

	c.JSON(http.StatusOK, clients)
}

// GetClient godoc
// @Summary Get a client by ID
// @Description Get detailed information about a specific client
// @Tags clients
// @Accept json
// @Produce json
// @Param id path string true "Client ID (UUID)"
// @Success 200 {object} ClientResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /clients/{id} [get]
// @Security BearerAuth
func (h *ClientHandler) GetClient(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	clientID := c.Param("id")

	pgClientID, err := toPgUUID(clientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	client, err := h.queries.GetClientByID(c.Request.Context(), pgClientID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "client not found"})
		return
	}

	c.JSON(http.StatusOK, client)
}

type CreateClientRequest struct {
	CompanyName string `json:"company_name" binding:"required"`
	LegalName   string `json:"legal_name"`
	RFC         string `json:"rfc"`
	Address     string `json:"address"`
	City        string `json:"city"`
	State       string `json:"state"`
	PostalCode  string `json:"postal_code"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
}

// CreateClient godoc
// @Summary Create a new client
// @Description Create a new client for the authenticated tenant
// @Tags clients
// @Accept json
// @Produce json
// @Param client body CreateClientRequest true "Client information"
// @Success 201 {object} ClientResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /clients [post]
// @Security BearerAuth
func (h *ClientHandler) CreateClient(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	var req CreateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	// Helper para convertir strings opcionales
	nullString := func(s string) *string {
		if s == "" {
			return nil
		}
		return &s
	}

	client, err := h.queries.CreateClient(
		c.Request.Context(),
		pgTenantID,
		req.CompanyName,
		nullString(req.LegalName),
		nullString(req.RFC),
		nullString(req.Address),
		nullString(req.City),
		nullString(req.State),
		nullString(req.PostalCode),
		nullString(req.Email),
		nullString(req.Phone),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create client"})
		return
	}

	c.JSON(http.StatusCreated, client)
}
