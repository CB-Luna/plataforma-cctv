import { api } from "./client";
import type {
  ImportAssistantAnalysisResponse,
  ImportBatch,
  ImportBatchItem,
  ImportStats,
} from "@/types/api";

export async function listImportBatches(params?: {
  limit?: number;
  offset?: number;
}): Promise<ImportBatch[]> {
  const searchParams: Record<string, string> = {};
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);
  return api.get("inventory/import/batches", { searchParams }).json<ImportBatch[]>();
}

export async function getImportBatch(id: string): Promise<{
  batch: ImportBatch;
  item_counts: Record<string, number>;
}> {
  return api.get(`inventory/import/batches/${id}`).json();
}

export async function getImportBatchItems(
  id: string,
  params?: { status?: string; limit?: number; offset?: number }
): Promise<ImportBatchItem[]> {
  const searchParams: Record<string, string> = {};
  if (params?.status) searchParams.status = params.status;
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);
  return api.get(`inventory/import/batches/${id}/items`, { searchParams }).json<ImportBatchItem[]>();
}

export async function getImportBatchErrors(id: string): Promise<ImportBatchItem[]> {
  return api.get(`inventory/import/batches/${id}/errors`).json<ImportBatchItem[]>();
}

export async function createImportBatch(data: {
  batch_name: string;
  source_type: string;
  source_filename?: string;
  target_table: string;
  column_mapping: Record<string, string>;
  data: Record<string, unknown>[];
}): Promise<ImportBatch> {
  return api.post("inventory/import/batches", { json: data }).json<ImportBatch>();
}

export async function processImportBatch(id: string): Promise<void> {
  await api.post(`inventory/import/batches/${id}/process`);
}

export async function cancelImportBatch(id: string): Promise<void> {
  await api.post(`inventory/import/batches/${id}/cancel`);
}

export async function deleteImportBatch(id: string): Promise<void> {
  await api.delete(`inventory/import/batches/${id}`);
}

export async function getImportStats(): Promise<ImportStats> {
  return api.get("inventory/import/stats").json<ImportStats>();
}

export async function validateImportData(data: {
  target_table: string;
  column_mapping: Record<string, string>;
  sample_data: Record<string, unknown>[];
}): Promise<{
  valid: boolean;
  errors: Record<string, unknown>[];
  warnings: Record<string, unknown>[];
}> {
  return api.post("inventory/import/validate", { json: data }).json();
}

export async function analyzeImportSource(data: {
  source_filename?: string;
  source_type?: string;
  sheet_names?: string[];
  headers?: string[];
  sample_data?: Record<string, unknown>[];
}): Promise<ImportAssistantAnalysisResponse> {
  return api.post("inventory/import/assistant/analyze", { json: data }).json<ImportAssistantAnalysisResponse>();
}
