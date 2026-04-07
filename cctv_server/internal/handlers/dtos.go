package handlers

// DTOs para Swagger documentation
// Estos tipos son simplificados para que Swagger los pueda parsear correctamente

// ClientResponse representa un cliente en las respuestas de la API
type ClientResponse struct {
	ID          string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	TenantID    string  `json:"tenant_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	CompanyName string  `json:"company_name" example:"Empresa CCTV SA de CV"`
	LegalName   *string `json:"legal_name,omitempty" example:"Empresa CCTV Sociedad Anónima de Capital Variable"`
	RFC         *string `json:"rfc,omitempty" example:"ECC010101ABC"`
	Address     *string `json:"address,omitempty" example:"Av. Principal 123"`
	City        *string `json:"city,omitempty" example:"Ciudad de México"`
	State       *string `json:"state,omitempty" example:"CDMX"`
	PostalCode  *string `json:"postal_code,omitempty" example:"01000"`
	Country     *string `json:"country,omitempty" example:"México"`
	Email       *string `json:"email,omitempty" example:"contacto@empresa.com"`
	Phone       *string `json:"phone,omitempty" example:"5555551234"`
	IsActive    bool    `json:"is_active" example:"true"`
	CreatedAt   string  `json:"created_at" example:"2024-01-08T15:00:00Z"`
	UpdatedAt   string  `json:"updated_at" example:"2024-01-08T15:00:00Z"`
}

// ErrorResponse representa un error de la API
type ErrorResponse struct {
	Error string `json:"error" example:"error message"`
}

// ==================== Auth DTOs ====================

// RegisterRequest para registro de nuevos usuarios
type RegisterRequest struct {
	TenantID  string `json:"tenant_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	Email     string `json:"email" binding:"required,email" example:"user@example.com"`
	Password  string `json:"password" binding:"required,min=8" example:"securePassword123"`
	FirstName string `json:"first_name" binding:"required" example:"Juan"`
	LastName  string `json:"last_name" binding:"required" example:"Pérez"`
	Phone     string `json:"phone" example:"5551234567"`
}

// LoginRequest para inicio de sesión
// TenantID es opcional - si no se proporciona, el sistema buscará el usuario por email
// y usará el tenant principal del usuario
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email" example:"user@example.com"`
	Password string `json:"password" binding:"required" example:"securePassword123"`
	TenantID string `json:"tenant_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
}

// LoginResponse respuesta del login con tokens
type LoginResponse struct {
	AccessToken  string            `json:"access_token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken string            `json:"refresh_token,omitempty" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	User         UserResponse      `json:"user"`
	Companies    []CompanyResponse `json:"companies,omitempty"`
}

// CompanyResponse representa una empresa/tenant en las respuestas de la API
type CompanyResponse struct {
	ID               string                 `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name             string                 `json:"name" example:"Mi Empresa"`
	Slug             string                 `json:"slug,omitempty" example:"mi-empresa"`
	Domain           *string                `json:"domain,omitempty" example:"miempresa.com"`
	LogoURL          *string                `json:"logo_url,omitempty" example:"https://example.com/logo.png"`
	PrimaryColor     *string                `json:"primary_color,omitempty" example:"#1976D2"`
	SecondaryColor   *string                `json:"secondary_color,omitempty" example:"#424242"`
	TertiaryColor    *string                `json:"tertiary_color,omitempty" example:"#757575"`
	IsActive         bool                   `json:"is_active" example:"true"`
	Settings         map[string]interface{} `json:"settings,omitempty"`
	SubscriptionPlan *string                `json:"subscription_plan,omitempty" example:"premium"`
	MaxUsers         *int32                 `json:"max_users,omitempty" example:"50"`
	MaxClients       *int32                 `json:"max_clients,omitempty" example:"200"`
}

// RefreshTokenRequest para renovar token
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

// ==================== User DTOs ====================

// UserResponse representa un usuario en las respuestas de la API
type UserResponse struct {
	ID            string         `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	TenantID      string         `json:"tenant_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	TenantName    *string        `json:"tenant_name,omitempty" example:"Empresa Demo"`
	Email         string         `json:"email" example:"user@example.com"`
	FirstName     string         `json:"first_name" example:"Juan"`
	LastName      string         `json:"last_name" example:"Pérez"`
	Phone         *string        `json:"phone,omitempty" example:"5551234567"`
	AvatarUrl     *string        `json:"avatar_url,omitempty" example:"https://example.com/avatar.jpg"`
	IsActive      bool           `json:"is_active" example:"true"`
	EmailVerified bool           `json:"email_verified" example:"true"`
	LastLoginAt   *string        `json:"last_login_at,omitempty" example:"2024-01-08T15:00:00Z"`
	CreatedAt     string         `json:"created_at" example:"2024-01-08T15:00:00Z"`
	Roles         []RoleResponse `json:"roles,omitempty"`
}

// UpdateUserRequest para actualizar información de usuario
type UpdateUserRequest struct {
	FirstName string  `json:"first_name" binding:"required" example:"Juan"`
	LastName  string  `json:"last_name" binding:"required" example:"Pérez"`
	Phone     *string `json:"phone" example:"5551234567"`
}

// UpdatePasswordRequest para cambiar la contraseña de un usuario
type UpdatePasswordRequest struct {
	Password string `json:"password" binding:"required,min=8" example:"NewSecurePass123"`
}

// AssignRoleRequest para asignar rol a usuario
type AssignRoleRequest struct {
	RoleID string `json:"role_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
}

// ==================== Role DTOs ====================

// RoleResponse representa un rol en las respuestas de la API
type RoleResponse struct {
	ID          string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	TenantID    *string `json:"tenant_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name        string  `json:"name" example:"Administrador"`
	Description *string `json:"description,omitempty" example:"Rol con permisos administrativos"`
	IsSystem    bool    `json:"is_system" example:"false"`
	CreatedAt   string  `json:"created_at" example:"2024-01-08T15:00:00Z"`
}

// CreateRoleRequest para crear un nuevo rol
type CreateRoleRequest struct {
	Name        string  `json:"name" binding:"required" example:"Operador"`
	Description *string `json:"description" example:"Rol para operadores del sistema"`
	IsSystem    bool    `json:"is_system" example:"false"`
}

// UpdateRoleRequest para actualizar un rol existente
type UpdateRoleRequest struct {
	Name        string  `json:"name" binding:"required" example:"Operador"`
	Description *string `json:"description" example:"Rol para operadores del sistema"`
}

// PermissionResponse representa un permiso en las respuestas de la API
type PermissionResponse struct {
	ID          string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Code        string  `json:"code" example:"users.read"`
	Description *string `json:"description,omitempty" example:"Permite leer usuarios"`
	Module      *string `json:"module,omitempty" example:"users"`
	CreatedAt   string  `json:"created_at" example:"2024-01-08T15:00:00Z"`
}

// AssignPermissionRequest para asignar permiso a rol
type AssignPermissionRequest struct {
	PermissionID string `json:"permission_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
}

// ==================== Permission Management DTOs ====================

// CreatePermissionRequest para crear un nuevo permiso
type CreatePermissionRequest struct {
	Code        string  `json:"code" binding:"required" example:"inventory.read"`
	Description *string `json:"description" example:"Ver inventario"`
	Module      *string `json:"module" example:"inventory"`
	Scope       *string `json:"scope" example:"own"` // 'own', 'all', or nil
}

// ==================== Settings DTOs ====================

// TenantSettingsResponse configuración del tenant
type TenantSettingsResponse struct {
	ID               string                 `json:"id"`
	Name             string                 `json:"name"`
	Slug             string                 `json:"slug"`
	Domain           *string                `json:"domain,omitempty"`
	LogoURL          *string                `json:"logo_url,omitempty"`
	PrimaryColor     *string                `json:"primary_color,omitempty"`
	SecondaryColor   *string                `json:"secondary_color,omitempty"`
	TertiaryColor    *string                `json:"tertiary_color,omitempty"`
	IsActive         bool                   `json:"is_active"`
	Settings         map[string]interface{} `json:"settings"`
	SubscriptionPlan *string                `json:"subscription_plan,omitempty"`
	MaxUsers         *int32                 `json:"max_users,omitempty"`
	MaxClients       *int32                 `json:"max_clients,omitempty"`
	CreatedAt        string                 `json:"created_at"`
	UpdatedAt        string                 `json:"updated_at"`
}

// UpdateSettingsRequest para actualizar configuración
type UpdateSettingsRequest struct {
	Settings map[string]interface{} `json:"settings" binding:"required"`
}

// UpdateThemeRequest para actualizar tema visual
type UpdateThemeRequest struct {
	PrimaryColor   *string `json:"primary_color" example:"#1976D2"`
	SecondaryColor *string `json:"secondary_color" example:"#424242"`
	TertiaryColor  *string `json:"tertiary_color" example:"#757575"`
	LogoURL        *string `json:"logo_url" example:"https://example.com/logo.png"`
}

// ==================== Tenant Management DTOs ====================

// TenantResponse respuesta de tenant
type TenantResponse struct {
	ID               string                 `json:"id"`
	Name             string                 `json:"name"`
	Slug             string                 `json:"slug"`
	Domain           *string                `json:"domain,omitempty"`
	LogoURL          *string                `json:"logo_url,omitempty"`
	PrimaryColor     *string                `json:"primary_color,omitempty"`
	SecondaryColor   *string                `json:"secondary_color,omitempty"`
	TertiaryColor    *string                `json:"tertiary_color,omitempty"`
	IsActive         bool                   `json:"is_active"`
	Settings         map[string]interface{} `json:"settings"`
	SubscriptionPlan *string                `json:"subscription_plan,omitempty"`
	MaxUsers         *int32                 `json:"max_users,omitempty"`
	MaxClients       *int32                 `json:"max_clients,omitempty"`
	CreatedAt        string                 `json:"created_at"`
	UpdatedAt        string                 `json:"updated_at"`
}

// CreateTenantRequest para crear un nuevo tenant
type CreateTenantRequest struct {
	Name             string                 `json:"name" binding:"required" example:"Mi Empresa CCTV"`
	Slug             string                 `json:"slug" binding:"required" example:"mi-empresa"`
	Domain           *string                `json:"domain,omitempty" example:"miempresa.com"`
	LogoURL          *string                `json:"logo_url,omitempty" example:"https://example.com/logo.png"`
	PrimaryColor     *string                `json:"primary_color,omitempty" example:"#1976D2"`
	SecondaryColor   *string                `json:"secondary_color,omitempty" example:"#424242"`
	TertiaryColor    *string                `json:"tertiary_color,omitempty" example:"#757575"`
	Settings         map[string]interface{} `json:"settings,omitempty"`
	SubscriptionPlan *string                `json:"subscription_plan,omitempty" example:"premium"`
	MaxUsers         *int32                 `json:"max_users,omitempty" example:"50"`
	MaxClients       *int32                 `json:"max_clients,omitempty" example:"200"`
}

// UpdateTenantRequest para actualizar tenant
type UpdateTenantRequest struct {
	Name             string                 `json:"name" binding:"required" example:"Mi Empresa CCTV"`
	Domain           *string                `json:"domain,omitempty" example:"miempresa.com"`
	LogoURL          *string                `json:"logo_url,omitempty" example:"https://example.com/logo.png"`
	PrimaryColor     *string                `json:"primary_color,omitempty" example:"#1976D2"`
	SecondaryColor   *string                `json:"secondary_color,omitempty" example:"#424242"`
	TertiaryColor    *string                `json:"tertiary_color,omitempty" example:"#757575"`
	Settings         map[string]interface{} `json:"settings,omitempty"`
	SubscriptionPlan *string                `json:"subscription_plan,omitempty" example:"premium"`
	MaxUsers         *int32                 `json:"max_users,omitempty" example:"50"`
	MaxClients       *int32                 `json:"max_clients,omitempty" example:"200"`
}

// TenantStatsResponse estadísticas de tenant
type TenantStatsResponse struct {
	TotalTenants  int64 `json:"total_tenants"`
	ActiveTenants int64 `json:"active_tenants"`
}

// ==================== Storage DTOs ====================

// FileResponse respuesta de archivo
type FileResponse struct {
	ID                string                 `json:"id"`
	TenantID          string                 `json:"tenant_id"`
	Filename          string                 `json:"filename"`
	OriginalFilename  string                 `json:"original_filename"`
	MimeType          string                 `json:"mime_type"`
	FileSize          int64                  `json:"file_size"`
	FileHash          *string                `json:"file_hash,omitempty"`
	StorageProvider   *string                `json:"storage_provider,omitempty"`
	StorageURL        *string                `json:"storage_url,omitempty"`
	Category          *string                `json:"category,omitempty"`
	RelatedEntityType *string                `json:"related_entity_type,omitempty"`
	RelatedEntityID   *string                `json:"related_entity_id,omitempty"`
	IsProcessed       bool                   `json:"is_processed"`
	Metadata          map[string]interface{} `json:"metadata"`
	UploadedBy        *string                `json:"uploaded_by,omitempty"`
	CreatedAt         string                 `json:"created_at"`
}

// UploadFileRequest para upload de archivos
type UploadFileRequest struct {
	Category          *string `form:"category" example:"ticket_evidence"`
	RelatedEntityType *string `form:"related_entity_type" example:"tickets"`
	RelatedEntityID   *string `form:"related_entity_id" example:"uuid"`
}

// FileStatsResponse estadísticas de archivos
type FileStatsResponse struct {
	TotalFiles       int64 `json:"total_files"`
	TotalStorageSize int64 `json:"total_storage_size_bytes"`
}

// StorageProviderResponse representa un proveedor de storage
type StorageProviderResponse struct {
	ID                  int32                  `json:"id"`
	ProviderName        string                 `json:"provider_name"`
	DisplayName         string                 `json:"display_name"`
	Description         *string                `json:"description,omitempty"`
	ProviderType        string                 `json:"provider_type"`
	IsActive            bool                   `json:"is_active"`
	SupportsCollections bool                   `json:"supports_collections"`
	ConfigurationSchema map[string]interface{} `json:"configuration_schema,omitempty"`
}

// StorageConfigurationResponse representa una configuración de storage
type StorageConfigurationResponse struct {
	ID                  string                 `json:"id"`
	TenantID            string                 `json:"tenant_id"`
	ProviderID          int32                  `json:"provider_id"`
	ProviderName        string                 `json:"provider_name"`
	ProviderDisplayName string                 `json:"provider_display_name"`
	ConfigName          string                 `json:"config_name"`
	IsDefault           bool                   `json:"is_default"`
	IsActive            bool                   `json:"is_active"`
	Host                *string                `json:"host,omitempty"`
	Port                *int32                 `json:"port,omitempty"`
	DatabaseName        *string                `json:"database_name,omitempty"`
	Username            *string                `json:"username,omitempty"`
	PasswordText        *string                `json:"password_text,omitempty"`
	ApiKey              *string                `json:"api_key,omitempty"`
	SecretKey           *string                `json:"secret_key,omitempty"`
	BaseUrl             *string                `json:"base_url,omitempty"`
	BucketName          *string                `json:"bucket_name,omitempty"`
	Region              *string                `json:"region,omitempty"`
	ProjectID           *string                `json:"project_id,omitempty"`
	AdditionalConfig    map[string]interface{} `json:"additional_config"`
	ModuleMappings      map[string]interface{} `json:"module_mappings"`
	CreatedAt           string                 `json:"created_at"`
	UpdatedAt           string                 `json:"updated_at"`
}

// CreateStorageConfigurationRequest para crear config de storage
type CreateStorageConfigurationRequest struct {
	ProviderID       int32                  `json:"provider_id" binding:"required"`
	ConfigName       string                 `json:"config_name" binding:"required"`
	IsDefault        bool                   `json:"is_default"`
	Host             *string                `json:"host,omitempty"`
	Port             *int32                 `json:"port,omitempty"`
	DatabaseName     *string                `json:"database_name,omitempty"`
	Username         *string                `json:"username,omitempty"`
	PasswordText     *string                `json:"password_text,omitempty"`
	ApiKey           *string                `json:"api_key,omitempty"`
	SecretKey        *string                `json:"secret_key,omitempty"`
	BaseUrl          *string                `json:"base_url,omitempty"`
	BucketName       *string                `json:"bucket_name,omitempty"`
	Region           *string                `json:"region,omitempty"`
	ProjectID        *string                `json:"project_id,omitempty"`
	AdditionalConfig map[string]interface{} `json:"additional_config,omitempty"`
}

// UpdateStorageConfigurationRequest para actualizar config de storage
type UpdateStorageConfigurationRequest struct {
	ConfigName       string                 `json:"config_name" binding:"required"`
	IsDefault        bool                   `json:"is_default"`
	IsActive         bool                   `json:"is_active"`
	Host             *string                `json:"host,omitempty"`
	Port             *int32                 `json:"port,omitempty"`
	DatabaseName     *string                `json:"database_name,omitempty"`
	Username         *string                `json:"username,omitempty"`
	PasswordText     *string                `json:"password_text,omitempty"`
	ApiKey           *string                `json:"api_key,omitempty"`
	SecretKey        *string                `json:"secret_key,omitempty"`
	BaseUrl          *string                `json:"base_url,omitempty"`
	BucketName       *string                `json:"bucket_name,omitempty"`
	Region           *string                `json:"region,omitempty"`
	ProjectID        *string                `json:"project_id,omitempty"`
	AdditionalConfig map[string]interface{} `json:"additional_config,omitempty"`
}

// ModuleStorageMappingResponse representa el mapeo de un módulo a storage
type ModuleStorageMappingResponse struct {
	ID               string   `json:"id"`
	ModuleName       string   `json:"module_name"`
	CollectionName   string   `json:"collection_name"`
	ConfigID         string   `json:"config_id"`
	ConfigName       *string  `json:"config_name,omitempty"`
	ProviderName     *string  `json:"provider_name,omitempty"`
	IsActive         bool     `json:"is_active"`
	MaxFileSizeMB    *int32   `json:"max_file_size_mb,omitempty"`
	AllowedFileTypes []string `json:"allowed_file_types,omitempty"`
	AutoResize       bool     `json:"auto_resize"`
	ThumbnailSizes   []int32  `json:"thumbnail_sizes,omitempty"`
}

// ==================== Intelligence DTOs ====================

// ModelConfigResponse respuesta de configuración de modelo
type ModelConfigResponse struct {
	ID                  string                 `json:"id"`
	TenantID            string                 `json:"tenant_id"`
	Name                string                 `json:"name"`
	Provider            string                 `json:"provider"`
	ModelName           string                 `json:"model_name"`
	APIEndpoint         *string                `json:"api_endpoint,omitempty"`
	APIVersion          *string                `json:"api_version,omitempty"`
	HasAPIKey           bool                   `json:"has_api_key"`
	DefaultTemperature  *float64               `json:"default_temperature,omitempty"`
	DefaultMaxTokens    *int32                 `json:"default_max_tokens,omitempty"`
	DefaultTopP         *float64               `json:"default_top_p,omitempty"`
	MaxTokensPerRequest *int32                 `json:"max_tokens_per_request,omitempty"`
	MaxRequestsPerDay   *int32                 `json:"max_requests_per_day,omitempty"`
	MaxRequestsPerHour  *int32                 `json:"max_requests_per_hour,omitempty"`
	MonthlyBudgetUSD    *float64               `json:"monthly_budget_usd,omitempty"`
	IsActive            bool                   `json:"is_active"`
	IsDefault           bool                   `json:"is_default"`
	Description         *string                `json:"description,omitempty"`
	Capabilities        map[string]interface{} `json:"capabilities"`
	Settings            map[string]interface{} `json:"settings,omitempty"`
	CreatedAt           string                 `json:"created_at"`
	UpdatedAt           string                 `json:"updated_at"`
}

// CreateModelConfigRequest para crear configuración de modelo
type CreateModelConfigRequest struct {
	Name                string                 `json:"name" binding:"required" example:"GPT-4 Principal"`
	Provider            string                 `json:"provider" binding:"required" example:"openai"`
	ModelName           string                 `json:"model_name" binding:"required" example:"gpt-4"`
	APIKeyEncrypted     *string                `json:"api_key_encrypted,omitempty" example:"encrypted_key"`
	APIEndpoint         *string                `json:"api_endpoint,omitempty" example:"https://api.openai.com/v1"`
	APIVersion          *string                `json:"api_version,omitempty" example:"2023-06-01"`
	DefaultTemperature  *float64               `json:"default_temperature,omitempty" example:"0.7"`
	DefaultMaxTokens    *int32                 `json:"default_max_tokens,omitempty" example:"1000"`
	DefaultTopP         *float64               `json:"default_top_p,omitempty" example:"0.9"`
	MaxTokensPerRequest *int32                 `json:"max_tokens_per_request,omitempty" example:"4000"`
	MaxRequestsPerDay   *int32                 `json:"max_requests_per_day,omitempty" example:"1000"`
	MaxRequestsPerHour  *int32                 `json:"max_requests_per_hour,omitempty" example:"100"`
	MonthlyBudgetUSD    *float64               `json:"monthly_budget_usd,omitempty" example:"100.00"`
	Description         *string                `json:"description,omitempty"`
	Capabilities        map[string]interface{} `json:"capabilities,omitempty"`
	Settings            map[string]interface{} `json:"settings,omitempty"`
	IsActive            *bool                  `json:"is_active,omitempty"`
	IsDefault           *bool                  `json:"is_default,omitempty"`
}

// UpdateModelConfigRequest para actualizar configuración de modelo
type UpdateModelConfigRequest struct {
	Name                string                 `json:"name" binding:"required" example:"Claude Principal"`
	Provider            string                 `json:"provider" binding:"required" example:"anthropic"`
	ModelName           string                 `json:"model_name" binding:"required" example:"claude-sonnet-4-20250514"`
	APIKeyEncrypted     *string                `json:"api_key_encrypted,omitempty" example:"new_key"`
	APIEndpoint         *string                `json:"api_endpoint,omitempty" example:"https://api.anthropic.com/v1"`
	APIVersion          *string                `json:"api_version,omitempty" example:"2023-06-01"`
	DefaultTemperature  *float64               `json:"default_temperature,omitempty" example:"0.2"`
	DefaultMaxTokens    *int32                 `json:"default_max_tokens,omitempty" example:"1200"`
	DefaultTopP         *float64               `json:"default_top_p,omitempty" example:"0.9"`
	MaxTokensPerRequest *int32                 `json:"max_tokens_per_request,omitempty" example:"4000"`
	MaxRequestsPerDay   *int32                 `json:"max_requests_per_day,omitempty" example:"1000"`
	MaxRequestsPerHour  *int32                 `json:"max_requests_per_hour,omitempty" example:"100"`
	MonthlyBudgetUSD    *float64               `json:"monthly_budget_usd,omitempty" example:"100.00"`
	Description         *string                `json:"description,omitempty"`
	Capabilities        map[string]interface{} `json:"capabilities,omitempty"`
	Settings            map[string]interface{} `json:"settings,omitempty"`
	IsActive            *bool                  `json:"is_active,omitempty"`
	IsDefault           *bool                  `json:"is_default,omitempty"`
}

// PromptTemplateResponse respuesta de template de prompt
type PromptTemplateResponse struct {
	ID                 string   `json:"id"`
	Name               string   `json:"name"`
	Category           string   `json:"category"`
	SystemPrompt       *string  `json:"system_prompt,omitempty"`
	UserPromptTemplate string   `json:"user_prompt_template"`
	Temperature        *float64 `json:"temperature,omitempty"`
	MaxTokens          *int32   `json:"max_tokens,omitempty"`
	ResponseFormat     *string  `json:"response_format,omitempty"`
	Description        *string  `json:"description,omitempty"`
	Variables          []string `json:"variables"`
	IsActive           bool     `json:"is_active"`
	Version            int32    `json:"version"`
	CreatedAt          string   `json:"created_at"`
}

// AnalysisResponse respuesta de análisis de IA
type AnalysisResponse struct {
	ID              string                 `json:"id"`
	AnalysisType    string                 `json:"analysis_type"`
	InputType       string                 `json:"input_type"`
	Result          map[string]interface{} `json:"result"`
	ConfidenceScore *float64               `json:"confidence_score,omitempty"`
	ModelUsed       *string                `json:"model_used,omitempty"`
	IsVerified      bool                   `json:"is_verified"`
	IsCorrect       *bool                  `json:"is_correct,omitempty"`
	CreatedAt       string                 `json:"created_at"`
}

// UsageStatsResponse estadísticas de uso de IA
type UsageStatsResponse struct {
	TotalAPICalls   int32                  `json:"total_api_calls"`
	SuccessfulCalls int32                  `json:"successful_calls"`
	FailedCalls     int32                  `json:"failed_calls"`
	TotalTokens     int64                  `json:"total_tokens"`
	TotalCostUSD    float64                `json:"total_cost_usd"`
	UsageByProvider map[string]interface{} `json:"usage_by_provider"`
}

// EmbeddingReindexResponse resultado de reindexación semántica
type EmbeddingReindexResponse struct {
	ModelConfigID string   `json:"model_config_id"`
	Provider      string   `json:"provider"`
	ModelName     string   `json:"model_name"`
	Processed     int      `json:"processed"`
	Indexed       int      `json:"indexed"`
	Failed        int      `json:"failed"`
	Errors        []string `json:"errors,omitempty"`
}

// SemanticModelSearchResponse resultado de búsqueda semántica de modelos
type SemanticModelSearchResponse struct {
	ModelID         string  `json:"model_id"`
	BrandName       string  `json:"brand_name"`
	ModelName       string  `json:"model_name"`
	PartNumber      *string `json:"part_number,omitempty"`
	DatasheetURL    *string `json:"datasheet_url,omitempty"`
	ImageURL        *string `json:"image_url,omitempty"`
	ContentSummary  *string `json:"content_summary,omitempty"`
	Distance        float64 `json:"distance"`
	SimilarityScore float64 `json:"similarity_score"`
}

// ==================== Menu DTOs ====================

// MenuItem representa un ítem del menú
type MenuItem struct {
	ID         string     `json:"id" example:"dashboard"`
	Label      string     `json:"label" example:"Dashboard"`
	Icon       string     `json:"icon" example:"dashboard"`
	Route      *string    `json:"route,omitempty" example:"/dashboard"`
	Permission *string    `json:"permission,omitempty" example:"dashboard.read"`
	Badge      *MenuBadge `json:"badge,omitempty"`
	Children   []MenuItem `json:"children,omitempty"`
	Order      int        `json:"order" example:"1"`
}

// MenuBadge representa un badge en el menú
type MenuBadge struct {
	Value string `json:"value" example:"5"`
	Color string `json:"color" example:"error"`
}

// MenuResponse respuesta completa del menú
type MenuResponse struct {
	Items    []MenuItem   `json:"items"`
	UserInfo MenuUserInfo `json:"user_info"`
}

// MenuUserInfo información del usuario en el menú
type MenuUserInfo struct {
	Name   string  `json:"name" example:"Admin Sistema"`
	Email  string  `json:"email" example:"admin@demo.com"`
	Avatar *string `json:"avatar,omitempty"`
	Role   string  `json:"role" example:"Administrador"`
}

// MenuItemResponse respuesta de item de menú
type MenuItemResponse struct {
	ID                 string                 `json:"id"`
	TenantID           *string                `json:"tenant_id,omitempty"`
	TemplateID         *string                `json:"template_id,omitempty"`
	Code               string                 `json:"code"`
	Label              string                 `json:"label"`
	Title              string                 `json:"title"`
	Icon               *string                `json:"icon,omitempty"`
	Route              *string                `json:"route,omitempty"`
	ParentID           *string                `json:"parent_id,omitempty"`
	RequiredPermission *string                `json:"required_permission,omitempty"`
	DisplayOrder       int32                  `json:"display_order"`
	OrderIndex         int32                  `json:"order_index"`
	IsActive           bool                   `json:"is_active"`
	IsVisible          bool                   `json:"is_visible"`
	BadgeText          *string                `json:"badge_text,omitempty"`
	BadgeColor         *string                `json:"badge_color,omitempty"`
	Description        *string                `json:"description,omitempty"`
	Metadata           map[string]interface{} `json:"metadata"`
	Children           []MenuItemResponse     `json:"children,omitempty"`
	CreatedAt          string                 `json:"created_at"`
}

// CreateMenuItemRequest para crear item de menú
type CreateMenuItemRequest struct {
	Code               string                 `json:"code" binding:"required" example:"new-module"`
	Label              string                 `json:"label" binding:"required" example:"Nuevo Módulo"`
	Icon               *string                `json:"icon,omitempty" example:"extension"`
	Route              *string                `json:"route,omitempty" example:"/new-module"`
	ParentID           *string                `json:"parent_id,omitempty"`
	RequiredPermission *string                `json:"required_permission,omitempty" example:"module.read"`
	DisplayOrder       *int32                 `json:"display_order,omitempty" example:"8"`
	IsVisible          *bool                  `json:"is_visible,omitempty" example:"true"`
	BadgeText          *string                `json:"badge_text,omitempty" example:"New"`
	BadgeColor         *string                `json:"badge_color,omitempty" example:"primary"`
	Description        *string                `json:"description,omitempty"`
	Metadata           map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateMenuItemRequest para actualizar item de menú
type UpdateMenuItemRequest struct {
	Label              *string                `json:"label,omitempty"`
	Title              *string                `json:"title,omitempty"`
	Icon               *string                `json:"icon,omitempty"`
	Route              *string                `json:"route,omitempty"`
	ParentID           *string                `json:"parent_id,omitempty"`
	TemplateID         *string                `json:"template_id,omitempty"`
	RequiredPermission *string                `json:"required_permission,omitempty"`
	DisplayOrder       *int32                 `json:"display_order,omitempty"`
	IsActive           *bool                  `json:"is_active,omitempty"`
	IsVisible          *bool                  `json:"is_visible,omitempty"`
	BadgeText          *string                `json:"badge_text,omitempty"`
	BadgeColor         *string                `json:"badge_color,omitempty"`
	Description        *string                `json:"description,omitempty"`
	Metadata           map[string]interface{} `json:"metadata,omitempty"`
}

// ReorderMenuItemsRequest para reordenar items
type ReorderMenuItemsRequest struct {
	Items []struct {
		ID    string `json:"id" binding:"required"`
		Order int32  `json:"order" binding:"required"`
	} `json:"items" binding:"required"`
}

// ==================== Ticket DTOs ====================

// TicketResponse representa un ticket en las respuestas de la API
type TicketResponse struct {
	ID             string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	TenantID       string  `json:"tenant_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	TicketNumber   string  `json:"ticket_number" example:"TKT-2026-00001"`
	ClientID       *string `json:"client_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	SiteID         *string `json:"site_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	EquipmentID    *string `json:"equipment_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Type           string  `json:"type" example:"corrective"`
	Priority       string  `json:"priority" example:"medium"`
	Status         string  `json:"status" example:"open"`
	Title          string  `json:"title" example:"Cámara sin señal en sucursal norte"`
	Description    *string `json:"description,omitempty" example:"La cámara de la entrada principal no muestra señal desde ayer"`
	AssignedTo     *string `json:"assigned_to,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	ReportedBy     *string `json:"reported_by,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	ClientName     *string `json:"client_name,omitempty" example:"Empresa ABC"`
	SiteName       *string `json:"site_name,omitempty" example:"Sucursal Norte"`
	AssignedToName *string `json:"assigned_to_name,omitempty" example:"Juan Técnico"`
	PolicyID       *string `json:"policy_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PolicyNumber   *string `json:"policy_number,omitempty" example:"POL-2026-0001"`
	CoverageStatus *string `json:"coverage_status,omitempty" example:"covered"`
	SlaStatus      *string `json:"sla_status,omitempty" example:"ok"`
	BreachedSla    *bool   `json:"breached_sla,omitempty" example:"false"`
	CreatedAt      string  `json:"created_at" example:"2026-01-19T15:00:00Z"`
	UpdatedAt      string  `json:"updated_at" example:"2026-01-19T15:00:00Z"`
}

type TicketSLAResponse struct {
	SlaPolicyName          *string `json:"sla_policy_name,omitempty"`
	SlaStatus              *string `json:"sla_status,omitempty"`
	DueResponseAt          *string `json:"due_response_at,omitempty"`
	DueResolutionAt        *string `json:"due_resolution_at,omitempty"`
	RespondedAt            *string `json:"responded_at,omitempty"`
	ResolvedAt             *string `json:"resolved_at,omitempty"`
	BreachedResponse       *bool   `json:"breached_response,omitempty"`
	BreachedResolution     *bool   `json:"breached_resolution,omitempty"`
	TimeToResponseMinutes  *int64  `json:"time_to_response_minutes,omitempty"`
	TimeToResolutionMinute *int64  `json:"time_to_resolution_minutes,omitempty"`
}

type TicketPolicyResponse struct {
	PolicyID       *string `json:"policy_id,omitempty"`
	PolicyNumber   *string `json:"policy_number,omitempty"`
	PolicyVendor   *string `json:"policy_vendor,omitempty"`
	ContractType   *string `json:"policy_contract_type,omitempty"`
	CoverageStatus *string `json:"coverage_status,omitempty"`
}

// TicketDetailResponse representa un ticket con información detallada
type TicketDetailResponse struct {
	ID              string                `json:"id"`
	TenantID        string                `json:"tenant_id"`
	TicketNumber    string                `json:"ticket_number"`
	ClientID        *string               `json:"client_id,omitempty"`
	SiteID          *string               `json:"site_id,omitempty"`
	Type            string                `json:"type"`
	Priority        string                `json:"priority"`
	Status          string                `json:"status"`
	Title           string                `json:"title"`
	Description     *string               `json:"description,omitempty"`
	AssignedTo      *string               `json:"assigned_to,omitempty"`
	ReportedBy      *string               `json:"reported_by,omitempty"`
	ClientName      *string               `json:"client_name,omitempty"`
	ClientEmail     *string               `json:"client_email,omitempty"`
	ClientPhone     *string               `json:"client_phone,omitempty"`
	SiteName        *string               `json:"site_name,omitempty"`
	SiteAddress     *string               `json:"site_address,omitempty"`
	SiteCity        *string               `json:"site_city,omitempty"`
	EquipmentSerial *string               `json:"equipment_serial,omitempty"`
	ReportedByName  *string               `json:"reported_by_name,omitempty"`
	ReportedByEmail *string               `json:"reported_by_email,omitempty"`
	AssignedToName  *string               `json:"assigned_to_name,omitempty"`
	AssignedToEmail *string               `json:"assigned_to_email,omitempty"`
	AssignedToPhone *string               `json:"assigned_to_phone,omitempty"`
	Policy          *TicketPolicyResponse `json:"policy,omitempty"`
	SLA             *TicketSLAResponse    `json:"sla,omitempty"`
	ScheduledDate   *string               `json:"scheduled_date,omitempty"`
	StartedAt       *string               `json:"started_at,omitempty"`
	CompletedAt     *string               `json:"completed_at,omitempty"`
	SlaHours        *int32                `json:"sla_hours,omitempty"`
	SlaDeadline     *string               `json:"sla_deadline,omitempty"`
	SlaMet          *bool                 `json:"sla_met,omitempty"`
	Resolution      *string               `json:"resolution,omitempty"`
	Rating          *int32                `json:"rating,omitempty"`
	RatingComment   *string               `json:"rating_comment,omitempty"`
	CreatedAt       string                `json:"created_at"`
	UpdatedAt       string                `json:"updated_at"`
}

// CreateTicketRequest para crear un nuevo ticket
type CreateTicketRequest struct {
	ClientID    string  `json:"client_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	SiteID      string  `json:"site_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
	PolicyID    *string `json:"policy_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	EquipmentID *string `json:"equipment_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Type        string  `json:"type" example:"corrective"` // corrective, preventive, installation, other
	Priority    string  `json:"priority" example:"medium"` // low, medium, high, urgent
	Title       string  `json:"title" binding:"required" example:"Cámara sin señal"`
	Description *string `json:"description,omitempty" example:"La cámara principal no muestra imagen"`
}

// UpdateTicketRequest para actualizar un ticket
type UpdateTicketRequest struct {
	Title         *string `json:"title,omitempty" example:"Cámara reparada"`
	Description   *string `json:"description,omitempty" example:"Se reemplazó el cable de video"`
	Priority      *string `json:"priority,omitempty" example:"high"`
	Type          *string `json:"type,omitempty" example:"corrective"`
	SiteID        *string `json:"site_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	EquipmentID   *string `json:"equipment_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	ScheduledDate *string `json:"scheduled_date,omitempty" example:"2026-01-25T10:00:00Z"`
}

// ChangeStatusRequest para cambiar el estado de un ticket
type ChangeStatusRequest struct {
	Status string  `json:"status" binding:"required" example:"in_progress"` // open, assigned, in_progress, pending_parts, pending_client, completed, closed, cancelled
	Reason *string `json:"reason,omitempty" example:"Cancelado por el cliente"`
}

// AssignTicketRequest para asignar un técnico a un ticket
type AssignTicketRequest struct {
	TechnicianID string `json:"technician_id" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
}

// TimelineEntryResponse representa una entrada del timeline de un ticket
type TimelineEntryResponse struct {
	ID          string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	EventType   string  `json:"event_type" example:"status_change"`
	Description *string `json:"description,omitempty" example:"Status changed from open to assigned"`
	UserName    *string `json:"user_name,omitempty" example:"Juan Admin"`
	OldValue    *string `json:"old_value,omitempty" example:"open"`
	NewValue    *string `json:"new_value,omitempty" example:"assigned"`
	CreatedAt   string  `json:"created_at" example:"2026-01-19T15:30:00Z"`
}

// CommentResponse representa un comentario en un ticket
type CommentResponse struct {
	ID         string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Comment    string  `json:"comment" example:"Se contactó al cliente para programar visita"`
	UserName   *string `json:"user_name,omitempty" example:"Juan Técnico"`
	IsInternal bool    `json:"is_internal" example:"false"`
	CreatedAt  string  `json:"created_at" example:"2026-01-19T16:00:00Z"`
}

// AddCommentRequest para agregar un comentario a un ticket
type AddCommentRequest struct {
	Comment    string `json:"comment" binding:"required" example:"Se programó visita para mañana a las 10:00"`
	IsInternal *bool  `json:"is_internal,omitempty" example:"false"`
}

// TicketStatsResponse estadísticas de tickets
type TicketStatsResponse struct {
	Total                int64 `json:"total" example:"150"`
	OpenCount            int64 `json:"open_count" example:"25"`
	AssignedCount        int64 `json:"assigned_count" example:"15"`
	InProgressCount      int64 `json:"in_progress_count" example:"20"`
	PendingPartsCount    int64 `json:"pending_parts_count" example:"5"`
	PendingApprovalCount int64 `json:"pending_approval_count" example:"3"`
	OnHoldCount          int64 `json:"on_hold_count" example:"2"`
	CompletedCount       int64 `json:"completed_count" example:"50"`
	CancelledCount       int64 `json:"cancelled_count" example:"2"`
	CriticalCount        int64 `json:"critical_count" example:"8"`
	HighCount            int64 `json:"high_count" example:"20"`
	PreventiveCount      int64 `json:"preventive_count" example:"40"`
	CorrectiveCount      int64 `json:"corrective_count" example:"110"`
}

// TechnicianWorkloadResponse carga de trabajo de un técnico
type TechnicianWorkloadResponse struct {
	TechnicianID    string  `json:"technician_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	TechnicianName  *string `json:"technician_name,omitempty" example:"Juan Técnico"`
	TechnicianEmail *string `json:"technician_email,omitempty" example:"juan@empresa.com"`
	ActiveTickets   int64   `json:"active_tickets" example:"5"`
	UrgentTickets   int64   `json:"urgent_tickets" example:"1"`
	HighTickets     int64   `json:"high_tickets" example:"2"`
}

// ==================== Inventory DTOs ====================

// NvrServerResponse represents an NVR server in API responses
type NvrServerResponse struct {
	ID                     string   `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	TenantID               string   `json:"tenant_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	SiteID                 *string  `json:"site_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	BrandID                *string  `json:"brand_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name                   string   `json:"name" example:"NVR Principal Sucursal Norte"`
	Code                   *string  `json:"code,omitempty" example:"NVR-001"`
	VmsServerID            *string  `json:"vms_server_id,omitempty" example:"server123"`
	Edition                *string  `json:"edition,omitempty" example:"Professional"`
	VmsVersion             *string  `json:"vms_version,omitempty" example:"5.1.0"`
	CameraChannels         *int32   `json:"camera_channels,omitempty" example:"32"`
	TpvChannels            *int32   `json:"tpv_channels,omitempty" example:"4"`
	LprChannels            *int32   `json:"lpr_channels,omitempty" example:"2"`
	IntegrationConnections *int32   `json:"integration_connections,omitempty" example:"10"`
	Model                  *string  `json:"model,omitempty" example:"Dell PowerEdge R640"`
	ServiceTag             *string  `json:"service_tag,omitempty" example:"ABC1234"`
	ServiceCode            *string  `json:"service_code,omitempty" example:"XYZ5678"`
	Processor              *string  `json:"processor,omitempty" example:"Intel Xeon Gold 6230"`
	RamGB                  *int32   `json:"ram_gb,omitempty" example:"64"`
	OsName                 *string  `json:"os_name,omitempty" example:"Windows Server 2019"`
	SystemType             *string  `json:"system_type,omitempty" example:"x64"`
	IPAddress              *string  `json:"ip_address,omitempty" example:"192.168.1.100"`
	SubnetMask             *string  `json:"subnet_mask,omitempty" example:"255.255.255.0"`
	Gateway                *string  `json:"gateway,omitempty" example:"192.168.1.1"`
	MacAddress             *string  `json:"mac_address,omitempty" example:"00:1A:2B:3C:4D:5E"`
	TotalStorageTB         *float64 `json:"total_storage_tb,omitempty" example:"24.0"`
	RecordingDays          *int32   `json:"recording_days,omitempty" example:"30"`
	LaunchDate             *string  `json:"launch_date,omitempty" example:"2024-01-15"`
	WarrantyExpiryDate     *string  `json:"warranty_expiry_date,omitempty" example:"2027-01-15"`
	InstallationDate       *string  `json:"installation_date,omitempty" example:"2024-02-01"`
	Status                 *string  `json:"status,omitempty" example:"active"`
	Notes                  *string  `json:"notes,omitempty" example:"Servidor principal de grabación"`
	IsActive               bool     `json:"is_active" example:"true"`
	CreatedAt              string   `json:"created_at" example:"2024-01-08T15:00:00Z"`
	UpdatedAt              string   `json:"updated_at" example:"2024-01-08T15:00:00Z"`
}

// NvrServerStatsResponse statistics about NVR servers
type NvrServerStatsResponse struct {
	TotalServers    int64   `json:"total_servers" example:"15"`
	ActiveServers   int64   `json:"active_servers" example:"14"`
	InactiveServers int64   `json:"inactive_servers" example:"1"`
	TotalCameras    int64   `json:"total_cameras" example:"450"`
	TotalStorageTB  float64 `json:"total_storage_tb" example:"360.5"`
}

// NvrLicenseResponse represents a license for an NVR server
type NvrLicenseResponse struct {
	ID          string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	NvrServerID string  `json:"nvr_server_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	LicenseType *string `json:"license_type,omitempty" example:"professional"`
	LicenseKey  *string `json:"license_key,omitempty" example:"XXXX-XXXX-XXXX-XXXX"`
	Channels    *int32  `json:"channels,omitempty" example:"32"`
	ExpiryDate  *string `json:"expiry_date,omitempty" example:"2026-12-31"`
	IsActive    bool    `json:"is_active" example:"true"`
	CreatedAt   string  `json:"created_at" example:"2024-01-08T15:00:00Z"`
}

// CameraResponse represents a camera in API responses
type CameraResponse struct {
	ID                  string   `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	TenantID            string   `json:"tenant_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	NvrServerID         *string  `json:"nvr_server_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	SiteID              *string  `json:"site_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	AreaID              *string  `json:"area_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	ModelID             *string  `json:"model_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Consecutive         *int32   `json:"consecutive,omitempty" example:"1"`
	Name                string   `json:"name" example:"CAM-001 Entrada Principal"`
	Code                *string  `json:"code,omitempty" example:"CAM-001"`
	CameraType          *string  `json:"camera_type,omitempty" example:"dome"`
	CameraModelName     *string  `json:"camera_model_name,omitempty" example:"Hikvision DS-2CD2143G2-IU"`
	Generation          *string  `json:"generation,omitempty" example:"IP Gen 2"`
	IPAddress           *string  `json:"ip_address,omitempty" example:"192.168.1.101"`
	MacAddress          *string  `json:"mac_address,omitempty" example:"00:1A:2B:3C:4D:5F"`
	Resolution          *string  `json:"resolution,omitempty" example:"4MP"`
	Megapixels          *float64 `json:"megapixels,omitempty" example:"4.0"`
	IPS                 *int32   `json:"ips,omitempty" example:"25"`
	BitrateKbps         *int32   `json:"bitrate_kbps,omitempty" example:"4096"`
	Quality             *int32   `json:"quality,omitempty" example:"80"`
	FirmwareVersion     *string  `json:"firmware_version,omitempty" example:"5.6.3"`
	SerialNumber        *string  `json:"serial_number,omitempty" example:"DS2CD2143G2IU123456"`
	Area                *string  `json:"area,omitempty" example:"Entrada"`
	Zone                *string  `json:"zone,omitempty" example:"Zona A"`
	LocationDescription *string  `json:"location_description,omitempty" example:"Puerta principal de acceso"`
	Project             *string  `json:"project,omitempty" example:"Proyecto Seguridad 2024"`
	HasCounting         *bool    `json:"has_counting,omitempty" example:"true"`
	CountingEnabled     *bool    `json:"counting_enabled,omitempty" example:"true"`
	Status              *string  `json:"status,omitempty" example:"active"`
	Notes               *string  `json:"notes,omitempty" example:"Cámara de alta resolución"`
	Comments            *string  `json:"comments,omitempty" example:"Instalada en enero 2024"`
	IsActive            bool     `json:"is_active" example:"true"`
	CreatedAt           string   `json:"created_at" example:"2024-01-08T15:00:00Z"`
	UpdatedAt           string   `json:"updated_at" example:"2024-01-08T15:00:00Z"`
}

// CameraStatsResponse statistics about cameras
type CameraStatsResponse struct {
	TotalCameras    int64 `json:"total_cameras" example:"450"`
	ActiveCameras   int64 `json:"active_cameras" example:"440"`
	InactiveCameras int64 `json:"inactive_cameras" example:"10"`
	DomeCameras     int64 `json:"dome_cameras" example:"200"`
	BulletCameras   int64 `json:"bullet_cameras" example:"150"`
	PtzCameras      int64 `json:"ptz_cameras" example:"50"`
	CountingEnabled int64 `json:"counting_enabled" example:"30"`
}

// ExecutiveSummaryResponse represents executive summary for inventory
type ExecutiveSummaryResponse struct {
	TotalNvrServers      int64   `json:"total_nvr_servers" example:"15"`
	ActiveNvrServers     int64   `json:"active_nvr_servers" example:"14"`
	TotalCameras         int64   `json:"total_cameras" example:"450"`
	ActiveCameras        int64   `json:"active_cameras" example:"440"`
	TotalStorageTB       float64 `json:"total_storage_tb" example:"360.5"`
	AverageRecordingDays int64   `json:"average_recording_days" example:"25"`
	TotalClients         int64   `json:"total_clients" example:"50"`
	TotalSites           int64   `json:"total_sites" example:"75"`
}

// ==================== Import DTOs ====================

// ImportBatchResponse represents an import batch in API responses
type ImportBatchResponse struct {
	ID             string                 `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	TenantID       string                 `json:"tenant_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	BatchName      string                 `json:"batch_name" example:"Import Cameras Q1 2024"`
	SourceType     string                 `json:"source_type" example:"excel"`
	SourceFilename *string                `json:"source_filename,omitempty" example:"cameras_import.xlsx"`
	TargetTable    string                 `json:"target_table" example:"cameras"`
	ColumnMapping  map[string]interface{} `json:"column_mapping"`
	TotalRows      *int32                 `json:"total_rows,omitempty" example:"150"`
	ProcessedRows  *int32                 `json:"processed_rows,omitempty" example:"145"`
	SuccessRows    *int32                 `json:"success_rows,omitempty" example:"140"`
	ErrorRows      *int32                 `json:"error_rows,omitempty" example:"5"`
	Status         string                 `json:"status" example:"completed"`
	ErrorMessage   *string                `json:"error_message,omitempty" example:""`
	StartedAt      *string                `json:"started_at,omitempty" example:"2024-01-20T10:00:00Z"`
	CompletedAt    *string                `json:"completed_at,omitempty" example:"2024-01-20T10:05:00Z"`
	CreatedBy      *string                `json:"created_by,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CreatedAt      string                 `json:"created_at" example:"2024-01-20T09:55:00Z"`
}

// ImportBatchDetailResponse represents detailed import batch info
type ImportBatchDetailResponse struct {
	Batch      ImportBatchResponse `json:"batch"`
	ItemCounts map[string]int64    `json:"item_counts"`
}

// ImportBatchItemResponse represents an item in an import batch
type ImportBatchItemResponse struct {
	ID           string                 `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	BatchID      string                 `json:"batch_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	RowNumber    int32                  `json:"row_number" example:"1"`
	RowData      map[string]interface{} `json:"row_data"`
	Status       string                 `json:"status" example:"success"`
	ErrorMessage *string                `json:"error_message,omitempty" example:""`
	CreatedID    *string                `json:"created_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	ProcessedAt  *string                `json:"processed_at,omitempty" example:"2024-01-20T10:01:00Z"`
	CreatedAt    string                 `json:"created_at" example:"2024-01-20T09:55:00Z"`
}

// ImportStatsResponse statistics about import batches
type ImportStatsResponse struct {
	TotalBatches      int64 `json:"total_batches" example:"25"`
	PendingBatches    int64 `json:"pending_batches" example:"3"`
	ProcessingBatches int64 `json:"processing_batches" example:"1"`
	CompletedBatches  int64 `json:"completed_batches" example:"20"`
	FailedBatches     int64 `json:"failed_batches" example:"1"`
	TotalRowsImported int64 `json:"total_rows_imported" example:"5000"`
}

// ValidationResultResponse represents validation results
type ValidationResultResponse struct {
	Valid    bool                     `json:"valid" example:"true"`
	Errors   []map[string]interface{} `json:"errors"`
	Warnings []map[string]interface{} `json:"warnings"`
}
