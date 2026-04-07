package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/config"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type AuthHandler struct {
	db      *pgxpool.Pool
	queries *database.Queries
	config  *config.Config
}

func NewAuthHandler(db *pgxpool.Pool, queries *database.Queries, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		db:      db,
		queries: queries,
		config:  cfg,
	}
}

// Register godoc
// @Summary Register a new user
// @Description Register a new user in the system
// @Tags auth
// @Accept json
// @Produce json
// @Param user body RegisterRequest true "User registration information"
// @Success 201 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convertir tenant_id a pgtype.UUID
	pgTenantID, err := toPgUUID(req.TenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	// Verificar si el usuario ya existe GLOBALMENTE (en cualquier tenant)
	existingUsers, _ := h.queries.GetUsersByEmailGlobal(c.Request.Context(), req.Email)
	if len(existingUsers) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user with this email already exists"})
		return
	}

	// Hash de la contraseña
	passwordHash, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	// Crear usuario
	user, err := h.queries.CreateUser(
		c.Request.Context(),
		pgTenantID,
		req.Email,
		passwordHash,
		req.FirstName,
		req.LastName,
		nullStringPtr(req.Phone),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	// Convertir a response
	response := UserResponse{
		ID:            pgUUIDToString(user.ID),
		TenantID:      pgUUIDToString(user.TenantID),
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		Phone:         user.Phone,
		AvatarUrl:     user.AvatarUrl,
		IsActive:      boolValue(user.IsActive),
		EmailVerified: boolValue(user.EmailVerified),
		CreatedAt:     user.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusCreated, response)
}

// Login godoc
// @Summary Login user
// @Description Authenticate user and return JWT token. Supports login without tenant_id.
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body LoginRequest true "User credentials"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Buscar usuarios por email (GLOBAL)
	users, err := h.queries.GetUsersByEmailGlobal(c.Request.Context(), req.Email)
	if err != nil {
		// Log error internally if needed, but return generic error to user
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Si no hay usuarios, devolver error
	if len(users) == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// 2. Filtrar usuarios válidos (password match)
	var validUsers []database.GetUsersByEmailGlobalRow
	for _, u := range users {
		if CheckPasswordHash(req.Password, u.PasswordHash) {
			validUsers = append(validUsers, u)
		}
	}

	if len(validUsers) == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// 3. Seleccionar usuario/tenant para el token
	var selectedUser database.GetUsersByEmailGlobalRow

	// Si req.TenantID no está vacío, intentamos encontrar ese tenant entre los validos
	if req.TenantID != "" {
		found := false
		for _, u := range validUsers {
			if pgUUIDToString(u.TenantID) == req.TenantID {
				selectedUser = u
				found = true
				break
			}
		}
		if !found {
			// El usuario se autenticó correctamente pero no pertenece al tenant solicitado
			c.JSON(http.StatusUnauthorized, gin.H{"error": "access denied to requested tenant or invalid credentials for this tenant"})
			return
		}
	} else {
		// Si no se pide tenant específico, usamos el primero de la lista
		// (En el futuro se puede mejorar para usar el último tenant accedido)
		selectedUser = validUsers[0]
	}

	// Verificar que el usuario esté activo
	if selectedUser.IsActive != nil && !*selectedUser.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user account is deactivated"})
		return
	}

	// 4. Preparar lista de compañías para la respuesta
	var companies []CompanyResponse
	for _, u := range validUsers {
		var settings map[string]interface{}
		if u.TenantSettings != nil {
			_ = json.Unmarshal(u.TenantSettings, &settings)
		}

		companies = append(companies, CompanyResponse{
			ID:             pgUUIDToString(u.TenantID),
			Name:           u.TenantName,
			Slug:           u.TenantSlug,
			LogoURL:        u.TenantLogoUrl,
			PrimaryColor:   u.TenantPrimaryColor,
			SecondaryColor: u.TenantSecondaryColor,
			TertiaryColor:  u.TenantTertiaryColor,
			IsActive:       true, // Filtrado en query
			Settings:       settings,
		})
	}

	// 5. Obtener roles del usuario seleccionado para el JWT
	roles, err := h.queries.GetUserRoles(c.Request.Context(), selectedUser.ID)
	if err != nil {
		roles = []database.AuthRole{}
	}
	roleNames := make([]string, len(roles))
	for i, role := range roles {
		roleNames[i] = role.Name
	}

	// 6. Generar Token
	expiresIn, _ := time.ParseDuration(h.config.JWTExpiresIn)
	if expiresIn == 0 {
		expiresIn = 15 * time.Minute
	}

	token, err := GenerateJWT(
		pgUUIDToString(selectedUser.ID),
		pgUUIDToString(selectedUser.TenantID),
		selectedUser.Email,
		roleNames,
		h.config.JWTSecret,
		expiresIn,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	// Actualizar último login
	_ = h.queries.UpdateLastLogin(c.Request.Context(), selectedUser.ID)

	// 7. Preparar respuesta
	var lastLogin *string
	if selectedUser.LastLoginAt.Valid {
		loginTime := selectedUser.LastLoginAt.Time.Format(time.RFC3339)
		lastLogin = &loginTime
	}

	response := LoginResponse{
		AccessToken: token,
		Companies:   companies,
		User: UserResponse{
			ID:            pgUUIDToString(selectedUser.ID),
			TenantID:      pgUUIDToString(selectedUser.TenantID),
			Email:         selectedUser.Email,
			FirstName:     selectedUser.FirstName,
			LastName:      selectedUser.LastName,
			Phone:         selectedUser.Phone,
			AvatarUrl:     selectedUser.AvatarUrl,
			IsActive:      boolValue(selectedUser.IsActive),
			EmailVerified: boolValue(selectedUser.EmailVerified),
			LastLoginAt:   lastLogin,
			CreatedAt:     selectedUser.CreatedAt.Time.Format(time.RFC3339),
		},
	}

	c.JSON(http.StatusOK, response)
}

// Logout godoc
// @Summary Logout user
// @Description Invalidate user session
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 500 {object} ErrorResponse
// @Router /auth/logout [post]
// @Security BearerAuth
func (h *AuthHandler) Logout(c *gin.Context) {
	// Por ahora solo retornamos éxito
	// En el futuro podemos implementar blacklist de tokens o invalidar sesiones
	c.JSON(http.StatusOK, gin.H{"message": "logout successful"})
}

// Me godoc
// @Summary Get current user information
// @Description Get information about the authenticated user including roles and permissions
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/me [get]
// @Security BearerAuth
func (h *AuthHandler) Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tenantID := middleware.GetTenantID(c)

	if userID == "" || tenantID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Convertir IDs
	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	// Obtener usuario
	user, err := h.queries.GetUserByID(c.Request.Context(), pgUserID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Obtener roles
	roles, err := h.queries.GetUserRoles(c.Request.Context(), user.ID)
	if err != nil {
		roles = []database.AuthRole{}
	}

	roleResponses := make([]RoleResponse, len(roles))
	for i, role := range roles {
		var tenantIDStr *string
		if role.TenantID.Valid {
			tid := pgUUIDToString(role.TenantID)
			tenantIDStr = &tid
		}

		roleResponses[i] = RoleResponse{
			ID:          pgUUIDToString(role.ID),
			TenantID:    tenantIDStr,
			Name:        role.Name,
			Description: role.Description,
			IsSystem:    boolValue(role.IsSystem),
			CreatedAt:   role.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	// Obtener permisos
	permissions, err := h.queries.GetUserPermissions(c.Request.Context(), user.ID)
	if err != nil {
		permissions = []database.AuthPermission{}
	}

	permResponses := make([]PermissionResponse, len(permissions))
	for i, perm := range permissions {
		permResponses[i] = PermissionResponse{
			ID:          pgUUIDToString(perm.ID),
			Code:        perm.Code,
			Description: perm.Description,
			Module:      perm.Module,
			CreatedAt:   perm.CreatedAt.Time.Format(time.RFC3339),
		}
	}

	// Obtener datos del tenant
	tenant, err := h.queries.GetTenantByID(c.Request.Context(), pgTenantID)
	var companies []CompanyResponse
	if err == nil {
		var settings map[string]interface{}
		if tenant.Settings != nil {
			_ = json.Unmarshal(tenant.Settings, &settings)
		}

		companies = []CompanyResponse{
			{
				ID:               pgUUIDToString(tenant.ID),
				Name:             tenant.Name,
				Slug:             tenant.Slug,
				Domain:           tenant.Domain,
				LogoURL:          tenant.LogoUrl,
				PrimaryColor:     tenant.PrimaryColor,
				SecondaryColor:   tenant.SecondaryColor,
				TertiaryColor:    tenant.TertiaryColor,
				IsActive:         boolValue(tenant.IsActive),
				Settings:         settings,
				SubscriptionPlan: tenant.SubscriptionPlan,
				MaxUsers:         tenant.MaxUsers,
				MaxClients:       tenant.MaxClients,
			},
		}
	}

	// Preparar respuesta
	var lastLogin *string
	if user.LastLoginAt.Valid {
		loginTime := user.LastLoginAt.Time.Format(time.RFC3339)
		lastLogin = &loginTime
	}

	c.JSON(http.StatusOK, gin.H{
		"user": UserResponse{
			ID:            pgUUIDToString(user.ID),
			TenantID:      pgUUIDToString(user.TenantID),
			Email:         user.Email,
			FirstName:     user.FirstName,
			LastName:      user.LastName,
			Phone:         user.Phone,
			AvatarUrl:     user.AvatarUrl,
			IsActive:      boolValue(user.IsActive),
			EmailVerified: boolValue(user.EmailVerified),
			LastLoginAt:   lastLogin,
			CreatedAt:     user.CreatedAt.Time.Format(time.RFC3339),
		},
		"roles":       roleResponses,
		"permissions": permResponses,
		"companies":   companies,
	})
}
