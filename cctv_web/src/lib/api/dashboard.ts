import { api } from "./client";
import type {
  DashboardSummary,
  DashboardTicketStats,
  TicketTrend,
  PolicyStats,
} from "@/types/api";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return api.get("dashboard/summary").json<DashboardSummary>();
}

export async function getDashboardTicketStats(): Promise<DashboardTicketStats> {
  return api.get("dashboard/tickets/stats").json<DashboardTicketStats>();
}

export async function getTicketsTrend(days?: number): Promise<TicketTrend[]> {
  const searchParams: Record<string, string> = {};
  if (days) searchParams.days = String(days);
  return api.get("dashboard/tickets/trend", { searchParams }).json<TicketTrend[]>();
}

export async function getPolicyStats(): Promise<PolicyStats> {
  return api.get("dashboard/policies/stats").json<PolicyStats>();
}
