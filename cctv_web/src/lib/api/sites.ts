import { api } from "./client";
import type { SiteListItem } from "@/types/api";

export async function listSites(params?: { tenantId?: string | null }): Promise<SiteListItem[]> {
  const searchParams: Record<string, string> = {};
  if (params?.tenantId) searchParams.tenant_id = params.tenantId;
  return api.get("inventory/floor-plans/sites", { searchParams }).json<SiteListItem[]>();
}
