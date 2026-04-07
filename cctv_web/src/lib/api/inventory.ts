import { api } from "./client";
import type { InventorySummary, InventoryDashboardStats } from "@/types/api";

export async function getInventorySummary(): Promise<InventorySummary> {
  return api.get("inventory/summary").json<InventorySummary>();
}

export async function getInventoryDashboardStats(): Promise<InventoryDashboardStats> {
  return api.get("dashboard/inventory/stats").json<InventoryDashboardStats>();
}
