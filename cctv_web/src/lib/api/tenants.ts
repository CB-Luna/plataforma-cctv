import { api } from "./client";
import type { Tenant, CreateTenantRequest, UpdateTenantRequest, TenantStats } from "@/types/api";

export async function listTenants(limit = 100, offset = 0): Promise<Tenant[]> {
  return api
    .get("tenants", { searchParams: { limit, offset } })
    .json<Tenant[]>();
}

export async function getTenant(id: string): Promise<Tenant> {
  return api.get(`tenants/${id}`).json<Tenant>();
}

export async function createTenant(data: CreateTenantRequest): Promise<Tenant> {
  return api.post("tenants", { json: data }).json<Tenant>();
}

export async function updateTenant(id: string, data: UpdateTenantRequest): Promise<Tenant> {
  return api.put(`tenants/${id}`, { json: data }).json<Tenant>();
}

export async function activateTenant(id: string): Promise<void> {
  await api.patch(`tenants/${id}/activate`);
}

export async function deactivateTenant(id: string): Promise<void> {
  await api.patch(`tenants/${id}/deactivate`);
}

export async function getTenantStats(): Promise<TenantStats> {
  return api.get("tenants/stats").json<TenantStats>();
}

export async function uploadTenantLogo(id: string, file: File): Promise<Tenant> {
  const formData = new FormData();
  formData.append("logo", file);
  return api.post(`tenants/${id}/logo`, { body: formData }).json<Tenant>();
}
