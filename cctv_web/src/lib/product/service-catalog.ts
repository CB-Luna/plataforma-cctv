import type { Company, Tenant } from "@/types/api";

export type ProductServiceCode =
  | "cctv"
  | "storage"
  | "intelligence"
  | "access_control"
  | "networking";

export type AssignableServiceCode = ProductServiceCode;
export type CommercialPlanCode = "basic" | "professional" | "enterprise";
export type ServiceSupportStatus = "operational" | "partial" | "wip" | "future";
export type ProductProfileSource = "explicit" | "legacy_default";
export type TenantOnboardingStatus =
  | "ready"
  | "tenant_created_only"
  | "admin_created_pending_role"
  | "admin_creation_failed";

export interface ProductServiceDefinition {
  code: ProductServiceCode;
  label: string;
  shortLabel: string;
  description: string;
  status: ServiceSupportStatus;
  assignable: boolean;
  modules: string[];
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
  roleName?: string;
  notes?: string;
  updatedAt?: string;
}

export interface TenantProductProfile {
  packageProfile: CommercialPlanCode;
  enabledServices: ProductServiceCode[];
  source: ProductProfileSource;
  onboarding: TenantOnboardingSnapshot;
}

export const PRODUCT_SERVICE_DEFINITIONS: Record<ProductServiceCode, ProductServiceDefinition> = {
  cctv: {
    code: "cctv",
    label: "CCTV",
    shortLabel: "CCTV",
    description: "Inventario, camaras, NVR, planos, importacion, mapa y CAPEX del dominio CCTV.",
    status: "operational",
    assignable: true,
    modules: ["Inventario", "Camaras", "Fichas tecnicas", "NVR", "Planos", "Mapa", "Importacion", "CAPEX"],
    runtimeVisible: true,
  },
  storage: {
    code: "storage",
    label: "Storage",
    shortLabel: "Storage",
    description: "Capacidad parcial del producto: configuracion de almacenamiento y archivos del tenant activo dentro del shell actual.",
    status: "partial",
    assignable: true,
    modules: ["Configuracion > Storage"],
    runtimeVisible: false,
  },
  intelligence: {
    code: "intelligence",
    label: "IA",
    shortLabel: "IA",
    description: "Capacidad parcial del producto: modelos, prompts y configuracion de inteligencia del tenant activo.",
    status: "partial",
    assignable: true,
    modules: ["Configuracion > IA"],
    runtimeVisible: false,
  },
  access_control: {
    code: "access_control",
    label: "Control de Acceso",
    shortLabel: "Acceso",
    description: "Modulo scaffold/WIP del producto: ya existe en menu, rutas y pantallas, pero todavia no tiene backend ni flujos operativos cerrados.",
    status: "wip",
    assignable: true,
    modules: ["Resumen", "Inventario", "Fichas tecnicas", "Mantenimiento", "Incidentes", "Reportes"],
    runtimeVisible: true,
  },
  networking: {
    code: "networking",
    label: "Redes",
    shortLabel: "Redes",
    description: "Modulo scaffold/WIP del producto: ya existe en menu, rutas y pantallas base, pero todavia no tiene backend ni flujos operativos cerrados.",
    status: "wip",
    assignable: true,
    modules: ["Resumen", "Inventario", "Fichas tecnicas", "Mantenimiento", "Incidentes", "Reportes"],
    runtimeVisible: true,
  },
};

export const ASSIGNABLE_SERVICE_CODES: AssignableServiceCode[] = [
  "cctv",
  "access_control",
  "networking",
  "storage",
  "intelligence",
];
export const RUNTIME_VISIBLE_SERVICE_CODES: ProductServiceCode[] = ["cctv", "access_control", "networking"];
export const PARTIAL_SERVICE_CODES: ProductServiceCode[] = ["storage", "intelligence"];
export const FUTURE_SERVICE_CODES: ProductServiceCode[] = [];
export const LEGACY_DEFAULT_ENABLED_SERVICES: ProductServiceCode[] = ["cctv", "storage", "intelligence"];

export const COMMERCIAL_PLAN_PRESETS: Record<CommercialPlanCode, CommercialPlanPreset> = {
  basic: {
    code: "basic",
    label: "Basic",
    description: "Base operativa enfocada en CCTV.",
    suggestedServices: ["cctv"],
  },
  professional: {
    code: "professional",
    label: "Professional",
    description: "CCTV mas Control de Acceso como dominio visible en construccion.",
    suggestedServices: ["cctv", "access_control"],
  },
  enterprise: {
    code: "enterprise",
    label: "Enterprise",
    description: "Stack multi-dominio: CCTV, Control de Acceso, Redes y capacidades parciales de storage e IA.",
    suggestedServices: ["cctv", "access_control", "networking", "storage", "intelligence"],
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
  "/capex": "cctv",
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
    roleName: readString(onboarding.role_name),
    notes: readString(onboarding.notes),
    updatedAt: readString(onboarding.updated_at),
  };
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

  return {
    packageProfile,
    enabledServices: explicitServices ?? LEGACY_DEFAULT_ENABLED_SERVICES,
    source: explicitServices ? "explicit" : "legacy_default",
    onboarding: parseTenantOnboarding(entity?.settings),
  };
}

export function buildTenantSettings(params: {
  existingSettings?: Record<string, unknown> | null;
  packageProfile: CommercialPlanCode;
  enabledServices: ProductServiceCode[];
  onboarding?: TenantOnboardingSnapshot;
}): Record<string, unknown> {
  const nextSettings = isRecord(params.existingSettings) ? { ...params.existingSettings } : {};

  nextSettings.package_profile = params.packageProfile;
  nextSettings.enabled_services = dedupeServices(params.enabledServices);

  if (params.onboarding) {
    nextSettings.onboarding = {
      status: params.onboarding.status,
      admin_email: params.onboarding.adminEmail,
      admin_name: params.onboarding.adminName,
      role_name: params.onboarding.roleName,
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
