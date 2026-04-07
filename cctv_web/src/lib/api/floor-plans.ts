import { api } from "./client";
import type {
  FloorPlanSite,
  FloorPlanDetailResponse,
  SaveFloorPlanRequest,
  FloorPlanRecord,
} from "@/types/api";

export async function listFloorPlanSites(): Promise<FloorPlanSite[]> {
  return api.get("inventory/floor-plans/sites").json<FloorPlanSite[]>();
}

export async function getFloorPlanBySite(siteId: string): Promise<FloorPlanDetailResponse> {
  return api.get(`inventory/floor-plans/site/${siteId}`).json<FloorPlanDetailResponse>();
}

export async function saveFloorPlan(siteId: string, data: SaveFloorPlanRequest): Promise<FloorPlanRecord> {
  return api.put(`inventory/floor-plans/site/${siteId}`, { json: data }).json<FloorPlanRecord>();
}
