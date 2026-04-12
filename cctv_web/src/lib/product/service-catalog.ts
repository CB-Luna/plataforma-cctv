import type { Company, Tenant } from "@/types/api";

export type ProductServiceCode =
  | "cctv"
  | "operations"
  | "storage"
  | "intelligence"
  | "access_control"
  | "networking";

export type AssignableServiceCode = ProductServiceCode;
export type CommercialPlanCode = "basic" | "professional" | "enterprise" | "custom";
export type ServiceSupportStatus = "operational" | "partial" | "wip" | "future";
export type ProductProfileSource = "explicit" | "legacy_default";
export type TenantOnboardingStatus =
  | "ready"
  | "tenant_created_only"
  | "admin_created_pending_role"
  | "admin_creation_failed";

export interface ServiceScreen {
  key: string;
  label: string;
}

export interface ProductServiceDefinition {
  code: ProductServiceCode;
  label: string;
  shortLabel: string;
  description: string;
  status: ServiceSupportStatus;
  assignable: boolean;
  screens: ServiceScreen[];
  runtimeVisible: boolean;
}

export interface CommercialPlanPreset {
  code: CommercialPlanCode;
  label: string;
  description: string;
  suggestedServices: AssignableServiceCode[];
}

export interface TenantOnboardingSnapshot {
  status: TenantOnboardingStatus;
  adminEmail?: string;
  adminName?: string;
  adminUserId?: string;
  tenantId?: string;
  roleId?: string;
  roleName?: string;
  verificationSource?: "bootstrap" | "manual" | "unknown";
  verifiedAt?: string;
  notes?: string;
  updatedAt?: string;
}

export interface TenantProductProfile {
  packageProfile: CommercialPlanCode;
  enabledServices: ProductServiceCode[];
  disabledScreens: Partial<Record<ProductServiceCode, string[]>>;
  source: ProductProfileSource;
  onboarding: TenantOnboardingSnapshot;
}

export interface TenantReadinessMeta {
  status: TenantOnboardingStatus;
  label: string;
  tone: "default" | "secondary" | "destructive";
  description: string;
  evidenceLabel: string;
  isReady: boolean;
  issues: string[];
}

export const PRODUCT_SERVICE_DEFINITIONS: Record<ProductServiceCode, ProductServiceDefinition> = {
  cctv: {
    code: "cctv",
    label: "CCTV",
    shortLabel: "CCTV",
    description: "Inventario, camaras, NVR, planos, importacion, mapa y CAPEX del dominio CCTV.",
    status: "operational",
    assignable: true,
    screens: [
      { key: "inventory", label: "Inventario" },
      { key: "cameras", label: "Camaras" },
      { key: "camera-models", label: "Fichas tecnicas" },
      { key: "nvrs", label: "NVR" },
      { key: "floor-plans", label: "Planos" },
      { key: "map", label: "Mapa" },
      { key: "imports", label: "Importacion" },
      { key: "sites", label: "Sucursales" },
    ],
    runtimeVisible: true,
  },
  operations: {
    code: "operations",
    label: "Operaciones",
    shortLabel: "Ops",
    description: "Tickets, clientes, polizas SLA, niveles SLA y CAPEX/garantias para gestion operativa.",
    status: "operational",
    assignable: true,
    screens: [
      { key: "tickets", label: "Tickets" },
      { key: "clients", label: "Clientes" },
      { key: "policies", label: "Polizas y SLA" },
      { key: "sla", label: "Niveles SLA" },
      { key: "capex", label: "CAPEX / Garantias" },
    ],
    runtimeVisible: true,
  },
  storage: {
    code: "storage",
    label: "Storage",
    shortLabel: "Storage",
    description: "Capacidad parcial del producto: configuracion de almacenamiento y archivos del tenant activo dentro del shell actual.",
    status: "partial",
    assignable: true,
    screens: [{ key: "storage", label: "Configuracion > Storage" }],
    runtimeVisible: false,
  },
  intelligence: {
    code: "intelligence",
    label: "IA",
    shortLabel: "IA",
    description: "Capacidad parcial del producto: modelos, prompts y configuracion de inteligencia del tenant activo.",
    status: "partial",
    assignable: true,
    screens: [{ key: "ia", label: "Configuracion > IA" }],
    runtimeVisible: false,
  },
  access_control: {
    code: "access_control",
    label: "Control de Acceso",
    shortLabel: "Acceso",
    description: "Modulo scaffold/WIP del producto: ya existe en menu, rutas y pantallas, pero todavia no tiene backend ni flujos operativos cerrados.",
    status: "wip",
    assignable: true,
    screens: [
      { key: "ac-overview", label: "Resumen" },
      { key: "ac-inventory", label: "Inventario" },
      { key: "ac-tech-sheets", label: "Fichas tecnicas" },
      { key: "ac-maintenance", label: "Mantenimiento" },
      { key: "ac-incidents", label: "Incidentes" },
      { key: "ac-reports", label: "Reportes" },
    ],
    runtimeVisible: true,
  },
  networking: {
    code: "networking",
    label: "Redes",
    shortLabel: "Redes",
    description: "Modulo scaffold/WIP del producto: ya existe en menu, rutas y pantallas base, pero todavia no tiene backend ni flujos operativos cerrados.",
    status: "wip",
    assignable: true,
    screens: [
      { key: "net-overview", label: "Resumen" },
      { key: "net-inventory", label: "Inventario" },
      { key: "net-tech-sheets", label: "Fichas tecnicas" },
      { key: "net-maintenance", label: "Mantenimiento" },
      { key: "net-incidents", label: "Incidentes" },
      { key: "net-reports", label: "Reportes" },
    ],
    runtimeVisible: true,
  },
};

export const ASSIGNABLE_SERVICE_CODES: AssignableServiceCode[] = [
  "cctv",
  "operations",
  "access_control",
  "networking",
  "storage",
  "intelligence",
];
export const RUNTIME_VISIBLE_SERVICE_CODES: ProductServiceCode[] = ["cctv", "operations", "access_control", "networking"];
export const PARTIAL_SERVICE_CODES: ProductServiceCode[] = ["storage", "intelligence"];
export const FUTURE_SERVICE_CODES: ProductServiceCode[] = [];
export const LEGACY_DEFAULT_ENABLED_SERVICES: ProductServiceCode[] = ["cctv", "operations", "storage", "intelligence"];

export const COMMERCIAL_PLAN_PRESETS: Record<CommercialPlanCode, CommercialPlanPreset> = {
  basic: {
    code: "basic",
    label: "Basic",
    description: "Base operativa enfocada en CCTV y Operaciones.",
    suggestedServices: ["cctv", "operations"],
  },
  professional: {
    code: "professional",
    label: "Professional",
    description: "CCTV, Operaciones mas Control de Acceso como dominio visible en construccion.",
    suggestedServices: ["cctv", "operations", "access_control"],
  },
  enterprise: {
    code: "enterprise",
    label: "Enterprise",
    description: "Stack multi-dominio: CCTV, Operaciones, Control de Acceso, Redes y capacidades parciales de storage e IA.",
    suggestedServices: ["cctv", "operations", "access_control", "networking", "storage", "intelligence"],
  },
  custom: {
    code: "custom",
    label: "Personalizado",
    description: "Selecciona manualmente los modulos y pantallas que necesita esta empresa.",
    suggestedServices: [],
  },
};

const ROUTE_SERVICE_REQUIREMENTS: Partial<Record<string, ProductServiceCode>> = {
  "/inventory": "cctv",
  "/cameras": "cctv",
  "/camera-models": "cctv",
  "/nvrs": "cctv",
  "/floor-plans": "cctv",
  "/map": "cctv",
  "/imports": "cctv",
  "/capex": "operations",
  "/tickets": "operations",
  "/clients": "operations",
  "/policies": "operations",
  "/sla": "operations",
  "/access-control": "access_control",
  "/access-control/inventory": "access_control",
  "/access-control/technical-sheets": "access_control",
  "/access-control/maintenance": "access_control",
  "/access-control/incidents": "access_control",
  "/access-control/reports": "access_control",
  "/networking": "networking",
  "/networking/inventory": "networking",
  "/networking/technical-sheets": "networking",
  "/networking/maintenance": "networking",
  "/networking/incidents": "networking",
  "/networking/reports": "networking",
};

const SETTINGS_TAB_SERVICE_REQUIREMENTS: Partial<Record<string, ProductServiceCode>> = {
  ia: "intelligence",
  almacenamiento: "storage",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function isKnownServiceCode(value: string): value is ProductServiceCode {
  return value in PRODUCT_SERVICE_DEFINITIONS;
}

function isKnownPlan(value: string): value is CommercialPlanCode {
  return value in COMMERCIAL_PLAN_PRESETS;
}

function dedupeServices(values: ProductServiceCode[]): ProductServiceCode[] {
  return [...new Set(values)];
}

export function getSuggestedServicesForPlan(plan?: string | null): AssignableServiceCode[] {
  if (!plan || !isKnownPlan(plan)) return COMMERCIAL_PLAN_PRESETS.basic.suggestedServices;
  return COMMERCIAL_PLAN_PRESETS[plan].suggestedServices;
}

export function parseEnabledServices(
  settings?: Record<string, unknown> | null,
): ProductServiceCode[] | null {
  if (!isRecord(settings)) return null;

  const enabledServices = readStringArray(settings.enabled_services).filter(isKnownServiceCode);
  return enabledServices.length ? dedupeServices(enabledServices) : null;
}

export function parsePackageProfile(
  subscriptionPlan?: string | null,
  settings?: Record<string, unknown> | null,
): CommercialPlanCode {
  if (isRecord(settings)) {
    const packageProfile = readString(settings.package_profile);
    if (packageProfile && isKnownPlan(packageProfile)) {
      return packageProfile;
    }
  }

  if (subscriptionPlan && isKnownPlan(subscriptionPlan)) {
    return subscriptionPlan;
  }

  return "basic";
}

export function parseTenantOnboarding(
  settings?: Record<string, unknown> | null,
): TenantOnboardingSnapshot {
  if (!isRecord(settings) || !isRecord(settings.onboarding)) {
    return {
      status: "tenant_created_only",
      notes: "Tenant creado sin snapshot operativo de onboarding.",
    };
  }

  const onboarding = settings.onboarding;
  const status = readString(onboarding.status);

  return {
    status:
      status === "ready" ||
      status === "tenant_created_only" ||
      status === "admin_created_pending_role" ||
      status === "admin_creation_failed"
        ? status
        : "tenant_created_only",
    adminEmail: readString(onboarding.admin_email),
    adminName: readString(onboarding.admin_name),
    adminUserId: readString(onboarding.admin_user_id),
    tenantId: readString(onboarding.tenant_id),
    roleId: readString(onboarding.role_id),
    roleName: readString(onboarding.role_name),
    verificationSource:
      readString(onboarding.verification_source) === "bootstrap" ||
      readString(onboarding.verification_source) === "manual" ||
      readString(onboarding.verification_source) === "unknown"
        ? (readString(onboarding.verification_source) as "bootstrap" | "manual" | "unknown")
        : undefined,
    verifiedAt: readString(onboarding.verified_at),
    notes: readString(onboarding.notes),
    updatedAt: readString(onboarding.updated_at),
  };
}

export function parseDisabledScreens(
  settings?: Record<string, unknown> | null,
): Partial<Record<ProductServiceCode, string[]>> {
  if (!isRecord(settings)) return {};
  const raw = settings.disabled_screens;
  if (!isRecord(raw)) return {};
  const result: Partial<Record<ProductServiceCode, string[]>> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (isKnownServiceCode(key)) {
      const screens = readStringArray(value);
      if (screens.length) result[key] = screens;
    }
  }
  return result;
}

export function parseTenantProductProfile(
  entity:
    | Pick<Tenant, "subscription_plan" | "settings">
    | Pick<Company, "subscription_plan" | "settings">
    | null
    | undefined,
): TenantProductProfile {
  const packageProfile = parsePackageProfile(entity?.subscription_plan, entity?.settings);
  const explicitServices = parseEnabledServices(entity?.settings);
  const settingsRecord = isRecord(entity?.settings) ? entity!.settings : null;

  return {
    packageProfile,
    enabledServices: explicitServices ?? LEGACY_DEFAULT_ENABLED_SERVICES,
    disabledScreens: parseDisabledScreens(settingsRecord),
    source: explicitServices ? "explicit" : "legacy_default",
    onboarding: parseTenantOnboarding(settingsRecord),
  };
}

export function buildTenantSettings(params: {
  existingSettings?: Record<string, unknown> | null;
  packageProfile: CommercialPlanCode;
  enabledServices: ProductServiceCode[];
  disabledScreens?: Partial<Record<ProductServiceCode, string[]>>;
  onboarding?: TenantOnboardingSnapshot;
}): Record<string, unknown> {
  const nextSettings = isRecord(params.existingSettings) ? { ...params.existingSettings } : {};

  nextSettings.package_profile = params.packageProfile;
  nextSettings.enabled_services = dedupeServices(params.enabledServices);

  // Pantallas deshabilitadas por servicio (control granular)
  if (params.disabledScreens) {
    const cleanScreens: Record<string, string[]> = {};
    for (const [svc, screens] of Object.entries(params.disabledScreens)) {
      if (screens && screens.length > 0) cleanScreens[svc] = screens;
    }
    if (Object.keys(cleanScreens).length > 0) {
      nextSettings.disabled_screens = cleanScreens;
    } else {
      delete nextSettings.disabled_screens;
    }
  }

  if (params.onboarding) {
    nextSettings.onboarding = {
      status: params.onboarding.status,
      admin_email: params.onboarding.adminEmail,
      admin_name: params.onboarding.adminName,
      admin_user_id: params.onboarding.adminUserId,
      tenant_id: params.onboarding.tenantId,
      role_id: params.onboarding.roleId,
      role_name: params.onboarding.roleName,
      verification_source: params.onboarding.verificationSource,
      verified_at: params.onboarding.verifiedAt,
      notes: params.onboarding.notes,
      updated_at: params.onboarding.updatedAt,
    };
  }

  return nextSettings;
}

export function isServiceRuntimeVisible(
  serviceCode: ProductServiceCode,
  options?: { hasRoleContext?: boolean },
): boolean {
  const service = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
  if (!service) return false;
  if (!service.runtimeVisible) return false;
  if (service.status === "future") return false;
  if (service.status === "wip") {
    return options?.hasRoleContext ?? true;
  }

  return true;
}

export function isRouteEnabledForServices(
  pathname: string,
  enabledServices: ProductServiceCode[],
  options?: { hasRoleContext?: boolean },
): boolean {
  const matchedEntry = Object.entries(ROUTE_SERVICE_REQUIREMENTS).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!matchedEntry) return true;

  const [, requiredService] = matchedEntry;
  if (!requiredService) return true;
  if (!enabledServices.includes(requiredService)) return false;

  return isServiceRuntimeVisible(requiredService, options);
}

export function isSettingsTabEnabledForServices(tabKey: string, enabledServices: ProductServiceCode[]): boolean {
  const requiredService = SETTINGS_TAB_SERVICE_REQUIREMENTS[tabKey];
  if (!requiredService) return true;
  return enabledServices.includes(requiredService);
}

/** Verifica si una pantalla especifica esta habilitada (no en la lista de deshabilitadas) */
export function isScreenEnabled(
  screenKey: string,
  serviceCode: ProductServiceCode,
  disabledScreens?: Partial<Record<ProductServiceCode, string[]>>,
): boolean {
  if (!disabledScreens) return true;
  const disabled = disabledScreens[serviceCode];
  if (!disabled || disabled.length === 0) return true;
  return !disabled.includes(screenKey);
}

export function getOnboardingStatusMeta(status: TenantOnboardingStatus): {
  label: string;
  tone: "default" | "secondary" | "destructive";
} {
  switch (status) {
    case "ready":
      return { label: "Listo para operar", tone: "default" };
    case "admin_created_pending_role":
      return { label: "Admin sin rol final", tone: "secondary" };
    case "admin_creation_failed":
      return { label: "Tenant sin admin listo", tone: "destructive" };
    default:
      return { label: "Tenant creado", tone: "secondary" };
  }
}

export function getTenantReadinessMeta(params: {
  companyId?: string | null;
  productProfile: TenantProductProfile;
}): TenantReadinessMeta {
  const { companyId, productProfile } = params;
  const { onboarding } = productProfile;
  const issues: string[] = [];
  const hasExplicitServices = productProfile.source === "explicit";
  const hasVerifiedAdmin =
    Boolean(onboarding.adminUserId && onboarding.adminEmail) &&
    Boolean(onboarding.roleId && onboarding.roleName) &&
    Boolean(onboarding.tenantId && companyId && onboarding.tenantId === companyId);

  if (!hasExplicitServices) {
    issues.push("Los modulos visibles aun salen del perfil heredado; falta persistir la asignacion explicita del tenant.");
  }

  if (!onboarding.adminEmail) {
    issues.push("No existe admin inicial configurado para este tenant.");
  }

  if (onboarding.status === "ready" && !hasVerifiedAdmin) {
    issues.push("El snapshot dice listo, pero no hay evidencia persistida suficiente del usuario y del rol asociado al tenant.");
  }

  switch (onboarding.status) {
    case "ready":
      if (hasVerifiedAdmin) {
        return {
          status: "ready",
          label: "Lista para iniciar sesion",
          tone: "default",
          description: "Existe evidencia persistida del admin inicial, su tenant y el rol esperado.",
          evidenceLabel:
            onboarding.verificationSource === "bootstrap"
              ? "Bootstrap verificado"
              : onboarding.verificationSource === "manual"
                ? "Verificacion manual"
                : "Evidencia persistida",
          isReady: true,
          issues,
        };
      }

      return {
        status: "admin_created_pending_role",
        label: "Admin creado pendiente de rol",
        tone: "secondary",
        description: "No se marca lista porque falta evidencia persistida suficiente para garantizar el login del tenant.",
        evidenceLabel: "Evidencia incompleta",
        isReady: false,
        issues,
      };
    case "admin_created_pending_role":
      return {
        status: "admin_created_pending_role",
        label: "Admin creado pendiente de rol",
        tone: "secondary",
        description: "El usuario inicial existe, pero no hay garantia completa de rol o de asociacion final al tenant.",
        evidenceLabel: onboarding.adminUserId ? "Usuario creado" : "Sin verificacion final",
        isReady: false,
        issues,
      };
    case "admin_creation_failed":
      return {
        status: "admin_creation_failed",
        label: "Error en bootstrap",
        tone: "destructive",
        description: "El tenant existe, pero el admin inicial no quedo listo para entrar al sistema.",
        evidenceLabel: "Bootstrap fallido",
        isReady: false,
        issues,
      };
    default:
      return {
        status: "tenant_created_only",
        label: "Empresa creada sin admin",
        tone: "secondary",
        description: "La empresa existe, pero aun no tiene un admin inicial verificado para iniciar sesion.",
        evidenceLabel: "Sin bootstrap",
        isReady: false,
        issues,
      };
  }
}

export function getServiceStatusMeta(status: ServiceSupportStatus): {
  label: string;
  tone: "default" | "secondary";
} {
  switch (status) {
    case "operational":
      return { label: "Operativo", tone: "default" };
    case "partial":
      return { label: "Parcial", tone: "secondary" };
    case "wip":
      return { label: "WIP", tone: "secondary" };
    default:
      return { label: "Futuro", tone: "secondary" };
  }
}
