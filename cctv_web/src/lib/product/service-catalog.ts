import type { Company, Tenant } from "@/types/api";

export type ProductServiceCode =
  | "cctv"
  | "storage"
  | "intelligence"
  | "access_control"
  | "networking";

export type AssignableServiceCode = "cctv" | "storage" | "intelligence";
export type CommercialPlanCode = "basic" | "professional" | "enterprise";
export type ServiceSupportStatus = "operational" | "settings_only" | "planned";
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
  },
  storage: {
    code: "storage",
    label: "Storage",
    shortLabel: "Storage",
    description: "Configuracion de almacenamiento y archivos del tenant activo dentro del shell actual.",
    status: "settings_only",
    assignable: true,
    modules: ["Storage"],
  },
  intelligence: {
    code: "intelligence",
    label: "IA",
    shortLabel: "IA",
    description: "Modelos, prompts y configuracion de inteligencia del tenant activo.",
    status: "settings_only",
    assignable: true,
    modules: ["IA"],
  },
  access_control: {
    code: "access_control",
    label: "Control de Acceso",
    shortLabel: "Acceso",
    description: "Dominio deseado por producto, pero sin superficie web operativa auditada en el repo actual.",
    status: "planned",
    assignable: false,
    modules: [],
  },
  networking: {
    code: "networking",
    label: "Redes",
    shortLabel: "Redes",
    description: "Dominio de servicio previsto por producto, sin modulo web operativo en el estado actual.",
    status: "planned",
    assignable: false,
    modules: [],
  },
};

export const ASSIGNABLE_SERVICE_CODES: AssignableServiceCode[] = ["cctv", "storage", "intelligence"];
export const PLANNED_SERVICE_CODES: ProductServiceCode[] = ["access_control", "networking"];
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
    description: "CCTV mas servicios de almacenamiento del tenant.",
    suggestedServices: ["cctv", "storage"],
  },
  enterprise: {
    code: "enterprise",
    label: "Enterprise",
    description: "CCTV mas capacidades de storage e inteligencia dentro del shell actual.",
    suggestedServices: ["cctv", "storage", "intelligence"],
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

export function isRouteEnabledForServices(pathname: string, enabledServices: ProductServiceCode[]): boolean {
  const matchedEntry = Object.entries(ROUTE_SERVICE_REQUIREMENTS).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!matchedEntry) return true;

  const [, requiredService] = matchedEntry;
  if (!requiredService) return true;
  return enabledServices.includes(requiredService);
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
    case "settings_only":
      return { label: "Configuracion", tone: "secondary" };
    default:
      return { label: "Planeado", tone: "secondary" };
  }
}
