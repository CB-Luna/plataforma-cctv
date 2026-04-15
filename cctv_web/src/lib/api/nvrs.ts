import { api } from "./client";
import type { NvrServer, CreateNvrRequest, NvrStats, Camera } from "@/types/api";

export async function listNvrs(params?: { tenantId?: string | null }): Promise<NvrServer[]> {
  const searchParams: Record<string, string> = {};
  if (params?.tenantId) searchParams.tenant_id = params.tenantId;
  return api.get("inventory/nvrs", { searchParams }).json<NvrServer[]>();
}

export async function getNvr(id: string, tenantId?: string | null): Promise<NvrServer> {
  const searchParams: Record<string, string> = {};
  if (tenantId) searchParams.tenant_id = tenantId;
  return api.get(`inventory/nvrs/${id}`, { searchParams }).json<NvrServer>();
}

export async function createNvr(data: CreateNvrRequest): Promise<NvrServer> {
  return api.post("inventory/nvrs", { json: data }).json<NvrServer>();
}

export async function updateNvr(id: string, data: CreateNvrRequest): Promise<NvrServer> {
  return api.put(`inventory/nvrs/${id}`, { json: data }).json<NvrServer>();
}

export async function deleteNvr(id: string): Promise<void> {
  await api.delete(`inventory/nvrs/${id}`);
}

export async function getNvrStats(tenantId?: string | null): Promise<NvrStats> {
  const searchParams: Record<string, string> = {};
  if (tenantId) searchParams.tenant_id = tenantId;
  return api.get("inventory/nvrs/stats", { searchParams }).json<NvrStats>();
}

export async function getNvrCameras(id: string, tenantId?: string | null): Promise<Camera[]> {
  const searchParams: Record<string, string> = {};
  if (tenantId) searchParams.tenant_id = tenantId;
  return api.get(`inventory/nvrs/${id}/cameras`, { searchParams }).json<Camera[]>();
}
