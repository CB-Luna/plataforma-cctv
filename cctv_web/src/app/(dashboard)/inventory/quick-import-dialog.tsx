"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Info, Upload, X } from "lucide-react";
import { saveLocalCameras, saveLocalNvrs } from "@/lib/inventory/local-store";
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

/* ── Columnas reconocidas por tipo ── */

const CAMERA_COLUMNS: Record<string, string> = {
  nombre: "nombre", name: "nombre",
  codigo: "codigo", code: "codigo",
  tipo: "tipo", camera_type: "tipo",
  modelo: "modelo", camera_model_name: "modelo",
  generacion: "generacion", generation: "generacion",
  ip: "ip", ip_address: "ip",
  mac: "mac", mac_address: "mac",
  resolucion: "resolucion", resolution: "resolucion",
  megapixeles: "megapixeles", megapixels: "megapixeles",
  area: "area",
  zona: "zona", zone: "zona",
  ubicacion: "ubicacion", location_description: "ubicacion",
  serie: "serie", serial_number: "serie",
  estado: "estado", status: "estado",
  notas: "notas", notes: "notas",
};

const NVR_COLUMNS: Record<string, string> = {
  nombre: "nombre", name: "nombre",
  codigo: "codigo", code: "codigo",
  modelo: "modelo", model: "modelo",
  ip: "ip", ip_address: "ip",
  mac: "mac", mac_address: "mac",
  canales_camara: "canales_camara", channels: "canales_camara",
  almacenamiento_tb: "almacenamiento_tb", storage_tb: "almacenamiento_tb",
  dias_grabacion: "dias_grabacion", recording_days: "dias_grabacion",
  procesador: "procesador", processor: "procesador",
  ram_gb: "ram_gb", ram: "ram_gb",
  sistema_operativo: "sistema_operativo", os: "sistema_operativo",
  service_tag: "service_tag",
  estado: "estado", status: "estado",
  notas: "notas", notes: "notas",
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

function getExpectedColumns(type: TargetType) {
  return type === "cameras" ? CAMERA_COLUMNS : NVR_COLUMNS;
}

function getDisplayColumns(type: TargetType) {
  return type === "cameras" ? CAMERA_DISPLAY_COLUMNS : NVR_DISPLAY_COLUMNS;
}

/** Valida columnas del Excel contra las esperadas. Retorna matched y unmatched. */
function validateColumns(headers: string[], type: TargetType) {
  const expected = getExpectedColumns(type);
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const h of headers) {
    const normalized = h.toLowerCase().trim();
    if (expected[normalized]) {
      matched.push(h);
    } else {
      unmatched.push(h);
    }
  }
  return { matched, unmatched };
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

  const reset = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setIsParsing(false);
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

      if (targetType === "cameras") {
        saveLocalCameras(tenantId, siteId, siteLabel, dataRows);
      } else {
        saveLocalNvrs(tenantId, siteId, siteLabel, dataRows);
      }

      const label = targetType === "cameras" ? "camaras" : "servidores NVR";
      toast.success(`${dataRows.length} ${label} importados correctamente`);
      onImported(targetType, dataRows.length);
      handleClose();
    } catch {
      toast.error("Error al procesar el archivo");
    } finally {
      setIsParsing(false);
    }
  }, [selectedFile, preview, targetType, tenantId, siteId, siteLabel, onImported, handleClose]);

  const displayCols = getDisplayColumns(targetType);
  const typeLabel = targetType === "cameras" ? "camaras" : "servidores NVR";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
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
                <div className="max-h-72 overflow-auto rounded border text-xs">
                  <table className="w-full">
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
          {siteLabel && (
            <p className="text-xs text-muted-foreground">
              Los datos se guardaran para: <span className="font-medium">{siteLabel}</span>
            </p>
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
            {isParsing ? "Procesando..." : `Importar ${preview ? `(${preview.count} filas)` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
