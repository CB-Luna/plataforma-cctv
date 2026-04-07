package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type MenuHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
}

func NewMenuHandler(db *pgxpool.Pool, queries *database.Queries) *MenuHandler {
	return &MenuHandler{
		db:      db,
		queries: queries,
	}
}

// GetMenu godoc
// @Summary Get dynamic menu
// @Description Get personalized menu based on user permissions (from database)
// @Tags menu
// @Accept json
// @Produce json
// @Success 200 {object} MenuResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /menu [get]
// @Security BearerAuth
func (h *MenuHandler) GetMenu(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tenantID := middleware.GetTenantID(c)

	if userID == "" || tenantID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	pgUserID, _ := toPgUUID(userID)
	pgTenantID, _ := toPgUUID(tenantID)

	// Obtener usuario
	user, err := h.queries.GetUserByID(c.Request.Context(), pgUserID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Obtener permisos del usuario
	permissions, err := h.queries.GetUserPermissions(c.Request.Context(), user.ID)
	if err != nil {
		permissions = []database.AuthPermission{}
	}

	// Crear mapa de permisos
	permMap := make(map[string]bool)
	for _, perm := range permissions {
		permMap[perm.Code] = true
	}

	// Obtener roles
	roles, err := h.queries.GetUserRoles(c.Request.Context(), user.ID)
	roleName := "Usuario"
	if err == nil && len(roles) > 0 {
		roleName = roles[0].Name
	}

	// Obtener el template de menú asignado al tenant
	template, err := h.queries.GetMenuTemplateForTenant(c.Request.Context(), pgTenantID)
	if err != nil {
		// Si no hay template asignado, intentar obtener el template por defecto
		template, err = h.queries.GetDefaultMenuTemplate(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "no menu template found for tenant"})
			return
		}
	}

	// Obtener items de menú del template asignado
	menuItems, err := h.queries.GetMenuItemsByTemplate(c.Request.Context(), template.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load menu"})
		return
	}

	// Construir menú jerárquico filtrado por permisos
	menu := buildMenuFromDB(menuItems, permMap)

	userInfo := MenuUserInfo{
		Name:   user.FirstName + " " + user.LastName,
		Email:  user.Email,
		Avatar: user.AvatarUrl,
		Role:   roleName,
	}

	response := MenuResponse{
		Items:    menu,
		UserInfo: userInfo,
	}

	c.JSON(http.StatusOK, response)
}

// ListMenuItems godoc
// @Summary List all menu items
// @Description Get list of all menu items (admin only)
// @Tags menu
// @Produce json
// @Success 200 {array} MenuItemResponse
// @Failure 500 {object} ErrorResponse
// @Router /menu/items [get]
// @Security BearerAuth
func (h *MenuHandler) ListMenuItems(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	pgTenantID, _ := toPgUUID(tenantID)

	items, err := h.queries.ListAllMenuItems(c.Request.Context(), pgTenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list menu items"})
		return
	}

	responses := make([]MenuItemResponse, len(items))
	for i, item := range items {
		responses[i] = menuItemToResponse(item)
	}

	c.JSON(http.StatusOK, responses)
}

// GetMenuItem godoc
// @Summary Get menu item by ID
// @Description Get specific menu item details
// @Tags menu
// @Produce json
// @Param id path string true "Menu Item ID"
// @Success 200 {object} MenuItemResponse
// @Failure 404 {object} ErrorResponse
// @Router /menu/items/{id} [get]
// @Security BearerAuth
func (h *MenuHandler) GetMenuItem(c *gin.Context) {
	itemID := c.Param("id")
	pgItemID, err := toPgUUID(itemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	item, err := h.queries.GetMenuItem(c.Request.Context(), pgItemID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "menu item not found"})
		return
	}

	response := menuItemToResponse(item)
	c.JSON(http.StatusOK, response)
}

// CreateMenuItem godoc
// @Summary Create menu item
// @Description Create a new menu item
// @Tags menu
// @Accept json
// @Produce json
// @Param request body CreateMenuItemRequest true "Menu item data"
// @Success 201 {object} MenuItemResponse
// @Failure 400 {object} ErrorResponse
// @Router /menu/items [post]
// @Security BearerAuth
func (h *MenuHandler) CreateMenuItem(c *gin.Context) {
	var req CreateMenuItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)

	pgTenantID, _ := toPgUUID(tenantID)
	pgUserID, _ := toPgUUID(userID)

	// Metadata
	metadataJSON := []byte("{}")
	if req.Metadata != nil {
		metadataJSON, _ = json.Marshal(req.Metadata)
	}

	// Parent ID
	var parentID pgtype.UUID
	if req.ParentID != nil {
		parentID, _ = toPgUUID(*req.ParentID)
	}

	item, err := h.queries.CreateMenuItem(c.Request.Context(), database.CreateMenuItemParams{
		TenantID:           pgTenantID,
		Code:               req.Code,
		Label:              req.Label,
		Icon:               req.Icon,
		Route:              req.Route,
		ParentID:           parentID,
		RequiredPermission: req.RequiredPermission,
		DisplayOrder:       req.DisplayOrder,
		IsActive:           boolPtr(true),
		IsVisible:          req.IsVisible,
		BadgeText:          req.BadgeText,
		BadgeColor:         req.BadgeColor,
		Description:        req.Description,
		Metadata:           metadataJSON,
		CreatedBy:          pgUserID,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create menu item"})
		return
	}

	response := menuItemToResponse(item)
	c.JSON(http.StatusCreated, response)
}

// UpdateMenuItem godoc
// @Summary Update menu item
// @Description Update an existing menu item
// @Tags menu
// @Accept json
// @Produce json
// @Param id path string true "Menu Item ID"
// @Param request body UpdateMenuItemRequest true "Updated menu item data"
// @Success 200 {object} MenuItemResponse
// @Failure 400 {object} ErrorResponse
// @Router /menu/items/{id} [put]
// @Security BearerAuth
func (h *MenuHandler) UpdateMenuItem(c *gin.Context) {
	itemID := c.Param("id")
	pgItemID, err := toPgUUID(itemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	var req UpdateMenuItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}
	argNum := 1

	// Handle label/title
	if req.Label != nil {
		updates = append(updates, fmt.Sprintf("label = $%d", argNum))
		args = append(args, *req.Label)
		argNum++
	} else if req.Title != nil {
		updates = append(updates, fmt.Sprintf("label = $%d", argNum))
		args = append(args, *req.Title)
		argNum++
	}

	if req.Icon != nil {
		updates = append(updates, fmt.Sprintf("icon = $%d", argNum))
		args = append(args, *req.Icon)
		argNum++
	}

	if req.Route != nil {
		updates = append(updates, fmt.Sprintf("route = $%d", argNum))
		args = append(args, *req.Route)
		argNum++
	}

	if req.ParentID != nil {
		parentUUID, _ := toPgUUID(*req.ParentID)
		updates = append(updates, fmt.Sprintf("parent_id = $%d", argNum))
		args = append(args, parentUUID)
		argNum++
	}

	// Handle template_id - support null value
	if req.TemplateID != nil {
		if *req.TemplateID == "" {
			updates = append(updates, "template_id = NULL")
		} else {
			templateUUID, _ := toPgUUID(*req.TemplateID)
			updates = append(updates, fmt.Sprintf("template_id = $%d", argNum))
			args = append(args, templateUUID)
			argNum++
		}
	}

	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argNum))
		args = append(args, *req.IsActive)
		argNum++
	}

	if req.IsVisible != nil {
		updates = append(updates, fmt.Sprintf("is_visible = $%d", argNum))
		args = append(args, *req.IsVisible)
		argNum++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
		return
	}

	// Add updated_at
	updates = append(updates, "updated_at = CURRENT_TIMESTAMP")

	// Build and execute query
	query := fmt.Sprintf("UPDATE auth.menu_items SET %s WHERE id = $%d",
		strings.Join(updates, ", "), argNum)
	args = append(args, pgItemID)

	_, err = h.db.Exec(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update menu item: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "menu item updated successfully"})
}

// ToggleMenuItem godoc
// @Summary Toggle menu item active status
// @Description Activate or deactivate a menu item
// @Tags menu
// @Produce json
// @Param id path string true "Menu Item ID"
// @Param active query boolean true "Active status"
// @Success 200 {object} MenuItemResponse
// @Failure 400 {object} ErrorResponse
// @Router /menu/items/{id}/toggle [patch]
// @Security BearerAuth
func (h *MenuHandler) ToggleMenuItem(c *gin.Context) {
	itemID := c.Param("id")
	active := c.Query("active") == "true"

	pgItemID, err := toPgUUID(itemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	item, err := h.queries.ToggleMenuItem(c.Request.Context(), pgItemID, &active)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to toggle menu item"})
		return
	}

	response := menuItemToResponse(item)
	c.JSON(http.StatusOK, response)
}

// DeleteMenuItem godoc
// @Summary Delete menu item
// @Description Delete a menu item
// @Tags menu
// @Param id path string true "Menu Item ID"
// @Success 204
// @Failure 400 {object} ErrorResponse
// @Router /menu/items/{id} [delete]
// @Security BearerAuth
func (h *MenuHandler) DeleteMenuItem(c *gin.Context) {
	itemID := c.Param("id")
	pgItemID, err := toPgUUID(itemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	err = h.queries.DeleteMenuItem(c.Request.Context(), pgItemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete menu item"})
		return
	}

	c.Status(http.StatusNoContent)
}

// ReorderMenuItems godoc
// @Summary Reorder menu items
// @Description Update display order of multiple menu items
// @Tags menu
// @Accept json
// @Produce json
// @Param request body ReorderMenuItemsRequest true "Items with new order"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Router /menu/items/reorder [put]
// @Security BearerAuth
func (h *MenuHandler) ReorderMenuItems(c *gin.Context) {
	var req ReorderMenuItemsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, item := range req.Items {
		pgItemID, err := toPgUUID(item.ID)
		if err != nil {
			continue
		}
		h.queries.ReorderMenuItems(c.Request.Context(), pgItemID, &item.Order)
	}

	c.JSON(http.StatusOK, gin.H{"message": "menu items reordered successfully"})
}

// Helper functions

func buildMenuFromDB(items []database.AuthMenuItem, permissions map[string]bool) []MenuItem {
	// Crear mapa de items por ID
	itemMap := make(map[string]database.AuthMenuItem)
	for _, item := range items {
		itemMap[pgUUIDToString(item.ID)] = item
	}

	// Construir menú jerárquico
	var rootItems []MenuItem

	for _, item := range items {
		// Verificar si el usuario tiene el permiso requerido
		if item.RequiredPermission != nil && *item.RequiredPermission != "" {
			if !permissions[*item.RequiredPermission] {
				continue // Saltar si no tiene permiso
			}
		}

		// Solo items raíz (sin parent)
		if !item.ParentID.Valid {
			menuItem := dbItemToMenuItem(item)

			// Buscar children
			menuItem.Children = findChildren(item.ID, items, permissions, itemMap)

			rootItems = append(rootItems, menuItem)
		}
	}

	return rootItems
}

func findChildren(parentID pgtype.UUID, allItems []database.AuthMenuItem, permissions map[string]bool, itemMap map[string]database.AuthMenuItem) []MenuItem {
	var children []MenuItem

	for _, item := range allItems {
		if item.ParentID.Valid && pgUUIDToString(item.ParentID) == pgUUIDToString(parentID) {
			// Verificar permiso
			if item.RequiredPermission != nil && *item.RequiredPermission != "" {
				if !permissions[*item.RequiredPermission] {
					continue
				}
			}

			child := dbItemToMenuItem(item)
			child.Children = findChildren(item.ID, allItems, permissions, itemMap)
			children = append(children, child)
		}
	}

	return children
}

func dbItemToMenuItem(item database.AuthMenuItem) MenuItem {
	menuItem := MenuItem{
		ID:         pgUUIDToString(item.ID),
		Label:      item.Label,
		Icon:       stringValue(item.Icon),
		Route:      item.Route,
		Permission: item.RequiredPermission,
		Order:      int(int32Value(item.DisplayOrder)),
	}

	// Badge
	if item.BadgeText != nil && *item.BadgeText != "" {
		color := ""
		if item.BadgeColor != nil {
			color = *item.BadgeColor
		}
		menuItem.Badge = &MenuBadge{
			Value: *item.BadgeText,
			Color: color,
		}
	}

	return menuItem
}

func menuItemToResponse(item database.AuthMenuItem) MenuItemResponse {
	var metadata map[string]interface{}
	json.Unmarshal(item.Metadata, &metadata)

	displayOrder := int32Value(item.DisplayOrder)

	return MenuItemResponse{
		ID:                 pgUUIDToString(item.ID),
		TenantID:           pgUUIDPtrToStringPtr(&item.TenantID),
		TemplateID:         pgUUIDPtrToStringPtr(&item.TemplateID),
		Code:               item.Code,
		Label:              item.Label,
		Title:              item.Label, // Title is same as Label for compatibility
		Icon:               item.Icon,
		Route:              item.Route,
		ParentID:           pgUUIDPtrToStringPtr(&item.ParentID),
		RequiredPermission: item.RequiredPermission,
		DisplayOrder:       displayOrder,
		OrderIndex:         displayOrder,
		IsActive:           boolValue(item.IsActive),
		IsVisible:          boolValue(item.IsVisible),
		BadgeText:          item.BadgeText,
		BadgeColor:         item.BadgeColor,
		Description:        item.Description,
		Metadata:           metadata,
		CreatedAt:          item.CreatedAt.Time.Format(time.RFC3339),
	}
}

func pgUUIDPtrToStringPtr(uuid *pgtype.UUID) *string {
	if uuid == nil || !uuid.Valid {
		return nil
	}
	str := pgUUIDToString(*uuid)
	return &str
}

func stringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// ==================== Menu Templates ====================

// ListMenuTemplates godoc
// @Summary List all menu templates
// @Description Get list of all menu templates
// @Tags menu
// @Produce json
// @Success 200 {array} MenuTemplateResponse
// @Router /menu/templates [get]
// @Security BearerAuth
func (h *MenuHandler) ListMenuTemplates(c *gin.Context) {
	templates, err := h.queries.ListMenuTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list menu templates"})
		return
	}

	responses := make([]MenuTemplateResponse, len(templates))
	for i, t := range templates {
		// Get tenant count for this template
		tenantCount := 0
		tenants, err := h.queries.GetTenantsForTemplate(c.Request.Context(), t.ID)
		if err == nil {
			tenantCount = len(tenants)
		}

		responses[i] = MenuTemplateResponse{
			ID:          pgUUIDToString(t.ID),
			Name:        t.Name,
			Description: t.Description,
			IsDefault:   boolValue(t.IsDefault),
			TenantCount: tenantCount,
			CreatedAt:   t.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// CreateMenuTemplate godoc
// @Summary Create menu template
// @Description Create a new menu template
// @Tags menu
// @Accept json
// @Produce json
// @Param request body CreateMenuTemplateRequest true "Template data"
// @Success 201 {object} MenuTemplateResponse
// @Router /menu/templates [post]
// @Security BearerAuth
func (h *MenuHandler) CreateMenuTemplate(c *gin.Context) {
	var req CreateMenuTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	template, err := h.queries.CreateMenuTemplate(c.Request.Context(), req.Name, req.Description, boolPtr(false))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create menu template"})
		return
	}

	c.JSON(http.StatusCreated, MenuTemplateResponse{
		ID:          pgUUIDToString(template.ID),
		Name:        template.Name,
		Description: template.Description,
		IsDefault:   boolValue(template.IsDefault),
		CreatedAt:   template.CreatedAt.Time.Format(time.RFC3339),
	})
}

// UpdateMenuTemplate godoc
// @Summary Update menu template
// @Description Update an existing menu template
// @Tags menu
// @Accept json
// @Produce json
// @Param id path string true "Template ID"
// @Param request body UpdateMenuTemplateRequest true "Updated template data"
// @Success 200 {object} MenuTemplateResponse
// @Router /menu/templates/{id} [put]
// @Security BearerAuth
func (h *MenuHandler) UpdateMenuTemplate(c *gin.Context) {
	templateID := c.Param("id")
	pgTemplateID, err := toPgUUID(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template ID"})
		return
	}

	var req UpdateMenuTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = h.db.Exec(c.Request.Context(),
		`UPDATE auth.menu_templates SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
		req.Name, req.Description, pgTemplateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update menu template"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "template updated successfully"})
}

// DeleteMenuTemplate godoc
// @Summary Delete menu template
// @Description Delete a menu template
// @Tags menu
// @Param id path string true "Template ID"
// @Success 204
// @Router /menu/templates/{id} [delete]
// @Security BearerAuth
func (h *MenuHandler) DeleteMenuTemplate(c *gin.Context) {
	templateID := c.Param("id")
	pgTemplateID, err := toPgUUID(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template ID"})
		return
	}

	_, err = h.db.Exec(c.Request.Context(),
		`DELETE FROM auth.menu_templates WHERE id = $1 AND is_default = false`,
		pgTemplateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete menu template"})
		return
	}

	c.Status(http.StatusNoContent)
}

// DTO types for templates
type MenuTemplateResponse struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	IsDefault   bool    `json:"is_default"`
	TenantCount int     `json:"tenant_count"`
	CreatedAt   string  `json:"created_at"`
}

type CreateMenuTemplateRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
}

type UpdateMenuTemplateRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
}

// ==================== Tenant Assignment ====================

// GetTenantsForTemplate godoc
// @Summary Get tenants assigned to a template
// @Description Get list of tenants using a specific template
// @Tags menu
// @Produce json
// @Param id path string true "Template ID"
// @Success 200 {array} TenantBasicResponse
// @Router /menu/templates/{id}/tenants [get]
// @Security BearerAuth
func (h *MenuHandler) GetTenantsForTemplate(c *gin.Context) {
	templateID := c.Param("id")
	pgTemplateID, err := toPgUUID(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template ID"})
		return
	}

	tenants, err := h.queries.GetTenantsForTemplate(c.Request.Context(), pgTemplateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get tenants"})
		return
	}

	responses := make([]TenantBasicResponse, len(tenants))
	for i, t := range tenants {
		responses[i] = TenantBasicResponse{
			ID:      pgUUIDToString(t.ID),
			Name:    t.Name,
			Slug:    t.Slug,
			LogoUrl: t.LogoUrl,
		}
	}

	c.JSON(http.StatusOK, responses)
}

// GetAllTenantsForAssignment godoc
// @Summary Get all tenants for assignment
// @Description Get list of all active tenants for template assignment
// @Tags menu
// @Produce json
// @Success 200 {array} TenantBasicResponse
// @Router /menu/tenants [get]
// @Security BearerAuth
func (h *MenuHandler) GetAllTenantsForAssignment(c *gin.Context) {
	tenants, err := h.queries.ListAllTenants(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list tenants"})
		return
	}

	responses := make([]TenantBasicResponse, len(tenants))
	for i, t := range tenants {
		responses[i] = TenantBasicResponse{
			ID:      pgUUIDToString(t.ID),
			Name:    t.Name,
			Slug:    t.Slug,
			LogoUrl: t.LogoUrl,
		}
	}

	c.JSON(http.StatusOK, responses)
}

// AssignTenantsToTemplate godoc
// @Summary Assign tenants to a template
// @Description Assign multiple tenants to use a specific menu template
// @Tags menu
// @Accept json
// @Produce json
// @Param id path string true "Template ID"
// @Param request body AssignTenantsRequest true "Tenant IDs to assign"
// @Success 200 {object} map[string]string
// @Router /menu/templates/{id}/tenants [put]
// @Security BearerAuth
func (h *MenuHandler) AssignTenantsToTemplate(c *gin.Context) {
	templateID := c.Param("id")
	pgTemplateID, err := toPgUUID(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template ID"})
		return
	}

	var req AssignTenantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// First, get current assignments
	currentTenants, err := h.queries.GetTenantsForTemplate(c.Request.Context(), pgTemplateID)
	if err != nil {
		currentTenants = nil
	}

	currentIDs := make(map[string]bool)
	for _, t := range currentTenants {
		currentIDs[pgUUIDToString(t.ID)] = true
	}

	newIDs := make(map[string]bool)
	for _, id := range req.TenantIDs {
		newIDs[id] = true
	}

	// Remove tenants no longer in the list
	for _, t := range currentTenants {
		tid := pgUUIDToString(t.ID)
		if !newIDs[tid] {
			pgTenantID, _ := toPgUUID(tid)
			h.queries.RemoveTemplateFromTenant(c.Request.Context(), pgTenantID)
		}
	}

	// Add new tenants
	for _, tenantID := range req.TenantIDs {
		if !currentIDs[tenantID] {
			pgTenantID, err := toPgUUID(tenantID)
			if err != nil {
				continue
			}
			h.queries.AssignMenuTemplateToTenant(c.Request.Context(), pgTenantID, pgTemplateID)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "tenants assigned successfully", "count": len(req.TenantIDs)})
}

// DTOs for tenant assignment
type TenantBasicResponse struct {
	ID      string  `json:"id"`
	Name    string  `json:"name"`
	Slug    string  `json:"slug"`
	LogoUrl *string `json:"logo_url,omitempty"`
}

type AssignTenantsRequest struct {
	TenantIDs []string `json:"tenant_ids" binding:"required"`
}

// =====================================================
// Template Item Assignment Handlers (N:N relationship)
// =====================================================

// DTOs for template-item assignment
type TemplateItemAssignment struct {
	ID           string `json:"id"`
	TemplateID   string `json:"template_id"`
	MenuItemID   string `json:"menu_item_id"`
	DisplayOrder int32  `json:"display_order"`
	IsVisible    bool   `json:"is_visible"`
	ItemCode     string `json:"item_code"`
	ItemLabel    string `json:"item_label"`
	ItemIcon     string `json:"item_icon"`
	ItemRoute    string `json:"item_route"`
}

type ItemTemplateInfo struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	IsDefault    bool   `json:"is_default"`
	DisplayOrder int32  `json:"display_order"`
	IsVisible    bool   `json:"is_visible"`
}

type AssignItemToTemplateRequest struct {
	MenuItemID   string `json:"menu_item_id" binding:"required"`
	DisplayOrder *int32 `json:"display_order"`
	IsVisible    *bool  `json:"is_visible"`
}

type AssignItemsToTemplateRequest struct {
	MenuItemIDs []string `json:"menu_item_ids" binding:"required"`
}

type UpdateItemInTemplateRequest struct {
	DisplayOrder *int32 `json:"display_order"`
	IsVisible    *bool  `json:"is_visible"`
}

type AdminMenuItemResponse struct {
	MenuItemResponse
	TemplateCount int64 `json:"template_count"`
}

// GetTemplateItems godoc
// @Summary Get items assigned to a template
// @Description Get all menu items assigned to a specific template with their order and visibility
// @Tags menu
// @Produce json
// @Param id path string true "Template ID"
// @Success 200 {array} TemplateItemAssignment
// @Router /menu/templates/{id}/items [get]
// @Security BearerAuth
func (h *MenuHandler) GetTemplateItems(c *gin.Context) {
	templateID := c.Param("id")
	pgTemplateID, err := toPgUUID(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template ID"})
		return
	}

	items, err := h.queries.GetTemplateItemAssignments(c.Request.Context(), pgTemplateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get template items"})
		return
	}

	responses := make([]TemplateItemAssignment, len(items))
	for i, item := range items {
		responses[i] = TemplateItemAssignment{
			ID:           pgUUIDToString(item.ID),
			TemplateID:   pgUUIDToString(item.TemplateID),
			MenuItemID:   pgUUIDToString(item.MenuItemID),
			DisplayOrder: safeInt32(item.DisplayOrder),
			IsVisible:    safeBool(item.IsVisible),
			ItemCode:     item.ItemCode,
			ItemLabel:    item.ItemLabel,
			ItemIcon:     safeString(item.ItemIcon),
			ItemRoute:    safeString(item.ItemRoute),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// GetItemTemplates godoc
// @Summary Get templates that contain a menu item
// @Description Get all templates that have a specific menu item assigned
// @Tags menu
// @Produce json
// @Param id path string true "Menu Item ID"
// @Success 200 {array} ItemTemplateInfo
// @Router /menu/items/{id}/templates [get]
// @Security BearerAuth
func (h *MenuHandler) GetItemTemplates(c *gin.Context) {
	itemID := c.Param("id")
	pgItemID, err := toPgUUID(itemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	templates, err := h.queries.GetTemplatesForMenuItem(c.Request.Context(), pgItemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get item templates"})
		return
	}

	responses := make([]ItemTemplateInfo, len(templates))
	for i, t := range templates {
		responses[i] = ItemTemplateInfo{
			ID:           pgUUIDToString(t.ID),
			Name:         t.Name,
			Description:  safeString(t.Description),
			IsDefault:    safeBool(t.IsDefault),
			DisplayOrder: safeInt32(t.DisplayOrder),
			IsVisible:    safeBool(t.IsVisible),
		}
	}

	c.JSON(http.StatusOK, responses)
}

// AssignItemToTemplate godoc
// @Summary Assign a menu item to a template
// @Description Assign a single menu item to a template with optional order and visibility
// @Tags menu
// @Accept json
// @Produce json
// @Param id path string true "Template ID"
// @Param request body AssignItemToTemplateRequest true "Item assignment data"
// @Success 200 {object} map[string]interface{}
// @Router /menu/templates/{id}/items [post]
// @Security BearerAuth
func (h *MenuHandler) AssignItemToTemplate(c *gin.Context) {
	templateID := c.Param("id")
	pgTemplateID, err := toPgUUID(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template ID"})
		return
	}

	var req AssignItemToTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgItemID, err := toPgUUID(req.MenuItemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid menu item ID"})
		return
	}

	displayOrder := int32(0)
	if req.DisplayOrder != nil {
		displayOrder = *req.DisplayOrder
	}

	isVisible := true
	if req.IsVisible != nil {
		isVisible = *req.IsVisible
	}

	_, err = h.queries.AssignItemToTemplate(c.Request.Context(), pgTemplateID, pgItemID, int32Ptr(displayOrder), boolPtr(isVisible))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign item to template"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "item assigned to template successfully"})
}

// RemoveItemFromTemplate godoc
// @Summary Remove a menu item from a template
// @Description Remove a menu item assignment from a template
// @Tags menu
// @Produce json
// @Param templateId path string true "Template ID"
// @Param itemId path string true "Menu Item ID"
// @Success 200 {object} map[string]string
// @Router /menu/templates/{templateId}/items/{itemId} [delete]
// @Security BearerAuth
func (h *MenuHandler) RemoveItemFromTemplate(c *gin.Context) {
	templateID := c.Param("id")
	itemID := c.Param("itemId")

	pgTemplateID, err := toPgUUID(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template ID"})
		return
	}

	pgItemID, err := toPgUUID(itemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	err = h.queries.RemoveItemFromTemplate(c.Request.Context(), pgTemplateID, pgItemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove item from template"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "item removed from template successfully"})
}

// UpdateItemInTemplate godoc
// @Summary Update item configuration in a template
// @Description Update the display order or visibility of a menu item within a template
// @Tags menu
// @Accept json
// @Produce json
// @Param templateId path string true "Template ID"
// @Param itemId path string true "Menu Item ID"
// @Param request body UpdateItemInTemplateRequest true "Update data"
// @Success 200 {object} map[string]string
// @Router /menu/templates/{templateId}/items/{itemId} [put]
// @Security BearerAuth
func (h *MenuHandler) UpdateItemInTemplate(c *gin.Context) {
	templateID := c.Param("id")
	itemID := c.Param("itemId")

	pgTemplateID, err := toPgUUID(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template ID"})
		return
	}

	pgItemID, err := toPgUUID(itemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	var req UpdateItemInTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.DisplayOrder != nil {
		err = h.queries.UpdateItemOrderInTemplate(c.Request.Context(), pgTemplateID, pgItemID, req.DisplayOrder)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update item order"})
			return
		}
	}

	if req.IsVisible != nil {
		_, err = h.queries.ToggleItemVisibilityInTemplate(c.Request.Context(), pgTemplateID, pgItemID, req.IsVisible)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update item visibility"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "item updated in template successfully"})
}

// GetUnassignedItems godoc
// @Summary Get menu items not assigned to a template
// @Description Get all active menu items that are NOT assigned to a specific template
// @Tags menu
// @Produce json
// @Param id path string true "Template ID"
// @Success 200 {array} MenuItemResponse
// @Router /menu/templates/{id}/unassigned-items [get]
// @Security BearerAuth
func (h *MenuHandler) GetUnassignedItems(c *gin.Context) {
	templateID := c.Param("id")
	pgTemplateID, err := toPgUUID(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template ID"})
		return
	}

	items, err := h.queries.GetUnassignedItemsForTemplate(c.Request.Context(), pgTemplateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get unassigned items"})
		return
	}

	responses := make([]MenuItemResponse, len(items))
	for i, item := range items {
		responses[i] = menuItemToResponse(item)
	}

	c.JSON(http.StatusOK, responses)
}

// BulkAssignItemsToTemplate godoc
// @Summary Bulk assign items to a template
// @Description Replace all item assignments for a template with a new set of items
// @Tags menu
// @Accept json
// @Produce json
// @Param id path string true "Template ID"
// @Param request body AssignItemsToTemplateRequest true "Item IDs to assign"
// @Success 200 {object} map[string]interface{}
// @Router /menu/templates/{id}/items/bulk [put]
// @Security BearerAuth
func (h *MenuHandler) BulkAssignItemsToTemplate(c *gin.Context) {
	templateID := c.Param("id")
	pgTemplateID, err := toPgUUID(templateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template ID"})
		return
	}

	var req AssignItemsToTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Remove all current assignments
	err = h.queries.RemoveAllItemsFromTemplate(c.Request.Context(), pgTemplateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to clear template items"})
		return
	}

	// Add new assignments one by one with display order
	for i, itemIDStr := range req.MenuItemIDs {
		pgItemID, err := toPgUUID(itemIDStr)
		if err != nil {
			continue
		}

		displayOrder := int32(i + 1)
		isVisible := true
		_, err = h.queries.AssignItemToTemplate(c.Request.Context(), pgTemplateID, pgItemID, &displayOrder, &isVisible)
		if err != nil {
			// Log but continue
			fmt.Printf("Failed to assign item %s to template: %v\n", itemIDStr, err)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "items assigned to template successfully", "count": len(req.MenuItemIDs)})
}

// ListAllMenuItemsForAdmin godoc
// @Summary List all menu items for admin
// @Description Get all menu items with their template assignment counts for admin management
// @Tags menu
// @Produce json
// @Success 200 {array} AdminMenuItemResponse
// @Router /menu/items/admin [get]
// @Security BearerAuth
func (h *MenuHandler) ListAllMenuItemsForAdmin(c *gin.Context) {
	items, err := h.queries.ListAllMenuItemsForAdmin(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list menu items"})
		return
	}

	responses := make([]AdminMenuItemResponse, len(items))
	for i, item := range items {
		responses[i] = AdminMenuItemResponse{
			MenuItemResponse: MenuItemResponse{
				ID:                 pgUUIDToString(item.ID),
				TenantID:           pgUUIDPtrToStringPtr(&item.TenantID),
				Code:               item.Code,
				Label:              item.Label,
				Icon:               item.Icon,
				Route:              item.Route,
				ParentID:           pgUUIDPtrToStringPtr(&item.ParentID),
				RequiredPermission: item.RequiredPermission,
				DisplayOrder:       int32Value(item.DisplayOrder),
				IsActive:           boolValue(item.IsActive),
				IsVisible:          boolValue(item.IsVisible),
				BadgeText:          item.BadgeText,
				BadgeColor:         item.BadgeColor,
				Description:        item.Description,
			},
			TemplateCount: item.TemplateCount,
		}
	}

	c.JSON(http.StatusOK, responses)
}
