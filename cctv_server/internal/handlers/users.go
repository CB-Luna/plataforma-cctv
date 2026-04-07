package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/middleware"
	objectstorage "github.com/symtickets/cctv_server/internal/storage"
)

type UserHandler struct {
	db       *pgxpool.Pool
	queries  *database.Queries
	storage  *objectstorage.MinIOService
}

func NewUserHandler(db *pgxpool.Pool, queries *database.Queries, storage *objectstorage.MinIOService) *UserHandler {
	return &UserHandler{
		db:       db,
		queries:  queries,
		storage:  storage,
	}
}

// ListUsers godoc
// @Summary List all users
// @Description Get a paginated list of users. Super admins see all users, others see only their tenant.
// @Tags users
// @Accept json
// @Produce json
// @Param limit query int false "Number of items to return" default(20)
// @Param offset query int false "Number of items to skip" default(0)
// @Param tenant_id query string false "Filter by tenant ID (super admin only)"
// @Success 200 {array} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users [get]
// @Security BearerAuth
func (h *UserHandler) ListUsers(c *gin.Context) {
	// Paginación
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var users []database.ListUsersByTenantRow
	var err error

	// Verificar si tiene acceso global (Super Admin)
	if middleware.HasGlobalAccess(c, "users") {
		// Super admin puede filtrar por tenant específico o ver todos
		filterTenantID := c.Query("tenant_id")
		if filterTenantID != "" {
			// Filtrar por tenant específico
			pgTenantID, err := toPgUUID(filterTenantID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
				return
			}
			users, err = h.queries.ListUsersByTenant(c.Request.Context(), pgTenantID, int32(limit), int32(offset))
		} else {
			// Ver todos los usuarios (global)
			globalUsers, globalErr := h.queries.ListAllUsersGlobal(c.Request.Context(), int32(limit), int32(offset))
			if globalErr != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
				return
			}
			// Convertir a response directamente (tipos son compatibles)
			responses := h.convertUsersToResponse(globalUsers)
			c.JSON(http.StatusOK, responses)
			return
		}
	} else {
		// Usuario normal: solo ve usuarios de su tenant
		tenantID := middleware.GetTenantID(c)
		pgTenantID, convErr := toPgUUID(tenantID)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
			return
		}
		users, err = h.queries.ListUsersByTenant(c.Request.Context(), pgTenantID, int32(limit), int32(offset))
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}

	// Convertir a response
	responses := make([]UserResponse, len(users))
	for i, user := range users {
		var lastLogin *string
		if user.LastLoginAt.Valid {
			loginTime := user.LastLoginAt.Time.Format(time.RFC3339)
			lastLogin = &loginTime
		}

		responses[i] = UserResponse{
			ID:            pgUUIDToString(user.ID),
			TenantID:      pgUUIDToString(user.TenantID),
			TenantName:    user.TenantName,
			Email:         user.Email,
			FirstName:     user.FirstName,
			LastName:      user.LastName,
			Phone:         user.Phone,
			AvatarUrl:     user.AvatarUrl,
			IsActive:      boolValue(user.IsActive),
			EmailVerified: boolValue(user.EmailVerified),
			LastLoginAt:   lastLogin,
			CreatedAt:     user.CreatedAt.Time.Format(time.RFC3339),
		}

		// Parsear roles
		if user.Roles != nil {
			var rolesBytes []byte
			switch v := user.Roles.(type) {
			case []byte:
				rolesBytes = v
			case string:
				rolesBytes = []byte(v)
			default:
				bytes, err := json.Marshal(v)
				if err == nil {
					rolesBytes = bytes
				}
			}

			if len(rolesBytes) > 0 {
				var roles []RoleResponse
				if err := json.Unmarshal(rolesBytes, &roles); err == nil {
					responses[i].Roles = roles
				}
			}
		}
	}

	c.JSON(http.StatusOK, responses)
}

// GetUser godoc
// @Summary Get a user by ID
// @Description Get detailed information about a specific user
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /users/{id} [get]
// @Security BearerAuth
func (h *UserHandler) GetUser(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := c.Param("id")

	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	user, err := h.queries.GetUserByID(c.Request.Context(), pgUserID, pgTenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var lastLogin *string
	if user.LastLoginAt.Valid {
		loginTime := user.LastLoginAt.Time.Format(time.RFC3339)
		lastLogin = &loginTime
	}

	response := UserResponse{
		ID:            pgUUIDToString(user.ID),
		TenantID:      pgUUIDToString(user.TenantID),
		TenantName:    user.TenantName,
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		Phone:         user.Phone,
		AvatarUrl:     user.AvatarUrl,
		IsActive:      boolValue(user.IsActive),
		EmailVerified: boolValue(user.EmailVerified),
		LastLoginAt:   lastLogin,
		CreatedAt:     user.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUser godoc
// @Summary Update a user
// @Description Update user information
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Param user body UpdateUserRequest true "User information"
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{id} [put]
// @Security BearerAuth
func (h *UserHandler) UpdateUser(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := c.Param("id")

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	user, err := h.queries.UpdateUser(
		c.Request.Context(),
		pgUserID,
		pgTenantID,
		req.FirstName,
		req.LastName,
		req.Phone,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}

	var lastLogin *string
	if user.LastLoginAt.Valid {
		loginTime := user.LastLoginAt.Time.Format(time.RFC3339)
		lastLogin = &loginTime
	}

	response := UserResponse{
		ID:            pgUUIDToString(user.ID),
		TenantID:      pgUUIDToString(user.TenantID),
		TenantName:    nil, // UpdateUser query no incluye tenant_name
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		Phone:         user.Phone,
		AvatarUrl:     user.AvatarUrl,
		IsActive:      boolValue(user.IsActive),
		EmailVerified: boolValue(user.EmailVerified),
		LastLoginAt:   lastLogin,
		CreatedAt:     user.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// DeactivateUser godoc
// @Summary Deactivate a user
// @Description Deactivate a user account
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{id} [delete]
// @Security BearerAuth
func (h *UserHandler) DeactivateUser(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := c.Param("id")

	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	// Verificar si tiene acceso global
	if middleware.HasGlobalAccess(c, "users") {
		err = h.queries.DeactivateUserGlobal(c.Request.Context(), pgUserID)
	} else {
		err = h.queries.DeactivateUser(c.Request.Context(), pgUserID, pgTenantID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to deactivate user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deactivated successfully"})
}

// GetUserRoles godoc
// @Summary Get user roles
// @Description Get all roles assigned to a user
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Success 200 {array} RoleResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{id}/roles [get]
// @Security BearerAuth
func (h *UserHandler) GetUserRoles(c *gin.Context) {
	userID := c.Param("id")

	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	roles, err := h.queries.GetUserRoles(c.Request.Context(), pgUserID)
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

// AssignRole godoc
// @Summary Assign role to user
// @Description Assign a role to a user
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Param role body AssignRoleRequest true "Role assignment"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{id}/roles [post]
// @Security BearerAuth
func (h *UserHandler) AssignRole(c *gin.Context) {
	userID := c.Param("id")

	var req AssignRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	pgRoleID, err := toPgUUID(req.RoleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role ID format"})
		return
	}

	err = h.queries.AssignRoleToUser(c.Request.Context(), pgUserID, pgRoleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "role assigned successfully"})
}

// RemoveRole godoc
// @Summary Remove role from user
// @Description Remove a role from a user
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Param roleId path string true "Role ID (UUID)"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{id}/roles/{roleId} [delete]
// @Security BearerAuth
func (h *UserHandler) RemoveRole(c *gin.Context) {
	userID := c.Param("id")
	roleID := c.Param("roleId")

	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	pgRoleID, err := toPgUUID(roleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role ID format"})
		return
	}

	err = h.queries.RemoveRoleFromUser(c.Request.Context(), pgUserID, pgRoleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "role removed successfully"})
}

// ChangeUserPassword godoc
// @Summary Change user password
// @Description Update the password of a user (self-service or admin maintenance)
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Param request body UpdatePasswordRequest true "New password payload"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{id}/password [put]
// @Security BearerAuth
func (h *UserHandler) ChangeUserPassword(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := c.Param("id")
	currentUserID := middleware.GetUserID(c)

	var req UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload"})
		return
	}

	// Nota: permitimos cambio propio y de otros usuarios del mismo tenant (mantenimiento de admin).
	_ = currentUserID

	passwordHash, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	if err := h.queries.UpdateUserPassword(c.Request.Context(), pgUserID, pgTenantID, passwordHash); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}

// UploadUserAvatar godoc
// @Summary Upload user avatar
// @Description Upload a profile image for a user
// @Tags users
// @Accept multipart/form-data
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Param profile_image formData file true "Avatar image file"
// @Param description formData string false "Image description"
// @Param is_public formData bool false "Is public" default(true)
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /users/{id}/profile-image [post]
// @Security BearerAuth
func (h *UserHandler) UploadUserAvatar(c *gin.Context) {
	authTenantID := middleware.GetTenantID(c)
	userID := c.Param("id")
	currentUserID := middleware.GetUserID(c)
	roles := middleware.GetRoles(c)

	// Convertir IDs para buscar el usuario target
	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	// Primero, buscar el usuario target para obtener su tenant_id real
	// Los super_admin pueden trabajar con usuarios de cualquier tenant
	var targetTenantID string

	// Verificar si es super_admin
	isSuperAdmin := false
	for _, role := range roles {
		if role == "super_admin" {
			isSuperAdmin = true
			break
		}
	}

	if isSuperAdmin {
		// Super admin: buscar usuario en CUALQUIER tenant
		// Usar un límite alto para obtener todos los usuarios (limit, offset)
		allUsers, err := h.queries.ListAllUsersGlobal(c.Request.Context(), 10000, 0)
		if err != nil {
			log.Printf("[ERROR] Failed to list users: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find user"})
			return
		}

		found := false
		for _, u := range allUsers {
			if pgUUIDToString(u.ID) == userID {
				targetTenantID = pgUUIDToString(u.TenantID)
				found = true
				break
			}
		}

		if !found {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
	} else {
		// Usuario regular: solo puede acceder a usuarios de su tenant
		targetTenantID = authTenantID

		// Validar que el usuario autenticado sea el mismo o tenga permisos de admin
		if currentUserID != userID {
			hasAdminRole := false
			for _, role := range roles {
				if role == "admin" || role == "Administrador" {
					hasAdminRole = true
					break
				}
			}
			if !hasAdminRole {
				c.JSON(http.StatusForbidden, gin.H{"error": "you don't have permission to update this user's avatar"})
				return
			}
		}
	}

	pgTenantID, err := toPgUUID(targetTenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	log.Printf("[DEBUG] Avatar upload - user_id=%s, target_tenant_id=%s, auth_tenant_id=%s, is_super_admin=%v",
		userID, targetTenantID, authTenantID, isSuperAdmin)

	// Parsear archivo
	file, header, err := c.Request.FormFile("profile_image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "profile_image is required"})
		return
	}
	defer file.Close()

	// Validar tipo de archivo (imagen)
	contentType := header.Header.Get("Content-Type")
	validImageTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	if !validImageTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed"})
		return
	}

	// Validar tamaño (máx 5MB)
	const maxFileSize = 5 * 1024 * 1024
	if header.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum size is 5MB"})
		return
	}

	log.Printf("[DEBUG] Looking up user_id=%s, tenant_id=%s for avatar upload", userID, targetTenantID)

	// Consultar usuario para completar metadatos
	currentUser, err := h.queries.GetUserByID(c.Request.Context(), pgUserID, pgTenantID)

	firstName := ""
	lastName := ""
	if err == nil {
		firstName = strings.TrimSpace(currentUser.FirstName)
		lastName = strings.TrimSpace(currentUser.LastName)
		log.Printf("[DEBUG] Found user: %s %s", firstName, lastName)
	} else {
		log.Printf("[WARN] Could not find user for avatar upload: %v", err)
	}

	description := c.PostForm("description")
	if description == "" {
		nameConcat := strings.TrimSpace(fmt.Sprintf("%s %s", firstName, lastName))
		if nameConcat != "" {
			description = nameConcat
		} else {
			description = fmt.Sprintf("Avatar for user %s", userID)
		}
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read avatar file"})
		return
	}

	fileHash := sha256.Sum256(fileBytes)
	fileHashHex := hex.EncodeToString(fileHash[:])
	extension := filepath.Ext(header.Filename)
	objectFileName := fmt.Sprintf("%s%s", uuid.New().String(), extension)
	objectPath := fmt.Sprintf("tenants/%s/avatars/%s/%s", targetTenantID, userID, objectFileName)

	metadata := map[string]interface{}{
		"user_id":       userID,
		"description":   description,
		"first_name":    firstName,
		"last_name":     lastName,
		"original_name": header.Filename,
	}
	metadataJSON, _ := json.Marshal(metadata)

	storedObject, err := h.storage.UploadObject(
		c.Request.Context(),
		pgTenantID,
		"users_avatar",
		objectPath,
		contentType,
		fileBytes,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to store avatar in minio: %v", err)})
		return
	}

	category := "user_avatar"
	entityType := "users"
	dbFile, err := h.queries.CreateFile(c.Request.Context(), database.CreateFileParams{
		TenantID:          pgTenantID,
		Filename:          objectFileName,
		OriginalFilename:  header.Filename,
		MimeType:          contentType,
		FileSize:          int64(len(fileBytes)),
		FileHash:          &fileHashHex,
		StorageProvider:   &storedObject.Provider,
		StorageBucket:     &storedObject.Bucket,
		StoragePath:       objectPath,
		StorageUrl:        nil,
		Category:          &category,
		RelatedEntityType: &entityType,
		RelatedEntityID:   pgUserID,
		Metadata:          metadataJSON,
		UploadedBy:        pgUserID,
	})
	if err != nil {
		_ = h.storage.DeleteObject(c.Request.Context(), pgTenantID, "users_avatar", storedObject.Bucket, objectPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to save avatar metadata: %v", err)})
		return
	}

	avatarURL := buildAbsoluteURL(c, fmt.Sprintf("/api/v1/storage/public/%s", pgUUIDToString(dbFile.ID)))

	// Log para debugging
	log.Printf("[DEBUG] Updating avatar for user_id=%s, tenant_id=%s, avatar_url=%s", userID, targetTenantID, avatarURL)

	// Verificar que el usuario existe antes de actualizar
	existingUser, err := h.queries.GetUserByID(c.Request.Context(), pgUserID, pgTenantID)
	if err != nil {
		log.Printf("[ERROR] User not found for avatar update: %v (user_id=%s, tenant_id=%s)", err, userID, targetTenantID)
		_ = h.storage.DeleteObject(c.Request.Context(), pgTenantID, "users_avatar", storedObject.Bucket, objectPath)
		_ = h.queries.DeleteFile(c.Request.Context(), dbFile.ID, pgTenantID)
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "user not found",
			"details": fmt.Sprintf("User %s does not exist in tenant %s", userID, targetTenantID),
		})
		return
	}

	log.Printf("[DEBUG] User found, proceeding to update avatar. User email: %s", existingUser.Email)

	// Actualizar en BD
	user, err := h.queries.UpdateUserAvatar(c.Request.Context(), pgUserID, pgTenantID, &avatarURL)
	if err != nil {
		log.Printf("[ERROR] Failed to update user avatar in DB: %v (user_id=%s, tenant_id=%s)", err, userID, targetTenantID)
		_ = h.storage.DeleteObject(c.Request.Context(), pgTenantID, "users_avatar", storedObject.Bucket, objectPath)
		_ = h.queries.DeleteFile(c.Request.Context(), dbFile.ID, pgTenantID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to update user avatar in database: %v", err)})
		return
	}

	h.deleteEntityFilesByCategory(c, pgTenantID, pgUserID, category, dbFile.ID, "users_avatar")

	// Retornar usuario actualizado
	var lastLogin *string
	if user.LastLoginAt.Valid {
		loginTime := user.LastLoginAt.Time.Format(time.RFC3339)
		lastLogin = &loginTime
	}

	response := UserResponse{
		ID:            pgUUIDToString(user.ID),
		TenantID:      pgUUIDToString(user.TenantID),
		TenantName:    nil, // UpdateUserAvatar query no incluye tenant_name
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		Phone:         user.Phone,
		AvatarUrl:     user.AvatarUrl,
		IsActive:      boolValue(user.IsActive),
		EmailVerified: boolValue(user.EmailVerified),
		LastLoginAt:   lastLogin,
		CreatedAt:     user.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// DeleteUserAvatar godoc
// @Summary Delete user avatar
// @Description Remove the profile image for a user
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID (UUID)"
// @Success 200 {object} UserResponse
// @Failure 404 {object} ErrorResponse
// @Router /users/{id}/profile-image [delete]
// @Security BearerAuth
func (h *UserHandler) DeleteUserAvatar(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := c.Param("id")
	currentUserID := middleware.GetUserID(c)

	// Permitir que el usuario elimine su propio avatar o que un admin elimine el avatar de otro usuario del mismo tenant
	_ = currentUserID

	pgUserID, err := toPgUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	pgTenantID, err := toPgUUID(tenantID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID format"})
		return
	}

	h.deleteEntityFilesByCategory(c, pgTenantID, pgUserID, "user_avatar", pgtype.UUID{}, "users_avatar")

	// Actualizar usuario sin avatar
	user, err := h.queries.UpdateUserAvatar(c.Request.Context(), pgUserID, pgTenantID, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user avatar"})
		return
	}

	// Retornar usuario actualizado
	var lastLogin *string
	if user.LastLoginAt.Valid {
		loginTime := user.LastLoginAt.Time.Format(time.RFC3339)
		lastLogin = &loginTime
	}

	response := UserResponse{
		ID:            pgUUIDToString(user.ID),
		TenantID:      pgUUIDToString(user.TenantID),
		TenantName:    nil, // UpdateUserAvatar query no incluye tenant_name
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		Phone:         user.Phone,
		AvatarUrl:     user.AvatarUrl,
		IsActive:      boolValue(user.IsActive),
		EmailVerified: boolValue(user.EmailVerified),
		LastLoginAt:   lastLogin,
		CreatedAt:     user.CreatedAt.Time.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// convertUsersToResponse convierte resultados de ListAllUsersGlobal a UserResponse
func (h *UserHandler) convertUsersToResponse(users []database.ListAllUsersGlobalRow) []UserResponse {
	responses := make([]UserResponse, len(users))
	for i, user := range users {
		var lastLogin *string
		if user.LastLoginAt.Valid {
			loginTime := user.LastLoginAt.Time.Format(time.RFC3339)
			lastLogin = &loginTime
		}

		responses[i] = UserResponse{
			ID:            pgUUIDToString(user.ID),
			TenantID:      pgUUIDToString(user.TenantID),
			TenantName:    user.TenantName,
			Email:         user.Email,
			FirstName:     user.FirstName,
			LastName:      user.LastName,
			Phone:         user.Phone,
			AvatarUrl:     user.AvatarUrl,
			IsActive:      boolValue(user.IsActive),
			EmailVerified: boolValue(user.EmailVerified),
			LastLoginAt:   lastLogin,
			CreatedAt:     user.CreatedAt.Time.Format(time.RFC3339),
		}

		// Parsear roles
		if user.Roles != nil {
			var rolesBytes []byte
			switch v := user.Roles.(type) {
			case []byte:
				rolesBytes = v
			case string:
				rolesBytes = []byte(v)
			default:
				bytes, err := json.Marshal(v)
				if err == nil {
					rolesBytes = bytes
				}
			}

			if len(rolesBytes) > 0 {
				var roles []RoleResponse
				if err := json.Unmarshal(rolesBytes, &roles); err == nil {
					responses[i].Roles = roles
				}
			}
		}
	}
	return responses
}

func (h *UserHandler) deleteEntityFilesByCategory(
	c *gin.Context,
	tenantID pgtype.UUID,
	entityID pgtype.UUID,
	category string,
	keepFileID pgtype.UUID,
	moduleName string,
) {
	entityType := "users"
	files, err := h.queries.ListFilesByEntity(c.Request.Context(), tenantID, &entityType, entityID)
	if err != nil {
		return
	}

	for _, file := range files {
		if file.Category == nil || *file.Category != category {
			continue
		}
		if keepFileID.Valid && file.ID == keepFileID {
			continue
		}

		_ = h.storage.DeleteObject(c.Request.Context(), tenantID, moduleName, stringValue(file.StorageBucket), file.StoragePath)
		_ = h.queries.DeleteFile(c.Request.Context(), file.ID, tenantID)
	}
}
