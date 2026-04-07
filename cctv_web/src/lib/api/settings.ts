import { api } from "./client";
import type { MenuResponse, SettingsResponse, UpdateSettingsRequest, UpdateThemeRequest } from "@/types/api";

export async function getMenu(): Promise<MenuResponse> {
  return api.get("menu").json<MenuResponse>();
}

export async function getSettings(): Promise<SettingsResponse> {
  return api.get("settings").json<SettingsResponse>();
}

export async function updateSettings(data: UpdateSettingsRequest): Promise<SettingsResponse> {
  return api.put("settings", { json: data }).json<SettingsResponse>();
}

export async function updateTheme(data: UpdateThemeRequest): Promise<SettingsResponse> {
  return api.put("settings/theme", { json: data }).json<SettingsResponse>();
}
