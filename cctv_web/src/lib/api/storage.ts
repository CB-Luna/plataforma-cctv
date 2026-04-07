import { api } from "./client";
import type {
  FileItem,
  FileStats,
  StorageProvider,
  StorageConfiguration,
  CreateStorageConfigRequest,
  UpdateStorageConfigRequest,
} from "@/types/api";

export async function uploadFile(
  file: File,
  opts?: { category?: string; related_entity_type?: string; related_entity_id?: string }
): Promise<FileItem> {
  const form = new FormData();
  form.append("file", file);
  if (opts?.category) form.append("category", opts.category);
  if (opts?.related_entity_type) form.append("related_entity_type", opts.related_entity_type);
  if (opts?.related_entity_id) form.append("related_entity_id", opts.related_entity_id);
  return api.post("storage/upload", { body: form }).json<FileItem>();
}

export async function listFiles(params?: {
  limit?: number;
  offset?: number;
  category?: string;
}): Promise<FileItem[]> {
  const searchParams: Record<string, string> = {};
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);
  if (params?.category) searchParams.category = params.category;
  return api.get("storage/files", { searchParams }).json<FileItem[]>();
}

export async function getFileContent(id: string): Promise<Blob> {
  return api.get(`storage/files/${id}/content`).blob();
}

export async function getFileStats(): Promise<FileStats> {
  return api.get("storage/stats").json<FileStats>();
}

export async function listStorageProviders(): Promise<StorageProvider[]> {
  return api.get("storage/providers").json<StorageProvider[]>();
}

export async function listStorageConfigurations(): Promise<StorageConfiguration[]> {
  return api.get("storage/configurations").json<StorageConfiguration[]>();
}

export async function createStorageConfiguration(data: CreateStorageConfigRequest): Promise<StorageConfiguration> {
  return api.post("storage/configurations", { json: data }).json<StorageConfiguration>();
}

export async function updateStorageConfiguration(id: string, data: UpdateStorageConfigRequest): Promise<StorageConfiguration> {
  return api.put(`storage/configurations/${id}`, { json: data }).json<StorageConfiguration>();
}

export async function deleteStorageConfiguration(id: string): Promise<void> {
  await api.delete(`storage/configurations/${id}`);
}
