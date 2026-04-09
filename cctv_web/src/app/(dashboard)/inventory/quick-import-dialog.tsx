"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
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
}

type TargetType = "cameras" | "nvrs";

function generateDemoCamerasExcel(): void {
  // Genera y descarga un Excel de demo con datos de camaras
  import("xlsx").then((XLSX) => {
    const rows = [
      {
        nombre: "CAM-001",
        codigo: "C001",
        tipo: "dome",
        modelo: "Hikvision DS-2CD2143G2",
        generacion: "Gen3",
        ip: "192.168.1.101",
        mac: "AA:BB:CC:DD:EE:01",
        resolucion: "4MP",
        megapixeles: 4,
        area: "Acceso Principal",
        zona: "Norte",
        ubicacion: "Entrada principal edificio A",
        serie: "SN-20240101-001",
        estado: "active",
        notas: "",
      },
      {
        nombre: "CAM-002",
        codigo: "C002",
        tipo: "bullet",
        modelo: "Dahua IPC-HFW2831T",
        generacion: "Gen2",
        ip: "192.168.1.102",
        mac: "AA:BB:CC:DD:EE:02",
        resolucion: "8MP",
        megapixeles: 8,
        area: "Estacionamiento",
        zona: "Sur",
        ubicacion: "Nivel 1 estacionamiento zona A",
        serie: "SN-20240101-002",
        estado: "active",
        notas: "",
      },
      {
        nombre: "CAM-003",
        codigo: "C003",
        tipo: "ptz",
        modelo: "Axis P3245-V",
        generacion: "Gen4",
        ip: "192.168.1.103",
        mac: "AA:BB:CC:DD:EE:03",
        resolucion: "2MP",
        megapixeles: 2,
        area: "Almacen",
        zona: "Este",
        ubicacion: "Almacen central techo",
        serie: "SN-20240101-003",
        estado: "active",
        notas: "Camara PTZ con zoom optico x20",
      },
      {
        nombre: "CAM-004",
        codigo: "C004",
        tipo: "dome",
        modelo: "Hikvision DS-2CD2183G2",
        generacion: "Gen3",
        ip: "192.168.1.104",
        mac: "AA:BB:CC:DD:EE:04",
        resolucion: "8MP",
        megapixeles: 8,
        area: "Oficinas",
        zona: "Norte",
        ubicacion: "Pasillo oficinas piso 2",
        serie: "SN-20240101-004",
        estado: "active",
        notas: "",
      },
      {
        nombre: "CAM-005",
        codigo: "C005",
        tipo: "fisheye",
        modelo: "Dahua IPC-EBW81242P",
        generacion: "Gen3",
        ip: "192.168.1.105",
        mac: "AA:BB:CC:DD:EE:05",
        resolucion: "12MP",
        megapixeles: 12,
        area: "Lobby",
        zona: "Centro",
        ubicacion: "Lobby central techo ojo de pez",
        serie: "SN-20240101-005",
        estado: "active",
        notas: "Cobertura 360 grados",
      },
      {
        nombre: "CAM-006",
        codigo: "C006",
        tipo: "bullet",
        modelo: "Hikvision DS-2CD2T47G2",
        generacion: "Gen4",
        ip: "192.168.1.106",
        mac: "AA:BB:CC:DD:EE:06",
        resolucion: "4MP",
        megapixeles: 4,
        area: "Perimetro",
        zona: "Exterior",
        ubicacion: "Barda perimetral norte",
        serie: "SN-20240101-006",
        estado: "inactive",
        notas: "Pendiente revision tecnica",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Camaras");
    XLSX.writeFile(wb, "demo-inventario-camaras.xlsx");
  });
}

function generateDemoNvrsExcel(): void {
  import("xlsx").then((XLSX) => {
    const rows = [
      {
        nombre: "NVR-PRINCIPAL-01",
        codigo: "NVR01",
        modelo: "Hikvision DS-9632NXI-I8",
        ip: "192.168.1.10",
        mac: "BB:CC:DD:EE:FF:01",
        canales_camara: 32,
        almacenamiento_tb: 24,
        dias_grabacion: 30,
        procesador: "Intel Core i5-8400",
        ram_gb: 8,
        sistema_operativo: "Windows 10 IoT",
        service_tag: "HKVST-20240101-01",
        estado: "active",
        notas: "Servidor principal sala de monitoreo",
      },
      {
        nombre: "NVR-BACKUP-01",
        codigo: "NVR02",
        modelo: "Dahua NVR5832-16P-I",
        ip: "192.168.1.11",
        mac: "BB:CC:DD:EE:FF:02",
        canales_camara: 16,
        almacenamiento_tb: 12,
        dias_grabacion: 15,
        procesador: "ARM Cortex-A55",
        ram_gb: 4,
        sistema_operativo: "Linux embebido",
        service_tag: "DAHT-20240101-02",
        estado: "active",
        notas: "NVR de respaldo para camaras perimetrales",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NVR Servers");
    XLSX.writeFile(wb, "demo-inventario-nvr.xlsx");
  });
}

export function QuickInventoryImportDialog({
  open,
  onOpenChange,
  tenantId,
  siteId,
  siteLabel,
  onImported,
}: QuickInventoryImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetType, setTargetType] = useState<TargetType>("cameras");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [preview, setPreview] = useState<{ headers: string[]; count: number } | null>(null);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setIsParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

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
        setPreview({ headers, count: rows.length });
      } catch {
        toast.error("No se pudo leer el archivo. Verifica que sea un Excel o CSV valido.");
        reset();
      } finally {
        setIsParsing(false);
      }
    },
    [reset],
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar inventario desde Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de datos */}
          <div className="space-y-1.5">
            <Label>Tipo de inventario</Label>
            <Select
              value={targetType}
              onValueChange={(v) => setTargetType(v as TargetType)}
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

          {/* Descarga de plantilla */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={generateDemoCamerasExcel}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Plantilla camaras
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={generateDemoNvrsExcel}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Plantilla NVR
            </Button>
          </div>

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
                      {preview.count} filas detectadas — {preview.headers.length} columnas
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
