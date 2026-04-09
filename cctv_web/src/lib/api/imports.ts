import { api } from "./client";
import type {
  ImportAssistantAnalysisResponse,
  ImportBatch,
  ImportBatchItem,
  ImportStats,
} from "@/types/api";

// El backend devuelve `status` como NullInventoryImportStatus:
// { inventory_import_status: string, valid: boolean }
// Esta funcion normaliza el shape al string esperado por el frontend.
type RawBatch = Omit<ImportBatch, "status" | "column_mapping"> & {
  status:
    | string
    | { inventory_import_status?: string; valid?: boolean }
    | null
    | undefined;
  column_mapping:
    | string             // base64 cuando viene de []byte Go
    | Record<string, unknown>
    | null
    | undefined;
};

function normalizeImportBatch(raw: RawBatch): ImportBatch {
  // Extraer status del nullable wrapper de Go
  let status = "pending";
  if (typeof raw.status === "string") {
    status = raw.status;
  } else if (raw.status && typeof raw.status === "object") {
    status = (raw.status as { inventory_import_status?: string }).inventory_import_status ?? "pending";
  }

  // Decodificar column_mapping si viene como base64 de []byte
  let columnMapping: Record<string, unknown> = {};
  if (typeof raw.column_mapping === "string") {
    try {
      const decoded = atob(raw.column_mapping);
      columnMapping = JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      columnMapping = {};
    }
  } else if (raw.column_mapping && typeof raw.column_mapping === "object") {
    columnMapping = raw.column_mapping as Record<string, unknown>;
  }

  return { ...raw, status, column_mapping: columnMapping } as ImportBatch;
}

export async function listImportBatches(params?: {
  limit?: number;
  offset?: number;
}): Promise<ImportBatch[]> {
  const searchParams: Record<string, string> = {};
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);
  const raw = await api.get("inventory/import/batches", { searchParams }).json<RawBatch[]>();
  return raw.map(normalizeImportBatch);
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
  const raw = await api.post("inventory/import/batches", { json: data }).json<RawBatch>();
  return normalizeImportBatch(raw);
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
