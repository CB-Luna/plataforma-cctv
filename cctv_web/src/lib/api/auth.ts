import { api, publicApi } from "./client";
import type { LoginResponse, MeResponse, RegisterUserRequest, UserAdmin } from "@/types/api";

export async function login(email: string, password: string, tenantId?: string): Promise<LoginResponse> {
  return api.post("auth/login", { json: { email, password, tenant_id: tenantId } }).json<LoginResponse>();
}

export async function getMe(): Promise<MeResponse> {
  return api.get("auth/me").json<MeResponse>();
}

export async function logout(): Promise<void> {
  await api.post("auth/logout");
}

export async function registerTenantUser(data: RegisterUserRequest): Promise<UserAdmin> {
  return publicApi.post("auth/register", { json: data }).json<UserAdmin>();
}
