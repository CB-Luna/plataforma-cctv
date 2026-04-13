"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Info, Upload, X, Loader2 } from "lucide-react";
import { createCamera } from "@/lib/api/cameras";
import { createNvr } from "@/lib/api/nvrs";
import type { CreateCameraRequest, CreateNvrRequest } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickInventoryImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null | undefined;
  siteId: string | null | undefined;
  siteLabel: string;
  onImported: (type: "cameras" | "nvrs", count: number) => void;
  /** Si se pasa, el dialogo arranca con ese tipo pre-seleccionado */
  defaultType?: "cameras" | "nvrs";
}

type TargetType = "cameras" | "nvrs";

/* ── Mapeo: header del Excel (español o ingles) → campo API real ── */

const CAMERA_HEADER_TO_API: Record<string, string> = {
  nombre: "name", name: "name",
  codigo: "code", code: "code",
  tipo: "camera_type", camera_type: "camera_type",
  modelo: "camera_model_name", camera_model_name: "camera_model_name",
  generacion: "generation", generation: "generation",
  ip: "ip_address", ip_address: "ip_address",
  mac: "mac_address", mac_address: "mac_address",
  resolucion: "resolution", resolution: "resolution",
  megapixeles: "megapixels", megapixels: "megapixels",
  area: "area",
  zona: "zone", zone: "zone",
  ubicacion: "location_description", location_description: "location_description",
  serie: "serial_number", serial_number: "serial_number",
  estado: "status", status: "status",
  notas: "notes", notes: "notes",
};

const NVR_HEADER_TO_API: Record<string, string> = {
  nombre: "name", name: "name",
  codigo: "code", code: "code",
  modelo: "model", model: "model",
  ip: "ip_address", ip_address: "ip_address",
  mac: "mac_address", mac_address: "mac_address",
  canales_camara: "camera_channels", channels: "camera_channels", camera_channels: "camera_channels",
  almacenamiento_tb: "total_storage_tb", storage_tb: "total_storage_tb", total_storage_tb: "total_storage_tb",
  dias_grabacion: "recording_days", recording_days: "recording_days",
  procesador: "processor", processor: "processor",
  ram_gb: "ram_gb", ram: "ram_gb",
  sistema_operativo: "os_name", os: "os_name", os_name: "os_name",
  service_tag: "service_tag",
  estado: "status", status: "status",
  notas: "notes", notes: "notes",
};

const CAMERA_DISPLAY_COLUMNS = [
  "nombre", "codigo", "tipo", "modelo", "generacion", "ip", "mac",
  "resolucion", "megapixeles", "area", "zona", "ubicacion", "serie", "estado", "notas",
];
const NVR_DISPLAY_COLUMNS = [
  "nombre", "codigo", "modelo", "ip", "mac", "canales_camara",
  "almacenamiento_tb", "dias_grabacion", "procesador", "ram_gb",
  "sistema_operativo", "service_tag", "estado", "notas",
];

function getHeaderMap(type: TargetType) {
  return type === "cameras" ? CAMERA_HEADER_TO_API : NVR_HEADER_TO_API;
}

function getDisplayColumns(type: TargetType) {
  return type === "cameras" ? CAMERA_DISPLAY_COLUMNS : NVR_DISPLAY_COLUMNS;
}

/** Valida columnas del Excel contra las esperadas. Retorna matched y unmatched. */
function validateColumns(headers: string[], type: TargetType) {
  const headerMap = getHeaderMap(type);
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const h of headers) {
    const normalized = h.toLowerCase().trim();
    if (headerMap[normalized]) {
      matched.push(h);
    } else {
      unmatched.push(h);
    }
  }
  return { matched, unmatched };
}

/** Convierte una fila del Excel a un objeto con claves API normalizadas. */
function normalizeRow(row: Record<string, unknown>, type: TargetType): Record<string, unknown> {
  const headerMap = getHeaderMap(type);
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const apiField = headerMap[key.toLowerCase().trim()];
    if (apiField) {
      normalized[apiField] = value;
    }
  }
  return normalized;
}

function generateTemplateExcel(type: TargetType): void {
  import("xlsx").then((XLSX) => {
    const cols = getDisplayColumns(type);
    // Crear hoja con una fila vacia que solo tenga los encabezados
    const ws = XLSX.utils.aoa_to_sheet([cols]);
    const wb = XLSX.utils.book_new();
    const sheetName = type === "cameras" ? "Camaras" : "NVR Servers";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileName = type === "cameras"
      ? "plantilla-camaras.xlsx"
      : "plantilla-nvr.xlsx";
    XLSX.writeFile(wb, fileName);
  });
}

export function QuickInventoryImportDialog({
  open,
  onOpenChange,
  tenantId,
  siteId,
  siteLabel,
  onImported,
  defaultType,
}: QuickInventoryImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetType, setTargetType] = useState<TargetType>(defaultType ?? "cameras");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [preview, setPreview] = useState<{
    headers: string[];
    count: number;
    matched: string[];
    unmatched: string[];
    sampleRows: Record<string, unknown>[];
  } | null>(null);

  const [importProgress, setImportProgress] = useState<{ done: number; total: number; errors: number } | null>(null);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setIsParsing(false);
    setImportProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    reset();
    setTargetType(defaultType ?? "cameras");
    onOpenChange(false);
  }, [reset, onOpenChange, defaultType]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSelectedFile(file);
      setIsParsing(true);
      setPreview(null);

      try {
        const XLSX = await import("xlsx");
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) {
          toast.error("El archivo no tiene hojas de datos");
          reset();
          return;
        }
        const ws = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
          raw: false,
        });
        const headers = rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
        const { matched, unmatched } = validateColumns(headers, targetType);

        if (matched.length === 0) {
          toast.error(
            `Ninguna columna del archivo coincide con las esperadas para ${targetType === "cameras" ? "camaras" : "NVR"}. Revisa los encabezados.`,
          );
          reset();
          return;
        }

        const sampleRows = rows.slice(0, 5);
        setPreview({ headers, count: rows.length, matched, unmatched, sampleRows });
      } catch {
        toast.error("No se pudo leer el archivo. Verifica que sea un Excel o CSV valido.");
        reset();
      } finally {
        setIsParsing(false);
      }
    },
    [reset, targetType],
  );

  const handleImport = useCallback(async () => {
    if (!selectedFile || !preview) return;
    setIsParsing(true);
    setImportProgress(null);

    try {
      const XLSX = await import("xlsx");
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const ws = workbook.Sheets[firstSheet!];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: "",
        raw: false,
      });

      const dataRows = rows.filter((row) =>
        Object.values(row).some((v) => String(v ?? "").trim() !== ""),
      );

      if (dataRows.length === 0) {
        toast.error("El archivo no tiene datos para importar");
        return;
      }

      // Normalizar headers del Excel al formato de la API
      const normalizedRows = dataRows.map((row) => normalizeRow(row, targetType));

      let done = 0;
      let errors = 0;
      const total = normalizedRows.length;
      setImportProgress({ done: 0, total, errors: 0 });

      // Enviar cada fila al backend (en lotes de 5 para no saturar)
      const BATCH_SIZE = 5;
      for (let i = 0; i < normalizedRows.length; i += BATCH_SIZE) {
        const batch = normalizedRows.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((normalized) => {
            if (targetType === "cameras") {
              const req: CreateCameraRequest = {
                name: String(normalized.name || `Camara ${done + 1}`),
                code: normalized.code ? String(normalized.code) : undefined,
                camera_type: normalized.camera_type ? String(normalized.camera_type) : undefined,
                camera_model_name: normalized.camera_model_name ? String(normalized.camera_model_name) : undefined,
                generation: normalized.generation ? String(normalized.generation) : undefined,
                ip_address: normalized.ip_address ? String(normalized.ip_address) : undefined,
                mac_address: normalized.mac_address ? String(normalized.mac_address) : undefined,
                resolution: normalized.resolution ? String(normalized.resolution) : undefined,
                megapixels: normalized.megapixels ? Number(normalized.megapixels) : undefined,
                area: normalized.area ? String(normalized.area) : undefined,
                zone: normalized.zone ? String(normalized.zone) : undefined,
                location_description: normalized.location_description ? String(normalized.location_description) : undefined,
                serial_number: normalized.serial_number ? String(normalized.serial_number) : undefined,
                status: normalized.status ? String(normalized.status) : "active",
                notes: normalized.notes ? String(normalized.notes) : undefined,
                site_id: siteId || undefined,
              };
              return createCamera(req);
            } else {
              const req: CreateNvrRequest = {
                name: String(normalized.name || `NVR ${done + 1}`),
                code: normalized.code ? String(normalized.code) : undefined,
                model: normalized.model ? String(normalized.model) : undefined,
                ip_address: normalized.ip_address ? String(normalized.ip_address) : undefined,
                mac_address: normalized.mac_address ? String(normalized.mac_address) : undefined,
                camera_channels: normalized.camera_channels ? Number(normalized.camera_channels) : undefined,
                total_storage_tb: normalized.total_storage_tb ? Number(normalized.total_storage_tb) : undefined,
                recording_days: normalized.recording_days ? Number(normalized.recording_days) : undefined,
                processor: normalized.processor ? String(normalized.processor) : undefined,
                ram_gb: normalized.ram_gb ? Number(normalized.ram_gb) : undefined,
                os_name: normalized.os_name ? String(normalized.os_name) : undefined,
                service_tag: normalized.service_tag ? String(normalized.service_tag) : undefined,
                status: normalized.status ? String(normalized.status) : "active",
                notes: normalized.notes ? String(normalized.notes) : undefined,
                site_id: siteId || undefined,
              };
              return createNvr(req);
            }
          }),
        );

        for (const r of results) {
          done++;
          if (r.status === "rejected") errors++;
        }
        setImportProgress({ done, total, errors });
      }

      const label = targetType === "cameras" ? "cámaras" : "servidores NVR";
      if (errors === 0) {
        toast.success(`${done} ${label} importados correctamente al servidor`);
      } else {
        toast.warning(`${done - errors} de ${done} ${label} importados. ${errors} fallaron.`);
      }
      onImported(targetType, done - errors);
      handleClose();
    } catch {
      toast.error("Error al procesar el archivo");
    } finally {
      setIsParsing(false);
    }
  }, [selectedFile, preview, targetType, siteId, onImported, handleClose]);

  const displayCols = getDisplayColumns(targetType);
  const typeLabel = targetType === "cameras" ? "camaras" : "servidores NVR";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar {typeLabel} desde Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de datos */}
          <div className="space-y-1.5">
            <Label>Tipo de inventario</Label>
            <Select
              value={targetType}
              onValueChange={(v) => {
                setTargetType(v as TargetType);
                reset(); // limpiar preview al cambiar tipo
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cameras">Camaras</SelectItem>
                <SelectItem value="nvrs">Servidores NVR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Columnas esperadas */}
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
              <Info className="h-3.5 w-3.5" />
              Columnas esperadas para {typeLabel}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              {displayCols.join(", ")}
            </p>
          </div>

          {/* Descarga de plantilla (solo la relevante) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => generateTemplateExcel(targetType)}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Descargar plantilla {typeLabel}
          </Button>

          {/* Area de carga */}
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-8 text-center transition-colors hover:bg-muted/40"
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  {preview && (
                    <p className="text-xs text-muted-foreground">
                      {preview.count} filas detectadas — {preview.matched.length} columnas reconocidas
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="ml-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium">Arrastra o haz clic para seleccionar</p>
                <p className="mt-1 text-xs text-muted-foreground">Excel (.xlsx) o CSV</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Resultado de validacion de columnas */}
          {preview && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {preview.matched.length} columnas reconocidas: {preview.matched.join(", ")}
              </div>
              {preview.unmatched.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {preview.unmatched.length} columnas ignoradas: {preview.unmatched.join(", ")}
                </div>
              )}
              {/* Preview de filas */}
              {preview.sampleRows.length > 0 && (
                <div className="max-h-72 overflow-auto rounded border text-xs" style={{ maxWidth: "100%" }}>
                  <table className="min-w-max">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-muted/50">
                        {preview.matched.map((h) => (
                          <th key={h} className="whitespace-nowrap px-3 py-1.5 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sampleRows.map((row, i) => (
                        <tr key={i} className="border-t">
                          {preview.matched.map((h) => (
                            <td key={h} className="whitespace-nowrap px-3 py-1.5">
                              {String(row[h] ?? "—")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.count > preview.sampleRows.length && (
                    <p className="px-3 py-1.5 text-muted-foreground">... y {preview.count - preview.sampleRows.length} filas mas</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contexto */}
          {siteId && siteLabel ? (
            <p className="text-xs text-muted-foreground">
              Los datos se guardaran en el servidor para: <span className="font-medium">{siteLabel}</span>
            </p>
          ) : (
            <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              No hay sucursal seleccionada. Las cámaras/NVRs se crearán sin asignar a una sucursal.
            </div>
          )}

          {/* Progreso */}
          {importProgress && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Importando: {importProgress.done} de {importProgress.total}
                {importProgress.errors > 0 && (
                  <span className="text-red-600"> ({importProgress.errors} errores)</span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || !preview || isParsing}
          >
            {isParsing ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Importando...
              </>
            ) : (
              `Importar al servidor ${preview ? `(${preview.count} filas)` : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
