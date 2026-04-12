import { api } from "./client";
import type {
  UserAdmin,
  UpdateUserRequest,
  UpdatePasswordRequest,
  RoleAdmin,
} from "@/types/api";

export async function listUsers(tenantId?: string): Promise<UserAdmin[]> {
  const searchParams: Record<string, string> = {};
  if (tenantId) searchParams.tenant_id = tenantId;
  return api.get("users", { searchParams }).json<UserAdmin[]>();
}

export async function getUser(id: string): Promise<UserAdmin> {
  return api.get(`users/${id}`).json<UserAdmin>();
}

export async function updateUser(id: string, data: UpdateUserRequest): Promise<UserAdmin> {
  return api.put(`users/${id}`, { json: data }).json<UserAdmin>();
}

export async function changePassword(id: string, data: UpdatePasswordRequest): Promise<void> {
  await api.put(`users/${id}/password`, { json: data });
}

export async function deactivateUser(id: string): Promise<void> {
  await api.delete(`users/${id}`);
}

export async function getUserRoles(id: string): Promise<RoleAdmin[]> {
  return api.get(`users/${id}/roles`).json<RoleAdmin[]>();
}

export async function assignRole(userId: string, roleId: string): Promise<void> {
  await api.post(`users/${userId}/roles`, { json: { role_id: roleId } });
}

export async function removeRole(userId: string, roleId: string): Promise<void> {
  await api.delete(`users/${userId}/roles/${roleId}`);
}

export async function uploadAvatar(userId: string, file: File): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  await api.post(`users/${userId}/profile-image`, { body: form });
}

export async function deleteAvatar(userId: string): Promise<void> {
  await api.delete(`users/${userId}/profile-image`);
}
