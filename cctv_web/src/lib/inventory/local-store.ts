/**
 * Almacenamiento local de inventario para demo y modo offline.
 * Persiste en localStorage bajo la clave INVENTORY_LOCAL_KEY.
 * Los datos sobreviven recargas de pagina pero no entre dispositivos/sesiones limpias.
 */

import type { Camera, NvrServer } from "@/types/api";

const INVENTORY_LOCAL_KEY = "cctv_inventory_local_v1";

export interface LocalInventoryRow {
  id: string;
  source: "local"; // distingue de datos reales del backend
  importedAt: string;
  tenantKey: string; // formato: "{tenantId}_{siteId}" o "{tenantId}" o "platform"
}

export type LocalCamera = Camera & LocalInventoryRow;
export type LocalNvr = NvrServer & LocalInventoryRow;

export interface LocalInventoryBucket {
  cameras: LocalCamera[];
  nvrs: LocalNvr[];
  importedAt: string;
  label: string; // etiqueta legible (ej: "Sucursal Norte - Bimbo")
}

type InventoryStore = Record<string, LocalInventoryBucket>;

function buildKey(tenantId: string | null | undefined, siteId: string | null | undefined): string {
  if (tenantId && siteId) return `${tenantId}_${siteId}`;
  if (tenantId) return tenantId;
  return "platform";
}

function readStore(): InventoryStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(INVENTORY_LOCAL_KEY);
    return raw ? (JSON.parse(raw) as InventoryStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: InventoryStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INVENTORY_LOCAL_KEY, JSON.stringify(store));
  } catch {
    // localStorage lleno o en modo privado — ignorar silenciosamente
  }
}

/** Obtiene el bucket de inventario local para la combinacion tenant+site. */
export function getLocalInventory(
  tenantId: string | null | undefined,
  siteId: string | null | undefined,
): LocalInventoryBucket | null {
  const store = readStore();
  const key = buildKey(tenantId, siteId);
  return store[key] ?? null;
}

/** Guarda un lote de camaras importadas desde Excel para tenant+site. */
export function saveLocalCameras(
  tenantId: string | null | undefined,
  siteId: string | null | undefined,
  siteLabel: string,
  rows: Record<string, unknown>[],
): LocalCamera[] {
  const store = readStore();
  const key = buildKey(tenantId, siteId);
  const now = new Date().toISOString();

  const existing = store[key] ?? { cameras: [], nvrs: [], importedAt: now, label: siteLabel };

  const cameras: LocalCamera[] = rows.map((row, i) => ({
    id: `local_cam_${Date.now()}_${i}`,
    source: "local",
    importedAt: now,
    tenantKey: key,
    tenant_id: tenantId ?? "local",
    name: String(row.name ?? row.nombre ?? row["Nombre"] ?? `Camara ${i + 1}`),
    code: row.code ? String(row.code) : undefined,
    camera_type: row.camera_type ? String(row.camera_type) : row.tipo ? String(row.tipo) : undefined,
    camera_model_name: row.camera_model_name
      ? String(row.camera_model_name)
      : row.modelo
        ? String(row.modelo)
        : undefined,
    generation: row.generation ? String(row.generation) : undefined,
    ip_address: row.ip_address
      ? String(row.ip_address)
      : row.ip
        ? String(row.ip)
        : undefined,
    mac_address: row.mac_address ? String(row.mac_address) : undefined,
    resolution: row.resolution ? String(row.resolution) : undefined,
    megapixels: row.megapixels ? Number(row.megapixels) : undefined,
    area: row.area ? String(row.area) : undefined,
    zone: row.zone ? String(row.zone) : row.zona ? String(row.zona) : undefined,
    location_description: row.location_description
      ? String(row.location_description)
      : row.ubicacion
        ? String(row.ubicacion)
        : undefined,
    serial_number: row.serial_number
      ? String(row.serial_number)
      : row.serie
        ? String(row.serie)
        : undefined,
    status: row.status
      ? String(row.status)
      : row.estado
        ? String(row.estado)
        : "active",
    notes: row.notes ? String(row.notes) : row.notas ? String(row.notas) : undefined,
    site_id: siteId ?? undefined,
    is_active: true,
    created_at: now,
    updated_at: now,
  }));

  store[key] = {
    ...existing,
    cameras: [...existing.cameras, ...cameras],
    importedAt: now,
    label: siteLabel,
  };

  writeStore(store);
  return cameras;
}

/** Guarda un lote de NVRs importados desde Excel para tenant+site. */
export function saveLocalNvrs(
  tenantId: string | null | undefined,
  siteId: string | null | undefined,
  siteLabel: string,
  rows: Record<string, unknown>[],
): LocalNvr[] {
  const store = readStore();
  const key = buildKey(tenantId, siteId);
  const now = new Date().toISOString();

  const existing = store[key] ?? { cameras: [], nvrs: [], importedAt: now, label: siteLabel };

  const nvrs: LocalNvr[] = rows.map((row, i) => ({
    id: `local_nvr_${Date.now()}_${i}`,
    source: "local",
    importedAt: now,
    tenantKey: key,
    tenant_id: tenantId ?? "local",
    name: String(row.name ?? row.nombre ?? `NVR ${i + 1}`),
    code: row.code ? String(row.code) : undefined,
    model: row.model ? String(row.model) : row.modelo ? String(row.modelo) : undefined,
    ip_address: row.ip_address ? String(row.ip_address) : row.ip ? String(row.ip) : undefined,
    mac_address: row.mac_address ? String(row.mac_address) : undefined,
    camera_channels: row.camera_channels ? Number(row.camera_channels) : undefined,
    total_storage_tb: row.total_storage_tb ? Number(row.total_storage_tb) : undefined,
    recording_days: row.recording_days ? Number(row.recording_days) : undefined,
    service_tag: row.service_tag ? String(row.service_tag) : undefined,
    processor: row.processor ? String(row.processor) : undefined,
    ram_gb: row.ram_gb ? Number(row.ram_gb) : undefined,
    os_name: row.os_name ? String(row.os_name) : undefined,
    status: row.status ? String(row.status) : row.estado ? String(row.estado) : "active",
    notes: row.notes ? String(row.notes) : row.notas ? String(row.notas) : undefined,
    site_id: siteId ?? undefined,
    is_active: true,
    created_at: now,
    updated_at: now,
  }));

  store[key] = {
    ...existing,
    nvrs: [...existing.nvrs, ...nvrs],
    importedAt: now,
    label: siteLabel,
  };

  writeStore(store);
  return nvrs;
}

/** Limpia el inventario local para tenant+site. */
export function clearLocalInventory(
  tenantId: string | null | undefined,
  siteId: string | null | undefined,
): void {
  const store = readStore();
  const key = buildKey(tenantId, siteId);
  delete store[key];
  writeStore(store);
}

/** Lista todas las claves con inventario local guardado. */
export function listLocalInventoryKeys(): string[] {
  return Object.keys(readStore());
}
