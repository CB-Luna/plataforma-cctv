import { api } from "./client";
import type { SiteListItem } from "@/types/api";

export async function listSites(): Promise<SiteListItem[]> {
  return api.get("inventory/floor-plans/sites").json<SiteListItem[]>();
}
