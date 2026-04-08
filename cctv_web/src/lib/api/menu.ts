import { api } from "./client";
import type {
  AdminMenuItem,
  CreateMenuTemplateRequest,
  MenuTemplate,
  MenuTenantBasic,
  TemplateItemAssignment,
  UpdateMenuTemplateRequest,
} from "@/types/api";

export async function listMenuTemplates(): Promise<MenuTemplate[]> {
  return api.get("menu/templates").json<MenuTemplate[]>();
}

export async function createMenuTemplate(data: CreateMenuTemplateRequest): Promise<MenuTemplate> {
  return api.post("menu/templates", { json: data }).json<MenuTemplate>();
}

export async function updateMenuTemplate(id: string, data: UpdateMenuTemplateRequest): Promise<MenuTemplate> {
  return api.put(`menu/templates/${id}`, { json: data }).json<MenuTemplate>();
}

export async function deleteMenuTemplate(id: string): Promise<void> {
  await api.delete(`menu/templates/${id}`);
}

export async function listMenuTenants(): Promise<MenuTenantBasic[]> {
  return api.get("menu/tenants").json<MenuTenantBasic[]>();
}

export async function listTemplateTenants(templateId: string): Promise<MenuTenantBasic[]> {
  return api.get(`menu/templates/${templateId}/tenants`).json<MenuTenantBasic[]>();
}

export async function assignTenantsToMenuTemplate(templateId: string, tenantIds: string[]): Promise<void> {
  await api.put(`menu/templates/${templateId}/tenants`, { json: { tenant_ids: tenantIds } });
}

export async function listAdminMenuItems(): Promise<AdminMenuItem[]> {
  return api.get("menu/items/admin").json<AdminMenuItem[]>();
}

export async function listTemplateItems(templateId: string): Promise<TemplateItemAssignment[]> {
  return api.get(`menu/templates/${templateId}/items`).json<TemplateItemAssignment[]>();
}

export async function replaceTemplateItems(templateId: string, menuItemIds: string[]): Promise<void> {
  await api.put(`menu/templates/${templateId}/items-bulk`, { json: { menu_item_ids: menuItemIds } });
}
