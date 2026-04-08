// API response types — derived from runtime verification 2026-04-05

// POST /auth/login response
export interface LoginResponse {
  access_token: string;
  companies: Company[];
  user: User;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  avatar_url?: string | null;
  first_name: string;
  last_name: string;
  phone?: string | null;
  is_active: boolean;
  email_verified: boolean;
  last_login_at?: string | null;
  created_at: string;
}

// GET /auth/me response
export interface MeResponse {
  user: User;
  companies: Company[];
  roles: Role[];
  permissions: Permission[];
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  is_active: boolean;
  settings?: Record<string, unknown>;
  subscription_plan?: string;
  max_users?: number;
  max_clients?: number;
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  code: string;
  description: string;
  module: string;
  created_at: string;
}

// GET /menu response
export interface MenuResponse {
  items: MenuItem[];
  user_info?: MenuUserInfo;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string | null;
  permission?: string | null;
  badge?: MenuBadge | null;
  order: number;
  children?: MenuItem[];
}

export interface MenuBadge {
  value: string;
  color: string;
}

export interface MenuUserInfo {
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
}

// GET /settings response
export interface SettingsResponse {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  secondary_color: string;
  tertiary_color: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  subscription_plan: string;
  max_users: number;
  max_clients: number;
  created_at: string;
  updated_at: string;
}

// --- Tenants (Fase 2) ---

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  subscription_plan?: string;
  max_users?: number;
  max_clients?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  settings?: Record<string, unknown>;
  subscription_plan?: string;
  max_users?: number;
  max_clients?: number;
}

export interface UpdateTenantRequest {
  name: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  settings?: Record<string, unknown>;
  subscription_plan?: string;
  max_users?: number;
  max_clients?: number;
}

export interface TenantStats {
  total_tenants: number;
  active_tenants: number;
}

export interface MenuTemplate {
  id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  tenant_count: number;
  created_at: string;
}

export interface MenuTenantBasic {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
}

export interface AdminMenuItem {
  id: string;
  tenant_id?: string | null;
  template_id?: string | null;
  code: string;
  label: string;
  title: string;
  icon?: string | null;
  route?: string | null;
  parent_id?: string | null;
  required_permission?: string | null;
  display_order: number;
  order_index: number;
  is_active: boolean;
  is_visible: boolean;
  badge_text?: string | null;
  badge_color?: string | null;
  description?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  template_count: number;
}

export interface TemplateItemAssignment {
  id: string;
  template_id: string;
  menu_item_id: string;
  display_order: number;
  is_visible: boolean;
  item_code: string;
  item_label: string;
  item_icon: string;
  item_route: string;
}

export interface CreateMenuTemplateRequest {
  name: string;
  description?: string;
}

export interface UpdateMenuTemplateRequest extends CreateMenuTemplateRequest {}

// --- Clients (Fase 2) ---

export interface Client {
  id: string;
  tenant_id: string;
  company_name: string;
  legal_name?: string;
  rfc?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  company_name: string;
  legal_name?: string;
  rfc?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  email?: string;
  phone?: string;
}

// --- Sites / Floor Plans (Fase 2) ---

export interface SiteListItem {
  id: string;
  name: string;
  client_name?: string;
  address?: string;
  city?: string;
  state?: string;
  camera_count: number;
  nvr_count: number;
  has_floor_plan: boolean;
  floor_plan_name?: string;
  updated_at?: string;
}

// --- NVR Servers (Fase 3) ---

export interface NvrServer {
  id: string;
  tenant_id: string;
  site_id?: string;
  brand_id?: string;
  name: string;
  code?: string;
  vms_server_id?: string;
  edition?: string;
  vms_version?: string;
  camera_channels?: number;
  tpv_channels?: number;
  lpr_channels?: number;
  integration_connections?: number;
  model?: string;
  service_tag?: string;
  service_code?: string;
  processor?: string;
  ram_gb?: number;
  os_name?: string;
  system_type?: string;
  ip_address?: string;
  subnet_mask?: string;
  gateway?: string;
  mac_address?: string;
  total_storage_tb?: number;
  recording_days?: number;
  launch_date?: string;
  warranty_expiry_date?: string;
  installation_date?: string;
  status?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNvrRequest {
  site_id?: string;
  brand_id?: string;
  name: string;
  code?: string;
  vms_server_id?: string;
  edition?: string;
  vms_version?: string;
  camera_channels?: number;
  tpv_channels?: number;
  lpr_channels?: number;
  integration_connections?: number;
  model?: string;
  service_tag?: string;
  service_code?: string;
  processor?: string;
  ram_gb?: number;
  os_name?: string;
  system_type?: string;
  ip_address?: string;
  subnet_mask?: string;
  gateway?: string;
  mac_address?: string;
  total_storage_tb?: number;
  recording_days?: number;
  launch_date?: string;
  warranty_expiry_date?: string;
  installation_date?: string;
  status?: string;
  notes?: string;
}

export interface NvrStats {
  total_servers: number;
  active_servers: number;
  inactive_servers: number;
  total_cameras: number;
  total_storage_tb: number;
}

// --- Cameras (Fase 3) ---

export interface Camera {
  id: string;
  tenant_id: string;
  nvr_server_id?: string;
  site_id?: string;
  area_id?: string;
  model_id?: string;
  consecutive?: number;
  name: string;
  code?: string;
  camera_type?: string;
  camera_model_name?: string;
  generation?: string;
  ip_address?: string;
  mac_address?: string;
  resolution?: string;
  megapixels?: number;
  ips?: number;
  bitrate_kbps?: number;
  quality?: number;
  firmware_version?: string;
  serial_number?: string;
  area?: string;
  zone?: string;
  location_description?: string;
  project?: string;
  has_counting?: boolean;
  counting_enabled?: boolean;
  status?: string;
  notes?: string;
  comments?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCameraRequest {
  nvr_server_id?: string;
  site_id?: string;
  area_id?: string;
  model_id?: string;
  consecutive?: number;
  name: string;
  code?: string;
  camera_type?: string;
  camera_model_name?: string;
  generation?: string;
  ip_address?: string;
  mac_address?: string;
  resolution?: string;
  megapixels?: number;
  ips?: number;
  bitrate_kbps?: number;
  quality?: number;
  firmware_version?: string;
  serial_number?: string;
  area?: string;
  zone?: string;
  location_description?: string;
  project?: string;
  has_counting?: boolean;
  counting_enabled?: boolean;
  status?: string;
  notes?: string;
  comments?: string;
}

export interface CameraStats {
  total_cameras: number;
  active_cameras: number;
  inactive_cameras: number;
  dome_cameras: number;
  bullet_cameras: number;
  ptz_cameras: number;
  counting_enabled: number;
}

// --- Inventory Summary (Fase 3) ---

export interface InventorySummary {
  total_nvr_servers: number;
  active_nvr_servers: number;
  total_cameras: number;
  active_cameras: number;
  total_storage_tb: number;
  average_recording_days: number;
  total_clients: number;
  total_sites: number;
}

export interface InventoryDashboardStats {
  totalNvrs: number;
  activeNvrs: number;
  totalCameras: number;
  activeCameras: number;
  totalStorageTb: number;
}

// --- Import (Fase 3) ---

export interface ImportBatch {
  id: string;
  tenant_id: string;
  batch_name: string;
  source_type: string;
  source_filename?: string;
  target_table: string;
  column_mapping: Record<string, unknown>;
  total_rows?: number;
  processed_rows?: number;
  success_rows?: number;
  error_rows?: number;
  status: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
}

export interface ImportBatchItem {
  id: string;
  batch_id: string;
  row_number: number;
  row_data: Record<string, unknown>;
  status: string;
  error_message?: string;
  created_id?: string;
  processed_at?: string;
  created_at: string;
}

export interface ImportStats {
  total_batches: number;
  pending_batches: number;
  processing_batches: number;
  completed_batches: number;
  failed_batches: number;
  total_rows_imported: number;
}

export interface ImportAssistantAnalysisResponse {
  template_name?: string;
  confidence?: number;
  mode?: string;
  suggested_targets?: string[];
  findings?: string[];
  recommended_mappings?: Record<string, Record<string, string>>;
  analysis_id?: string;
  model_used?: string;
}

// ──── Tickets ────

export interface Ticket {
  id: string;
  tenant_id: string;
  ticket_number: string;
  client_id?: string;
  site_id?: string;
  equipment_id?: string;
  type: string;
  priority: string;
  status: string;
  title: string;
  description?: string;
  assigned_to?: string;
  reported_by?: string;
  client_name?: string;
  site_name?: string;
  assigned_to_name?: string;
  policy_id?: string;
  policy_number?: string;
  coverage_status?: string;
  sla_status?: string;
  breached_sla?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketSLA {
  sla_policy_name?: string;
  sla_status?: string;
  due_response_at?: string;
  due_resolution_at?: string;
  responded_at?: string;
  resolved_at?: string;
  breached_response?: boolean;
  breached_resolution?: boolean;
  time_to_response_minutes?: number;
  time_to_resolution_minutes?: number;
}

export interface TicketPolicy {
  policy_id?: string;
  policy_number?: string;
  policy_vendor?: string;
  policy_contract_type?: string;
  coverage_status?: string;
}

export interface TicketDetail extends Omit<Ticket, 'client_name' | 'site_name' | 'assigned_to_name'> {
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  site_name?: string;
  site_address?: string;
  site_city?: string;
  equipment_serial?: string;
  reported_by_name?: string;
  reported_by_email?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  assigned_to_phone?: string;
  policy?: TicketPolicy;
  sla?: TicketSLA;
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  sla_hours?: number;
  sla_deadline?: string;
  sla_met?: boolean;
  resolution?: string;
  rating?: number;
  rating_comment?: string;
}

export interface CreateTicketRequest {
  client_id: string;
  site_id: string;
  policy_id?: string;
  equipment_id?: string;
  type: string;
  priority: string;
  title: string;
  description?: string;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  priority?: string;
  type?: string;
  site_id?: string;
  equipment_id?: string;
  scheduled_date?: string;
}

export interface TimelineEntry {
  id: string;
  event_type: string;
  description?: string;
  user_name?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface TicketComment {
  id: string;
  comment: string;
  user_name?: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketStats {
  total: number;
  open_count: number;
  assigned_count: number;
  in_progress_count: number;
  pending_parts_count: number;
  pending_approval_count: number;
  on_hold_count: number;
  completed_count: number;
  cancelled_count: number;
  critical_count: number;
  high_count: number;
  preventive_count: number;
  corrective_count: number;
}

export interface TechnicianWorkload {
  technician_id: string;
  technician_name?: string;
  technician_email?: string;
  active_tickets: number;
  urgent_tickets: number;
  high_tickets: number;
}

// ──── Policies ────

export interface Policy {
  id: string;
  tenant_id: string;
  policy_number: string;
  client_id: string;
  site_id?: string;
  status: string;
  start_date: string;
  end_date: string;
  monthly_payment: number;
  payment_day?: number;
  notes?: string;
  contract_url?: string;
  vendor?: string;
  contract_type?: string;
  annual_value?: number;
  client_name?: string;
  site_name?: string;
  coverage_json?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PolicyAsset {
  id: string;
  equipment_id?: string;
  nvr_server_id?: string;
  camera_id?: string;
  equipment_serial?: string;
  nvr_name?: string;
  camera_name?: string;
  notes?: string;
  created_at: string;
}

export interface PolicyDetail extends Policy {
  assets?: PolicyAsset[];
}

export interface CreatePolicyRequest {
  policy_number: string;
  client_id: string;
  site_id?: string;
  coverage_plan_id?: string;
  status?: string;
  start_date: string;
  end_date: string;
  monthly_payment: number;
  payment_day?: number;
  notes?: string;
  terms_accepted?: boolean;
  contract_url?: string;
  vendor?: string;
  contract_type?: string;
  annual_value?: number;
  coverage_json?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdatePolicyRequest extends Partial<CreatePolicyRequest> {}

// ──── SLA ────

export interface SlaPolicy {
  id: string;
  tenant_id: string;
  name: string;
  ticket_priority?: string;
  ticket_type?: string;
  response_time_hours: number;
  resolution_time_hours: number;
  is_default: boolean;
  is_active: boolean;
  business_hours?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSlaPolicyRequest {
  name: string;
  ticket_priority?: string;
  ticket_type?: string;
  response_time_hours: number;
  resolution_time_hours: number;
  is_default?: boolean;
  is_active?: boolean;
  business_hours?: Record<string, unknown>;
}

export interface UpdateSlaPolicyRequest extends Partial<CreateSlaPolicyRequest> {}

// ──── Dashboard (camelCase from backend) ────

export interface DashboardSummary {
  openTickets: number;
  criticalTickets: number;
  slaCompliancePct: number;
  slaOkTickets: number;
  slaAtRiskTickets: number;
  slaBreachedTickets: number;
  activeClients: number;
  activePolicies: number;
  policiesExpiringSoon: number;
  overdueAmount: number;
  currentMonthRevenue: number;
  activeUsers: number;
  usersOnlineToday: number;
  activeNvrs: number;
  activeCameras: number;
  totalStorageTb: number;
  totalFileSizeBytes: number;
}

export interface DashboardTicketStats {
  openCount: number;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  criticalCount: number;
  highPriorityCount: number;
  preventiveCount: number;
  correctiveCount: number;
  emergencyCount: number;
  totalCount: number;
  slaMetCount: number;
  slaMissedCount: number;
}

export interface TicketTrend {
  date: string;
  opened: number;
  completed: number;
  total: number;
}

export interface PolicyStats {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  suspendedPolicies: number;
  expiringSoon: number;
  totalMonthlyRevenue: number;
}

// ──── Users (admin) ────

export interface UserAdmin {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at?: string;
  created_at: string;
  roles?: RoleAdmin[];
}

export interface UpdateUserRequest {
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface UpdatePasswordRequest {
  password: string;
}

export interface AssignRoleRequest {
  role_id: string;
}

// ──── Roles ────

export interface RoleAdmin {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  is_system?: boolean;
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
}

// ──── Permissions ────

export interface PermissionAdmin {
  id: string;
  code: string;
  description?: string;
  module?: string;
  created_at: string;
}

export interface CreatePermissionRequest {
  code: string;
  description?: string;
  module?: string;
  scope?: string;
}

// ──── Settings ────

export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  subscription_plan?: string;
  max_users?: number;
  max_clients?: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsRequest {
  settings: Record<string, unknown>;
}

export interface UpdateThemeRequest {
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  logo_url?: string;
}

// ──── Storage ────

export interface FileItem {
  id: string;
  tenant_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_hash?: string;
  storage_provider?: string;
  storage_url?: string;
  category?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_processed: boolean;
  metadata?: Record<string, unknown>;
  uploaded_by?: string;
  created_at: string;
}

export interface FileStats {
  total_files: number;
  total_storage_size_bytes: number;
}

export interface StorageProvider {
  id: number;
  provider_name: string;
  display_name: string;
  description?: string;
  provider_type: string;
  is_active: boolean;
  supports_collections: boolean;
  configuration_schema?: Record<string, unknown>;
}

export interface StorageConfiguration {
  id: string;
  tenant_id: string;
  provider_id: number;
  provider_name: string;
  provider_display_name: string;
  config_name: string;
  is_default: boolean;
  is_active: boolean;
  host?: string;
  port?: number;
  database_name?: string;
  username?: string;
  password_text?: string;
  api_key?: string;
  secret_key?: string;
  base_url?: string;
  bucket_name?: string;
  region?: string;
  project_id?: string;
  additional_config?: Record<string, unknown>;
  module_mappings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateStorageConfigRequest {
  provider_id: number;
  config_name: string;
  is_default?: boolean;
  host?: string;
  port?: number;
  database_name?: string;
  username?: string;
  password_text?: string;
  api_key?: string;
  secret_key?: string;
  base_url?: string;
  bucket_name?: string;
  region?: string;
  project_id?: string;
  additional_config?: Record<string, unknown>;
}

export interface UpdateStorageConfigRequest extends Partial<CreateStorageConfigRequest> {
  is_active?: boolean;
}

// ──── Intelligence / AI ────

export interface ModelConfig {
  id: string;
  tenant_id: string;
  name: string;
  provider: string;
  model_name: string;
  api_endpoint?: string;
  api_version?: string;
  has_api_key: boolean;
  default_temperature?: number;
  default_max_tokens?: number;
  default_top_p?: number;
  max_tokens_per_request?: number;
  max_requests_per_day?: number;
  max_requests_per_hour?: number;
  monthly_budget_usd?: number;
  is_active: boolean;
  is_default: boolean;
  description?: string;
  capabilities?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateModelConfigRequest {
  name: string;
  provider: string;
  model_name: string;
  api_key_encrypted?: string;
  api_endpoint?: string;
  api_version?: string;
  default_temperature?: number;
  default_max_tokens?: number;
  default_top_p?: number;
  max_tokens_per_request?: number;
  max_requests_per_day?: number;
  max_requests_per_hour?: number;
  monthly_budget_usd?: number;
  description?: string;
  capabilities?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateModelConfigRequest extends Partial<CreateModelConfigRequest> {}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  system_prompt?: string;
  user_prompt_template: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: string;
  description?: string;
  variables: string[];
  is_active: boolean;
  version: number;
  created_at: string;
}

export interface Analysis {
  id: string;
  analysis_type: string;
  input_type: string;
  result: Record<string, unknown>;
  confidence_score?: number;
  model_used?: string;
  is_verified: boolean;
  is_correct?: boolean;
  created_at: string;
}

export interface UsageStats {
  total_api_calls: number;
  successful_calls: number;
  failed_calls: number;
  total_tokens: number;
  total_cost_usd: number;
  usage_by_provider: Record<string, unknown>;
}

export interface EmbeddingReindexResult {
  model_config_id: string;
  provider: string;
  model_name: string;
  processed: number;
  indexed: number;
  failed: number;
  errors?: string[];
}

// ──── Floor Plans (Fase 6) ────

export interface FloorPlanSite {
  id: string;
  name: string;
  client_name?: string;
  address?: string;
  city?: string;
  state?: string;
  camera_count: number;
  nvr_count: number;
  has_floor_plan: boolean;
  floor_plan_name?: string;
  updated_at?: string;
}

export interface FloorPlanSiteSummary {
  id: string;
  name: string;
  client_name?: string;
  address?: string;
  city?: string;
  state?: string;
  camera_count: number;
  nvr_count: number;
}

export interface FloorPlanRecord {
  id: string;
  site_id: string;
  name: string;
  version: number;
  canvas_width: number;
  canvas_height: number;
  grid_size: number;
  background_file_id?: string;
  document: FloorPlanDocument;
  created_at: string;
  updated_at: string;
}

export interface FloorPlanDocument {
  elements?: FloorPlanElement[];
  backgroundImage?: { url?: string };
  zones?: FloorPlanZone[];
}

export interface FloorPlanElement {
  id: string;
  type: "camera" | "nvr" | "label";
  entity_id?: string;
  name: string;
  x: number;
  y: number;
  rotation?: number;
  fov_angle?: number;
  fov_range?: number;
  icon?: string;
  color?: string;
}

export interface FloorPlanZone {
  id: string;
  name: string;
  points: { x: number; y: number }[];
  color?: string;
}

export interface FloorPlanDetailResponse {
  site: FloorPlanSiteSummary;
  floor_plan?: FloorPlanRecord;
}

export interface SaveFloorPlanRequest {
  name: string;
  version?: number;
  canvas_width: number;
  canvas_height: number;
  grid_size: number;
  background_file_id?: string;
  document: FloorPlanDocument;
}
