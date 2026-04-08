export const IMPORT_TARGET_FIELDS = {
  cameras: [
    "name",
    "code",
    "camera_type",
    "camera_model_name",
    "generation",
    "ip_address",
    "mac_address",
    "resolution",
    "megapixels",
    "ips",
    "bitrate_kbps",
    "firmware_version",
    "serial_number",
    "area",
    "zone",
    "location_description",
    "project",
    "status",
    "notes",
    "comments",
    "nvr_name",
    "nvr_server_id",
  ],
  nvr_servers: [
    "name",
    "code",
    "model",
    "ip_address",
    "subnet_mask",
    "gateway",
    "mac_address",
    "camera_channels",
    "tpv_channels",
    "lpr_channels",
    "integration_connections",
    "total_storage_tb",
    "recording_days",
    "service_tag",
    "service_code",
    "processor",
    "ram_gb",
    "os_name",
    "system_type",
    "edition",
    "vms_version",
    "launch_date",
    "installation_date",
    "warranty_expiry_date",
    "status",
    "notes",
  ],
} as const;

export type ImportTargetTable = keyof typeof IMPORT_TARGET_FIELDS;

export const IMPORT_TARGET_LABELS: Record<ImportTargetTable, string> = {
  cameras: "Camaras",
  nvr_servers: "Servidores NVR",
};

export const IMPORT_FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  code: "Codigo",
  camera_type: "Tipo de camara",
  camera_model_name: "Modelo de camara",
  generation: "Generacion",
  ip_address: "IP",
  mac_address: "MAC",
  resolution: "Resolucion",
  megapixels: "Megapixeles",
  ips: "IPS",
  bitrate_kbps: "Bitrate (kbps)",
  firmware_version: "Firmware",
  serial_number: "Serie",
  area: "Area",
  zone: "Zona",
  location_description: "Ubicacion",
  project: "Proyecto",
  status: "Estado",
  notes: "Notas",
  comments: "Comentarios",
  nvr_name: "Nombre NVR",
  nvr_server_id: "ID NVR",
  model: "Modelo",
  subnet_mask: "Mascara de subred",
  gateway: "Gateway",
  camera_channels: "Canales de camara",
  tpv_channels: "Canales TPV",
  lpr_channels: "Canales LPR",
  integration_connections: "Conexiones de integracion",
  total_storage_tb: "Almacenamiento TB",
  recording_days: "Dias de grabacion",
  service_tag: "Service Tag",
  service_code: "Service Code",
  processor: "Procesador",
  ram_gb: "RAM GB",
  os_name: "Sistema operativo",
  system_type: "Tipo de sistema",
  edition: "Edicion",
  vms_version: "Version VMS",
  launch_date: "Fecha de lanzamiento",
  installation_date: "Fecha de instalacion",
  warranty_expiry_date: "Vencimiento garantia",
};

const HEADER_ALIASES: Record<string, string> = {
  nombre: "name",
  "name": "name",
  "nombre de la camara": "name",
  codigo: "code",
  code: "code",
  tipo: "camera_type",
  "tipo de camara": "camera_model_name",
  modelo: "model",
  "modelo de camara": "camera_model_name",
  generacion: "generation",
  ip: "ip_address",
  "direccion ip": "ip_address",
  "direccion_ip": "ip_address",
  mac: "mac_address",
  "mac ": "mac_address",
  mascara: "subnet_mask",
  gateway: "gateway",
  "canales de la camara": "camera_channels",
  "canales camara": "camera_channels",
  canales: "camera_channels",
  almacenamiento: "total_storage_tb",
  "dias de grabacion": "recording_days",
  "service tag": "service_tag",
  procesador: "processor",
  memoria: "ram_gb",
  ram: "ram_gb",
  so: "os_name",
  sistema: "os_name",
  serie: "serial_number",
  firmware: "firmware_version",
  resolucion: "resolution",
  megapixeles: "megapixels",
  megapixels: "megapixels",
  ubicacion: "location_description",
  zona: "zone",
  area: "area",
  proyecto: "project",
  estado: "status",
  notas: "notes",
  comentarios: "comments",
  nvr: "nvr_name",
  "nombre nvr": "nvr_name",
  edicion: "edition",
  version: "vms_version",
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function buildFallbackMapping(
  headers: string[],
  target: ImportTargetTable,
): Record<string, string> {
  const allowedFields = new Set<string>(IMPORT_TARGET_FIELDS[target]);

  return headers.reduce<Record<string, string>>((acc, header) => {
    const mapped = HEADER_ALIASES[normalizeHeader(header)];
    if (mapped && allowedFields.has(mapped)) {
      acc[header] = mapped;
    }
    return acc;
  }, {});
}

export function mergeImportMappings(
  preferred: Record<string, string> | undefined,
  fallback: Record<string, string>,
  target: ImportTargetTable,
): Record<string, string> {
  const allowedFields = new Set<string>(IMPORT_TARGET_FIELDS[target]);
  const merged: Record<string, string> = {};

  for (const [header, field] of Object.entries(fallback)) {
    if (allowedFields.has(field)) {
      merged[header] = field;
    }
  }

  for (const [header, field] of Object.entries(preferred ?? {})) {
    if (allowedFields.has(field)) {
      merged[header] = field;
    }
  }

  return merged;
}

export function getTargetFieldOptions(target: ImportTargetTable): Array<{ value: string; label: string }> {
  return IMPORT_TARGET_FIELDS[target].map((field) => ({
    value: field,
    label: IMPORT_FIELD_LABELS[field] ?? field,
  }));
}

export function buildPreparedImportRows(
  rows: Record<string, unknown>[],
  metadata: { importSource: string; sheetName?: string },
): Record<string, unknown>[] {
  return rows.map((row) => ({
    ...row,
    import_source: metadata.importSource,
    sheet_name: metadata.sheetName ?? "Hoja 1",
  }));
}
