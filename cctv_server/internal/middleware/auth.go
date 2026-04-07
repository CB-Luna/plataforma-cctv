package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	UserID   string   `json:"user_id"`
	TenantID string   `json:"tenant_id"`
	Email    string   `json:"email"`
	Roles    []string `json:"roles"`
	jwt.RegisteredClaims
}

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extraer token del header Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		// Validar formato Bearer
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Parsear y validar token
		token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		// Extraer claims
		if claims, ok := token.Claims.(*JWTClaims); ok {
			c.Set("user_id", claims.UserID)
			c.Set("tenant_id", claims.TenantID)
			c.Set("email", claims.Email)
			c.Set("roles", claims.Roles)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Helper para extraer tenant_id del contexto
func GetTenantID(c *gin.Context) string {
	if tenantID, exists := c.Get("tenant_id"); exists {
		return tenantID.(string)
	}
	return ""
}

// GetEffectiveTenantID obtiene el tenant_id efectivo, permitiendo override
// por super_admin a través de query param "tenant_id"
func GetEffectiveTenantID(c *gin.Context) string {
	// Si es super_admin y hay un tenant_id en query params, usar ese
	if HasGlobalAccess(c, "tenants") {
		if overrideTenant := c.Query("tenant_id"); overrideTenant != "" {
			return overrideTenant
		}
	}
	// Si no, usar el tenant del JWT
	return GetTenantID(c)
}

// IsSuperAdmin verifica si el usuario es super admin
func IsSuperAdmin(c *gin.Context) bool {
	return HasGlobalAccess(c, "tenants")
}

// Helper para extraer user_id del contexto
func GetUserID(c *gin.Context) string {
	if userID, exists := c.Get("user_id"); exists {
		return userID.(string)
	}
	return ""
}

// Helper para extraer roles del contexto
func GetRoles(c *gin.Context) []string {
	if roles, exists := c.Get("roles"); exists {
		if r, ok := roles.([]string); ok {
			return r
		}
	}
	return []string{}
}

// HasPermission verifica si el usuario tiene un permiso específico
// Los permisos pueden estar directamente en los roles del JWT
// Formato de permiso: "resource:action" o "resource:action:scope"
func HasPermission(c *gin.Context, permission string) bool {
	roles := GetRoles(c)
	for _, role := range roles {
		// Super Admin tiene todos los permisos
		if role == "Super Administrador" || role == "SuperAdmin" || role == "super_admin" {
			return true
		}
		// Administrador tiene permisos de su tenant
		if role == "Administrador" || role == "Admin" {
			// Si el permiso termina en :own, el admin lo tiene
			if strings.HasSuffix(permission, ":own") {
				return true
			}
		}
	}
	return false
}

// HasGlobalAccess verifica si el usuario tiene acceso global (scope :all)
// para un recurso específico (ej: "users" -> busca "users:*:all" o rol SuperAdmin)
func HasGlobalAccess(c *gin.Context, resource string) bool {
	roles := GetRoles(c)
	for _, role := range roles {
		// Super Admin tiene acceso global a todo
		if role == "Super Administrador" || role == "SuperAdmin" || role == "super_admin" {
			return true
		}
	}
	return false
}

// HasTenantAccess verifica si el usuario tiene acceso al tenant especificado
// Retorna true si es el tenant del usuario o si tiene acceso global
func HasTenantAccess(c *gin.Context, targetTenantID string) bool {
	// Si tiene acceso global, puede acceder a cualquier tenant
	if HasGlobalAccess(c, "tenants") {
		return true
	}
	// Sino, solo puede acceder a su propio tenant
	return GetTenantID(c) == targetTenantID
}
