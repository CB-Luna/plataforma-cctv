package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type RoleHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
}

func NewRoleHandler(db *pgxpool.Pool, queries *database.Queries) *RoleHandler {
	return &RoleHandler{
		db:      db,
		queries: queries,
	}
}

// ListRoles godoc
// @Summary List all roles
// @Description Get all roles for the authenticated tenant
// @Tags roles
// @Accept json
// @Produce json
// @Success 200 {array} RoleResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /roles [get]
// @Security BearerAuth
func (h *RoleHandler) ListRoles(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	roles, err := h.queries.ListRolesByTenant(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch roles"})
		return
	}

	responses := make([]RoleResponse, len(roles))
	for i, role := range roles {
		var tenantIDStr *string
		if role.TenantID.Valid {
			tid := pgUUIDToString(role.TenantID)
			tenantIDStr = &tid
		}

		responses[i] = RoleResponse{
			ID:          pgUUIDToString(role.ID),
			TenantID:    tenantIDStr,
			Name:        role.Name,
			Description: role.Description,
			IsSystem:    boolValue(role.IsSystem),
			CreatedAt:   role.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// CreateRole godoc
// @Summary Create a new role
// @Description Create a new role for the authenticated tenant
// @Tags roles
// @Accept json
// @Produce json
// @Param role body CreateRoleRequest true "Role information"
// @Success 201 {object} RoleResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /roles [post]
// @Security BearerAuth
func (h *RoleHandler) CreateRole(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	var role database.AuthRole

	// Si se solicita crear un rol de sistema, verificar permisos globales
	if req.IsSystem && middleware.HasGlobalAccess(c, "roles") {
		role, err = h.queries.CreateSystemRole(
			c.Request.Context(),
			req.Name,
			req.Description,
		)
	} else {
		// Crear rol normal para el tenant actual
		role, err = h.queries.CreateRole(
			c.Request.Context(),
			pgTenantID,
			req.Name,
			req.Description,
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create role"})
		return
	}

	var tenantIDStr *string
	if role.TenantID.Valid {
		tid := pgUUIDToString(role.TenantID)
		tenantIDStr = &tid
	}

	response := RoleResponse{
		ID:          pgUUIDToString(role.ID),
		TenantID:    tenantIDStr,
		Name:        role.Name,
		Description: role.Description,
		IsSystem:    boolValue(role.IsSystem),
		CreatedAt:   role.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusCreated, response)
}

// GetRole godoc
// @Summary Get a role by ID
// @Description Get detailed information about a specific role
// @Tags roles
// @Accept json
// @Produce json
// @Param id path string true "Role ID (UUID)"
// @Success 200 {object} RoleResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /roles/{id} [get]
// @Security BearerAuth
func (h *RoleHandler) GetRole(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	roleID := c.Param("id")

	pgRoleID, err := toPgUUID(roleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	role, err := h.queries.GetRoleByID(c.Request.Context(), pgRoleID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "role not found"})
		return
	}

	var tenantIDStr *string
	if role.TenantID.Valid {
		tid := pgUUIDToString(role.TenantID)
		tenantIDStr = &tid
	}

	response := RoleResponse{
		ID:          pgUUIDToString(role.ID),
		TenantID:    tenantIDStr,
		Name:        role.Name,
		Description: role.Description,
		IsSystem:    boolValue(role.IsSystem),
		CreatedAt:   role.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// UpdateRole godoc
// @Summary Update a role
// @Description Update role information
// @Tags roles
// @Accept json
// @Produce json
// @Param id path string true "Role ID (UUID)"
// @Param role body UpdateRoleRequest true "Role information"
// @Success 200 {object} RoleResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /roles/{id} [put]
// @Security BearerAuth
func (h *RoleHandler) UpdateRole(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	roleID := c.Param("id")

	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgRoleID, err := toPgUUID(roleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	// 1. Verificar si el rol es de sistema o global antes de intentar actualizar
	// Usamos GetRoleByID que ahora permite ver roles globales
	existingRole, err := h.queries.GetRoleByID(c.Request.Context(), pgRoleID, pgTenantID)
	if err != nil {
		// Si no lo encuentra, puede ser 404
		c.JSON(http.StatusNotFound, gin.H{"error": "role not found"})
		return
	}

	// Verificar si es sistema o global
	isGlobal := !existingRole.TenantID.Valid
	var role database.AuthRole

	if boolValue(existingRole.IsSystem) || isGlobal {
		// Requiere acceso global
		if !middleware.HasGlobalAccess(c, "roles") {
			c.JSON(http.StatusForbidden, gin.H{"error": "requires global permissions to modify system roles"})
			return
		}

		role, err = h.queries.UpdateRoleGlobal(
			c.Request.Context(),
			pgRoleID,
			req.Name,
			req.Description,
		)
	} else {
		// Rol normal
		role, err = h.queries.UpdateRole(
			c.Request.Context(),
			pgRoleID,
			pgTenantID,
			req.Name,
			req.Description,
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to update role: %v", err)})
		return
	}

	var tenantIDStr *string
	if role.TenantID.Valid {
		tid := pgUUIDToString(role.TenantID)
		tenantIDStr = &tid
	}

	response := RoleResponse{
		ID:          pgUUIDToString(role.ID),
		TenantID:    tenantIDStr,
		Name:        role.Name,
		Description: role.Description,
		IsSystem:    boolValue(role.IsSystem),
		CreatedAt:   role.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// GetRolePermissions godoc
// @Summary Get role permissions
// @Description Get all permissions assigned to a role
// @Tags roles
// @Accept json
// @Produce json
// @Param id path string true "Role ID (UUID)"
// @Success 200 {array} PermissionResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /roles/{id}/permissions [get]
// @Security BearerAuth
func (h *RoleHandler) GetRolePermissions(c *gin.Context) {
	roleID := c.Param("id")

	pgRoleID, err := toPgUUID(roleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role ID format"})
		return
	}

	permissions, err := h.queries.GetRolePermissions(c.Request.Context(), pgRoleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch permissions"})
		return
	}

	responses := make([]PermissionResponse, len(permissions))
	for i, perm := range permissions {
		responses[i] = PermissionResponse{
			ID:          pgUUIDToString(perm.ID),
			Code:        perm.Code,
			Description: perm.Description,
			Module:      perm.Module,
			CreatedAt:   perm.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// AssignPermission godoc
// @Summary Assign permission to role
// @Description Assign a permission to a role
// @Tags roles
// @Accept json
// @Produce json
// @Param id path string true "Role ID (UUID)"
// @Param permission body AssignPermissionRequest true "Permission assignment"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /roles/{id}/permissions [post]
// @Security BearerAuth
func (h *RoleHandler) AssignPermission(c *gin.Context) {
	roleID := c.Param("id")

	var req AssignPermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgRoleID, err := toPgUUID(roleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role ID format"})
		return
	}

	pgPermID, err := toPgUUID(req.PermissionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid permission ID format"})
		return
	}

	err = h.queries.AssignPermissionToRole(c.Request.Context(), pgRoleID, pgPermID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign permission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "permission assigned successfully"})
}

// ListAllPermissions godoc
// @Summary List all permissions
// @Description Get all available permissions in the system
// @Tags permissions
// @Accept json
// @Produce json
// @Success 200 {array} PermissionResponse
// @Failure 500 {object} ErrorResponse
// @Router /permissions [get]
// @Security BearerAuth
func (h *RoleHandler) ListAllPermissions(c *gin.Context) {
	permissions, err := h.queries.ListAllPermissions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch permissions"})
		return
	}

	responses := make([]PermissionResponse, len(permissions))
	for i, perm := range permissions {
		responses[i] = PermissionResponse{
			ID:          pgUUIDToString(perm.ID),
			Code:        perm.Code,
			Description: perm.Description,
			Module:      perm.Module,
			CreatedAt:   perm.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// CreatePermission godoc
// @Summary Create a new permission
// @Description Create a new permission in the system (admin only)
// @Tags permissions
// @Accept json
// @Produce json
// @Param permission body CreatePermissionRequest true "Permission information"
// @Success 201 {object} PermissionResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /permissions [post]
// @Security BearerAuth
func (h *RoleHandler) CreatePermission(c *gin.Context) {
	var req CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	permission, err := h.queries.CreatePermission(
		c.Request.Context(),
		req.Code,
		req.Description,
		req.Module,
		req.Scope,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create permission"})
		return
	}

	response := PermissionResponse{
		ID:          pgUUIDToString(permission.ID),
		Code:        permission.Code,
		Description: permission.Description,
		Module:      permission.Module,
		CreatedAt:   permission.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusCreated, response)
}
