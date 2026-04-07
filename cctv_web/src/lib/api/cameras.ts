import { api } from "./client";
import type { Camera, CreateCameraRequest, CameraStats } from "@/types/api";

export async function listCameras(params?: { limit?: number; offset?: number }): Promise<Camera[]> {
  const searchParams: Record<string, string> = {};
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);
  return api.get("inventory/cameras", { searchParams }).json<Camera[]>();
}

export async function getCamera(id: string): Promise<Camera> {
  return api.get(`inventory/cameras/${id}`).json<Camera>();
}

export async function createCamera(data: CreateCameraRequest): Promise<Camera> {
  return api.post("inventory/cameras", { json: data }).json<Camera>();
}

export async function updateCamera(id: string, data: CreateCameraRequest): Promise<Camera> {
  return api.put(`inventory/cameras/${id}`, { json: data }).json<Camera>();
}

export async function deleteCamera(id: string): Promise<void> {
  await api.delete(`inventory/cameras/${id}`);
}

export async function getCameraStats(): Promise<CameraStats> {
  return api.get("inventory/cameras/stats").json<CameraStats>();
}

export async function searchCameras(q: string, params?: { limit?: number; offset?: number }): Promise<Camera[]> {
  const searchParams: Record<string, string> = { q };
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);
  return api.get("inventory/cameras/search", { searchParams }).json<Camera[]>();
}
