package main

import (
	"context"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/symtickets/cctv_server/internal/config"
	"github.com/symtickets/cctv_server/internal/database"
	"github.com/symtickets/cctv_server/internal/handlers"
	catalogintelligence "github.com/symtickets/cctv_server/internal/intelligence"
	"github.com/symtickets/cctv_server/internal/middleware"
	objectstorage "github.com/symtickets/cctv_server/internal/storage"

	_ "github.com/symtickets/cctv_server/docs" // Swagger docs
)

// @title SyMTickets CCTV API
// @version 1.0
// @description API REST para sistema de gestión de tickets CCTV multi-tenant
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@symtickets.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api/v1
// @schemes http https

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Cargar configuración
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Conectar a la base de datos
	dbPool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Unable to connect to database:", err)
	}
	defer dbPool.Close()

	// Ping para verificar conexión
	if err := dbPool.Ping(context.Background()); err != nil {
		log.Fatal("Unable to ping database:", err)
	}
	log.Println("Successfully connected to database")

	// Inicializar queries de sqlc
	queries := database.New(dbPool)
	minioService := objectstorage.NewMinIOService(queries, cfg)
	catalogEmbeddingService := catalogintelligence.NewCatalogEmbeddingService(dbPool, queries)

	// Configurar Gin
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// Middleware CORS para Flutter Web
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Company-ID, X-Tenant-ID")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Middleware global
	router.Use(gin.Recovery())

	// Health check (sin autenticación)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "symtickets-api",
		})
	})

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Rutas públicas (sin autenticación)
	authHandler := handlers.NewAuthHandler(dbPool, queries, cfg)
	public := router.Group("/api/v1")
	{
		public.POST("/auth/register", authHandler.Register)
		public.POST("/auth/login", authHandler.Login)
		public.POST("/auth/logout", authHandler.Logout)

		// Storage público para avatars y logos.
		storageHandlerPublic := handlers.NewStorageHandler(dbPool, queries, minioService)
		public.GET("/storage/public/:id", storageHandlerPublic.ServePublicFile)
	}

	// API v1 routes (con autenticación)
	v1 := router.Group("/api/v1")
	v1.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	v1.Use(middleware.TenantMiddleware())
	{
		// Auth endpoints (protegidos)
		v1.GET("/auth/me", authHandler.Me)

		// User endpoints
		userHandler := handlers.NewUserHandler(dbPool, queries, minioService)
		users := v1.Group("/users")
		{
			users.GET("", userHandler.ListUsers)
			users.GET("/:id", userHandler.GetUser)
			users.PUT("/:id", userHandler.UpdateUser)
			users.PUT("/:id/password", userHandler.ChangeUserPassword)
			users.DELETE("/:id", userHandler.DeactivateUser)
			users.GET("/:id/roles", userHandler.GetUserRoles)
			users.POST("/:id/roles", userHandler.AssignRole)
			users.DELETE("/:id/roles/:roleId", userHandler.RemoveRole)
			users.POST("/:id/profile-image", userHandler.UploadUserAvatar)
			users.DELETE("/:id/profile-image", userHandler.DeleteUserAvatar)
		}

		// Role endpoints
		roleHandler := handlers.NewRoleHandler(dbPool, queries)
		roles := v1.Group("/roles")
		{
			roles.GET("", roleHandler.ListRoles)
			roles.POST("", roleHandler.CreateRole)
			roles.GET("/:id", roleHandler.GetRole)
			roles.PUT("/:id", roleHandler.UpdateRole)
			roles.GET("/:id/permissions", roleHandler.GetRolePermissions)
			roles.POST("/:id/permissions", roleHandler.AssignPermission)
		}

		// Permission endpoints
		permissions := v1.Group("/permissions")
		{
			permissions.GET("", roleHandler.ListAllPermissions)
			permissions.POST("", roleHandler.CreatePermission)
		}

		// Settings endpoints
		settingsHandler := handlers.NewSettingsHandler(dbPool, queries)
		settings := v1.Group("/settings")
		{
			settings.GET("", settingsHandler.GetSettings)
			settings.PUT("", settingsHandler.UpdateSettings)
			settings.PUT("/theme", settingsHandler.UpdateTheme)
		}

		// Menu endpoints
		menuHandler := handlers.NewMenuHandler(dbPool, queries)
		menu := v1.Group("/menu")
		{
			menu.GET("", menuHandler.GetMenu)                              // Menú del usuario
			menu.GET("/items", menuHandler.ListMenuItems)                  // Listar items (admin)
			menu.GET("/items/admin", menuHandler.ListAllMenuItemsForAdmin) // Listar items con count de templates
			menu.GET("/items/:id", menuHandler.GetMenuItem)                // Ver item
			menu.GET("/items/:id/templates", menuHandler.GetItemTemplates) // Templates que contienen el item
			menu.POST("/items", menuHandler.CreateMenuItem)                // Crear item
			menu.PUT("/items/:id", menuHandler.UpdateMenuItem)             // Actualizar item
			menu.PATCH("/items/:id/toggle", menuHandler.ToggleMenuItem)    // Activar/desactivar
			menu.DELETE("/items/:id", menuHandler.DeleteMenuItem)          // Eliminar item
			menu.PUT("/items/reorder", menuHandler.ReorderMenuItems)       // Reordenar
			// Templates routes
			menu.GET("/templates", menuHandler.ListMenuTemplates)                   // Listar plantillas
			menu.POST("/templates", menuHandler.CreateMenuTemplate)                 // Crear plantilla
			menu.PUT("/templates/:id", menuHandler.UpdateMenuTemplate)              // Actualizar plantilla
			menu.DELETE("/templates/:id", menuHandler.DeleteMenuTemplate)           // Eliminar plantilla
			menu.GET("/templates/:id/tenants", menuHandler.GetTenantsForTemplate)   // Tenants de plantilla
			menu.PUT("/templates/:id/tenants", menuHandler.AssignTenantsToTemplate) // Asignar tenants
			// Template Items (N:N relationship)
			menu.GET("/templates/:id/items", menuHandler.GetTemplateItems)                      // Items asignados a template
			menu.POST("/templates/:id/items", menuHandler.AssignItemToTemplate)                 // Asignar item a template
			menu.PUT("/templates/:id/items-bulk", menuHandler.BulkAssignItemsToTemplate)        // Asignar múltiples items
			menu.PUT("/template-items/:id/item/:itemId", menuHandler.UpdateItemInTemplate)      // Actualizar item en template
			menu.DELETE("/template-items/:id/item/:itemId", menuHandler.RemoveItemFromTemplate) // Quitar item de template
			menu.GET("/templates/:id/unassigned-items", menuHandler.GetUnassignedItems)         // Items no asignados
			menu.GET("/tenants", menuHandler.GetAllTenantsForAssignment)                        // Listar todos los tenants
		}

		// Tenant endpoints
		tenantHandler := handlers.NewTenantHandler(dbPool, queries, minioService)
		tenants := v1.Group("/tenants")
		{
			tenants.GET("/stats", tenantHandler.GetTenantStats)
			tenants.GET("", tenantHandler.ListTenants)
			tenants.GET("/:id", tenantHandler.GetTenant)
			tenants.POST("", tenantHandler.CreateTenant)
			tenants.PUT("/:id", tenantHandler.UpdateTenant)
			tenants.PATCH("/:id/activate", tenantHandler.ActivateTenant)
			tenants.PATCH("/:id/deactivate", tenantHandler.DeactivateTenant)
			tenants.POST("/:id/logo", tenantHandler.UploadTenantLogo)
		}

		// Storage endpoints
		storageHandler := handlers.NewStorageHandler(dbPool, queries, minioService)
		storageConfigHandler := handlers.NewStorageConfigHandler(dbPool, queries)
		storage := v1.Group("/storage")
		{
			storage.POST("/upload", storageHandler.UploadFile)
			storage.GET("/files", storageHandler.ListFiles)
			storage.GET("/files/:id/content", storageHandler.GetFileContent)
			storage.GET("/stats", storageHandler.GetFileStats)
			// Nota: /proxy está registrado en las rutas públicas para evitar problemas con <img> tags

			// Configuration routes
			storage.GET("/providers", storageConfigHandler.ListProviders)
			storage.GET("/configurations", storageConfigHandler.ListConfigurations)
			storage.POST("/configurations", storageConfigHandler.CreateConfiguration)
			storage.PUT("/configurations/:id", storageConfigHandler.UpdateConfiguration)
			storage.DELETE("/configurations/:id", storageConfigHandler.DeleteConfiguration)
		}

		// Intelligence endpoints
		intelligenceHandler := handlers.NewIntelligenceHandler(dbPool, queries, catalogEmbeddingService)
		intelligence := v1.Group("/intelligence")
		{
			intelligence.GET("/models", intelligenceHandler.ListModelConfigs)
			intelligence.POST("/models", intelligenceHandler.CreateModelConfig)
			intelligence.GET("/models/:id", intelligenceHandler.GetModelConfig)
			intelligence.PUT("/models/:id", intelligenceHandler.UpdateModelConfig)
			intelligence.DELETE("/models/:id", intelligenceHandler.DeleteModelConfig)
			intelligence.PATCH("/models/:id/set-default", intelligenceHandler.SetDefaultModelConfig)
			intelligence.PATCH("/models/:id/active", intelligenceHandler.ToggleModelConfigActive)
			intelligence.GET("/templates", intelligenceHandler.ListPromptTemplates)
			intelligence.GET("/analyses", intelligenceHandler.ListAnalyses)
			intelligence.GET("/usage", intelligenceHandler.GetUsageStats)
			intelligence.POST("/embeddings/reindex/models", intelligenceHandler.ReindexCatalogModelEmbeddings)
			intelligence.POST("/embeddings/reindex/model/:id", intelligenceHandler.ReindexSingleCatalogModelEmbedding)
		}

		// Client endpoints
		clientHandler := handlers.NewClientHandler(dbPool, queries)
		clients := v1.Group("/clients")
		{
			clients.GET("", clientHandler.ListClients)
			clients.GET("/:id", clientHandler.GetClient)
			clients.POST("", clientHandler.CreateClient)
		}

		// Policies endpoints
		policyHandler := handlers.NewPolicyHandler(dbPool, queries)
		policies := v1.Group("/policies")
		{
			policies.GET("", policyHandler.ListPolicies)
			policies.POST("", policyHandler.CreatePolicy)
			policies.GET("/:id", policyHandler.GetPolicy)
			policies.PUT("/:id", policyHandler.UpdatePolicy)
			policies.DELETE("/:id", policyHandler.DeletePolicy)
			policies.POST("/:id/assets", policyHandler.AddPolicyAsset)
			policies.DELETE("/:id/assets/:assetId", policyHandler.RemovePolicyAsset)
		}

		// SLA endpoints
		slaHandler := handlers.NewSlaHandler(dbPool, queries)
		sla := v1.Group("/sla")
		{
			sla.GET("/policies", slaHandler.ListPolicies)
			sla.POST("/policies", slaHandler.CreatePolicy)
			sla.PUT("/policies/:id", slaHandler.UpdatePolicy)
			sla.DELETE("/policies/:id", slaHandler.DeletePolicy)
		}

		// Inventory endpoints
		inventoryHandler := handlers.NewInventoryHandler(dbPool, queries, catalogEmbeddingService)
		inventory := v1.Group("/inventory")
		{
			inventory.GET("/floor-plans/sites", inventoryHandler.ListFloorPlanSites)
			inventory.GET("/floor-plans/site/:siteId", inventoryHandler.GetFloorPlanBySite)
			inventory.PUT("/floor-plans/site/:siteId", inventoryHandler.SaveFloorPlanBySite)

			// NVR Servers
			inventory.GET("/nvrs", inventoryHandler.ListNvrServers)
			inventory.GET("/nvrs/stats", inventoryHandler.GetNvrServerStats)
			inventory.GET("/nvrs/:id", inventoryHandler.GetNvrServer)
			inventory.POST("/nvrs", inventoryHandler.CreateNvrServer)
			inventory.PUT("/nvrs/:id", inventoryHandler.UpdateNvrServer)
			inventory.DELETE("/nvrs/:id", inventoryHandler.DeleteNvrServer)
			inventory.GET("/nvrs/:id/licenses", inventoryHandler.GetNvrLicenses)
			inventory.GET("/nvrs/:id/cameras", inventoryHandler.GetNvrCameras)

			// Cameras
			inventory.GET("/cameras", inventoryHandler.ListCameras)
			inventory.GET("/cameras/stats", inventoryHandler.GetCameraStats)
			inventory.GET("/cameras/search", inventoryHandler.SearchCameras)
			inventory.GET("/cameras/:id", inventoryHandler.GetCamera)
			inventory.POST("/cameras", inventoryHandler.CreateCamera)
			inventory.DELETE("/cameras/:id", inventoryHandler.DeleteCamera)

			// Semantic search for camera models
			inventory.GET("/models/search/semantic", inventoryHandler.SearchSemanticModels)

			// Executive Summary
			inventory.GET("/summary", inventoryHandler.GetExecutiveSummary)
		}

		// Inventory Import endpoints
		inventoryImportHandler := handlers.NewInventoryImportHandler(dbPool, queries)
		inventoryImport := v1.Group("/inventory/import")
		{
			inventoryImport.GET("/batches", inventoryImportHandler.ListImportBatches)
			inventoryImport.GET("/batches/:id", inventoryImportHandler.GetImportBatch)
			inventoryImport.GET("/batches/:id/items", inventoryImportHandler.GetImportBatchItems)
			inventoryImport.GET("/batches/:id/errors", inventoryImportHandler.GetImportBatchErrors)
			inventoryImport.POST("/batches", inventoryImportHandler.CreateImportBatch)
			inventoryImport.POST("/batches/:id/process", inventoryImportHandler.ProcessImportBatch)
			inventoryImport.POST("/batches/:id/cancel", inventoryImportHandler.CancelImportBatch)
			inventoryImport.DELETE("/batches/:id", inventoryImportHandler.DeleteImportBatch)
			inventoryImport.GET("/stats", inventoryImportHandler.GetImportStats)
			inventoryImport.POST("/validate", inventoryImportHandler.ValidateImportData)
			inventoryImport.POST("/assistant/analyze", inventoryImportHandler.AnalyzeImportAssistant)
		}

		// Ticket endpoints
		ticketHandler := handlers.NewTicketHandler(dbPool, queries)
		tickets := v1.Group("/tickets")
		{
			tickets.GET("/stats", ticketHandler.GetTicketStats)                        // Statistics
			tickets.GET("/technicians/workload", ticketHandler.GetTechniciansWorkload) // Technicians workload
			tickets.GET("", ticketHandler.ListTickets)                                 // List with filters
			tickets.POST("", ticketHandler.CreateTicket)                               // Create
			tickets.GET("/:id", ticketHandler.GetTicket)                               // Get details
			tickets.PUT("/:id", ticketHandler.UpdateTicket)                            // Update
			tickets.DELETE("/:id", ticketHandler.DeleteTicket)                         // Delete
			tickets.PATCH("/:id/status", ticketHandler.ChangeTicketStatus)             // Change status
			tickets.PATCH("/:id/assign", ticketHandler.AssignTicket)                   // Assign technician
			tickets.GET("/:id/timeline", ticketHandler.GetTicketTimeline)              // Timeline
			tickets.GET("/:id/comments", ticketHandler.ListTicketComments)             // List comments
			tickets.POST("/:id/comments", ticketHandler.AddTicketComment)              // Add comment
		}

		// Dashboard endpoints
		dashboardHandler := handlers.NewDashboardHandler(dbPool, queries)
		dashboard := v1.Group("/dashboard")
		{
			dashboard.GET("/summary", dashboardHandler.GetDashboardSummary)                 // Executive summary
			dashboard.GET("/tickets/stats", dashboardHandler.GetTicketStats)                // Ticket stats
			dashboard.GET("/tickets/trend", dashboardHandler.GetTicketsTrend)               // Ticket trend
			dashboard.GET("/clients/stats", dashboardHandler.GetClientStats)                // Client stats
			dashboard.GET("/policies/stats", dashboardHandler.GetPolicyStats)               // Policy stats
			dashboard.GET("/invoices/stats", dashboardHandler.GetInvoiceStats)              // Invoice stats
			dashboard.GET("/users/stats", dashboardHandler.GetUserStats)                    // User stats
			dashboard.GET("/users/by-role", dashboardHandler.GetUsersByRole)                // Users by role
			dashboard.GET("/inventory/stats", dashboardHandler.GetInventoryStats)           // Inventory stats
			dashboard.GET("/technicians/workload", dashboardHandler.GetTechniciansWorkload) // Workload
		}
	}

	// TODO: Agregar más rutas para otros módulos
	// - /api/v1/equipment
	// - /api/v1/policies

	// Iniciar servidor
	port := cfg.ServerPort
	log.Printf("Server starting on port %s", port)
	if err := router.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
