package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// TenantMiddleware valida que el tenant_id esté presente
func TenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID := GetTenantID(c)
		if tenantID == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "tenant_id not found in token"})
			c.Abort()
			return
		}
		c.Next()
	}
}
