import { api } from "./client";
import type {
  DashboardSummary,
  DashboardTicketStats,
  TicketTrend,
  PolicyStats,
} from "@/types/api";

// Helper: construye searchParams con tenant_id override para super_admin
function withTenant(tenantId?: string | null, extra?: Record<string, string>): Record<string, string> {
  const params: Record<string, string> = { ...extra };
  if (tenantId) params.tenant_id = tenantId;
  return params;
}

export async function getDashboardSummary(tenantId?: string | null): Promise<DashboardSummary> {
  return api.get("dashboard/summary", { searchParams: withTenant(tenantId) }).json<DashboardSummary>();
}

export async function getDashboardTicketStats(tenantId?: string | null): Promise<DashboardTicketStats> {
  return api.get("dashboard/tickets/stats", { searchParams: withTenant(tenantId) }).json<DashboardTicketStats>();
}

export async function getTicketsTrend(days?: number, tenantId?: string | null): Promise<TicketTrend[]> {
  return api.get("dashboard/tickets/trend", { searchParams: withTenant(tenantId, days ? { days: String(days) } : undefined) }).json<TicketTrend[]>();
}

export async function getPolicyStats(tenantId?: string | null): Promise<PolicyStats> {
  return api.get("dashboard/policies/stats", { searchParams: withTenant(tenantId) }).json<PolicyStats>();
}
