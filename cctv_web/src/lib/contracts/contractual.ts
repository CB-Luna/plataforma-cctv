import type { Policy, SlaPolicy } from "@/types/api";

export const coverageStatusLabels: Record<string, string> = {
  covered: "Cubierto",
  partial: "Parcial",
  not_covered: "Sin cobertura",
  unknown: "Pendiente",
};

export const slaStatusLabels: Record<string, string> = {
  ok: "En tiempo",
  at_risk: "En riesgo",
  breached: "Incumplido",
  unknown: "Sin regla",
};

export const serviceFamilyLabels = {
  cctv: "CCTV",
  access_control: "Control de acceso",
  networking: "Redes",
  other: "Otro",
} as const;

export const assetScopeLabels = {
  listed_assets_only: "Solo activos listados",
  site_only: "Todos los activos del sitio",
  client_scope: "Cobertura a nivel cliente",
} as const;

export const serviceWindowLabels = {
  "24x7": "24x7",
  business_hours: "Horario laboral",
  custom: "Personalizada",
} as const;

export type CoverageServiceFamily = keyof typeof serviceFamilyLabels;
export type CoverageAssetScope = keyof typeof assetScopeLabels;
export type CoverageServiceWindow = keyof typeof serviceWindowLabels;

export interface PolicyCoverageFormState {
  covered_services: CoverageServiceFamily[];
  asset_scope: CoverageAssetScope;
  service_window: CoverageServiceWindow;
  coverage_notes: string;
}

interface PolicySelectionInput
  extends Pick<
    Policy,
    "id" | "policy_number" | "client_id" | "site_id" | "status" | "start_date" | "end_date" | "created_at"
  > {}

export interface ResolvedPolicyCandidate {
  policy: PolicySelectionInput;
  source: "explicit" | "site_match" | "client_fallback" | "latest_client";
}

export interface ResolvedSlaCandidate {
  policy: SlaPolicy;
  source: "exact" | "priority" | "type" | "default";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function isKnownServiceFamily(value: string): value is CoverageServiceFamily {
  return value in serviceFamilyLabels;
}

function normalizeDate(value?: string): Date | null {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function isPolicyCurrentlyActive(
  policy: Pick<PolicySelectionInput, "status" | "start_date" | "end_date">,
  referenceDate = new Date(),
): boolean {
  if (policy.status !== "active") return false;

  const start = normalizeDate(policy.start_date);
  const end = normalizeDate(policy.end_date);
  if (!start || !end) return false;

  const current = new Date(referenceDate);
  current.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return current >= start && current <= end;
}

export function parsePolicyCoverage(
  coverageJson?: Record<string, unknown> | null,
  fallbackSiteId?: string | null,
): PolicyCoverageFormState {
  const safeCoverage = isObject(coverageJson) ? coverageJson : {};
  const coveredServices = readStringArray(safeCoverage.covered_services).filter(isKnownServiceFamily);
  const assetScope = readString(safeCoverage.asset_scope);
  const serviceWindow = readString(safeCoverage.service_window);

  return {
    covered_services: coveredServices,
    asset_scope:
      assetScope && assetScope in assetScopeLabels
        ? (assetScope as CoverageAssetScope)
        : fallbackSiteId
          ? "site_only"
          : "client_scope",
    service_window:
      serviceWindow && serviceWindow in serviceWindowLabels
        ? (serviceWindow as CoverageServiceWindow)
        : "business_hours",
    coverage_notes: readString(safeCoverage.coverage_notes) ?? "",
  };
}

export function serializePolicyCoverage(values: PolicyCoverageFormState): Record<string, unknown> {
  return {
    covered_services: values.covered_services,
    asset_scope: values.asset_scope,
    service_window: values.service_window,
    coverage_notes: values.coverage_notes.trim() || undefined,
  };
}

export function summarizePolicyCoverage(policy?: {
  coverage_json?: Record<string, unknown> | null;
  site_id?: string | null;
} | null): string {
  const coverage = parsePolicyCoverage(policy?.coverage_json, policy?.site_id);
  const services = coverage.covered_services.length
    ? coverage.covered_services.map((item) => serviceFamilyLabels[item]).join(", ")
    : "Cobertura base";

  return `${services} · ${assetScopeLabels[coverage.asset_scope]}`;
}

export function summarizeBusinessHours(businessHours?: Record<string, unknown> | null): string {
  if (!isObject(businessHours) || Object.keys(businessHours).length === 0) {
    return "Horas corridas";
  }

  const mode = readString(businessHours.mode);
  if (mode && mode in serviceWindowLabels) {
    return serviceWindowLabels[mode as CoverageServiceWindow];
  }

  const timezone = readString(businessHours.timezone);
  const start = readString(businessHours.start);
  const end = readString(businessHours.end);
  if (start && end) {
    return timezone ? `${start}-${end} (${timezone})` : `${start}-${end}`;
  }

  return "Horario documentado";
}

export function resolveTicketPolicyCandidate(params: {
  policies: PolicySelectionInput[];
  clientId?: string;
  siteId?: string;
  selectedPolicyId?: string;
  referenceDate?: Date;
}): ResolvedPolicyCandidate | null {
  const { policies, clientId, siteId, selectedPolicyId, referenceDate = new Date() } = params;

  if (selectedPolicyId) {
    const explicitPolicy = policies.find((policy) => policy.id === selectedPolicyId);
    return explicitPolicy ? { policy: explicitPolicy, source: "explicit" } : null;
  }

  if (!clientId) return null;

  const activePolicies = policies.filter(
    (policy) => policy.client_id === clientId && isPolicyCurrentlyActive(policy, referenceDate),
  );

  const sortedPolicies = [...activePolicies].sort((left, right) => {
    const leftCreatedAt = normalizeDate(left.created_at)?.getTime() ?? 0;
    const rightCreatedAt = normalizeDate(right.created_at)?.getTime() ?? 0;
    return rightCreatedAt - leftCreatedAt;
  });

  if (siteId) {
    const exactSiteMatch = sortedPolicies.find((policy) => policy.site_id === siteId);
    if (exactSiteMatch) {
      return { policy: exactSiteMatch, source: "site_match" };
    }

    const clientFallback = sortedPolicies.find((policy) => !policy.site_id);
    if (clientFallback) {
      return { policy: clientFallback, source: "client_fallback" };
    }
  }

  const latestClientPolicy = sortedPolicies[0];
  return latestClientPolicy ? { policy: latestClientPolicy, source: "latest_client" } : null;
}

export function resolveSlaCandidate(params: {
  policies: SlaPolicy[];
  priority?: string;
  type?: string;
}): ResolvedSlaCandidate | null {
  const { policies, priority, type } = params;

  const candidates = policies.filter((policy) => {
    if (!policy.is_active) return false;

    const priorityMatches = !policy.ticket_priority || policy.ticket_priority === priority;
    const typeMatches = !policy.ticket_type || policy.ticket_type === type;

    return priorityMatches && typeMatches;
  });

  const orderedCandidates = [...candidates].sort((left, right) => {
    const leftPriorityRank = left.ticket_priority && left.ticket_priority === priority ? 0 : 1;
    const rightPriorityRank = right.ticket_priority && right.ticket_priority === priority ? 0 : 1;
    if (leftPriorityRank !== rightPriorityRank) return leftPriorityRank - rightPriorityRank;

    const leftTypeRank = left.ticket_type && left.ticket_type === type ? 0 : 1;
    const rightTypeRank = right.ticket_type && right.ticket_type === type ? 0 : 1;
    if (leftTypeRank !== rightTypeRank) return leftTypeRank - rightTypeRank;

    const leftDefaultRank = left.is_default ? 0 : 1;
    const rightDefaultRank = right.is_default ? 0 : 1;
    if (leftDefaultRank !== rightDefaultRank) return leftDefaultRank - rightDefaultRank;

    const leftCreatedAt = normalizeDate(left.created_at)?.getTime() ?? 0;
    const rightCreatedAt = normalizeDate(right.created_at)?.getTime() ?? 0;
    return leftCreatedAt - rightCreatedAt;
  });

  const selected = orderedCandidates[0];
  if (!selected) return null;

  const exactPriority = Boolean(selected.ticket_priority && selected.ticket_priority === priority);
  const exactType = Boolean(selected.ticket_type && selected.ticket_type === type);

  let source: ResolvedSlaCandidate["source"] = "default";
  if (exactPriority && exactType) {
    source = "exact";
  } else if (exactPriority) {
    source = "priority";
  } else if (exactType) {
    source = "type";
  }

  return { policy: selected, source };
}

export function describeSlaScope(policy: Pick<SlaPolicy, "ticket_priority" | "ticket_type">): string {
  const parts: string[] = [];

  if (policy.ticket_priority) {
    parts.push(`Prioridad ${policy.ticket_priority}`);
  } else {
    parts.push("Todas las prioridades");
  }

  if (policy.ticket_type) {
    parts.push(`Tipo ${policy.ticket_type}`);
  } else {
    parts.push("Todos los tipos");
  }

  return parts.join(" · ");
}

export function describeResolvedPolicySource(source: ResolvedPolicyCandidate["source"]): string {
  switch (source) {
    case "explicit":
      return "Seleccion manual";
    case "site_match":
      return "Coincidencia exacta por sitio";
    case "client_fallback":
      return "Cobertura cliente como respaldo";
    default:
      return "Ultima poliza activa del cliente";
  }
}

export function describeResolvedSlaSource(source: ResolvedSlaCandidate["source"]): string {
  switch (source) {
    case "exact":
      return "Coincidencia exacta";
    case "priority":
      return "Coincidencia por prioridad";
    case "type":
      return "Coincidencia por tipo";
    default:
      return "Regla default";
  }
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function toScheduledDatePayload(value?: string | null): string | undefined {
  if (!value) return undefined;
  return `${value}T00:00:00Z`;
}
