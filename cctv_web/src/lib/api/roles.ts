import { api } from "./client";
import type {
  RoleAdmin,
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionAdmin,
  CreatePermissionRequest,
} from "@/types/api";

// Roles
export async function listRoles(): Promise<RoleAdmin[]> {
  return api.get("roles").json<RoleAdmin[]>();
}

export async function getRole(id: string): Promise<RoleAdmin> {
  return api.get(`roles/${id}`).json<RoleAdmin>();
}

export async function createRole(data: CreateRoleRequest): Promise<RoleAdmin> {
  return api.post("roles", { json: data }).json<RoleAdmin>();
}

export async function updateRole(id: string, data: UpdateRoleRequest): Promise<RoleAdmin> {
  return api.put(`roles/${id}`, { json: data }).json<RoleAdmin>();
}

export async function getRolePermissions(roleId: string): Promise<PermissionAdmin[]> {
  return api.get(`roles/${roleId}/permissions`).json<PermissionAdmin[]>();
}

export async function assignPermission(roleId: string, permissionId: string): Promise<void> {
  await api.post(`roles/${roleId}/permissions`, { json: { permission_id: permissionId } });
}

// Permissions
export async function listPermissions(): Promise<PermissionAdmin[]> {
  return api.get("permissions").json<PermissionAdmin[]>();
}

export async function createPermission(data: CreatePermissionRequest): Promise<PermissionAdmin> {
  return api.post("permissions", { json: data }).json<PermissionAdmin>();
}
