"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import { analyzeImportSource, validateImportData } from "@/lib/api/imports";
import {
  IMPORT_TARGET_LABELS,
  buildFallbackMapping,
  buildPreparedImportRows,
  getTargetFieldOptions,
  mergeImportMappings,
  type ImportTargetTable,
} from "@/lib/imports/mapping";
import type { ImportAssistantAnalysisResponse } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Sparkles } from "lucide-react";

const importSchema = z.object({
  batch_name: z.string().min(1, "Nombre requerido"),
  source_type: z.enum(["excel", "csv"]),
  target_table: z.enum(["cameras", "nvr_servers"]),
  source_filename: z.string().optional(),
});

export type ImportFormValues = z.infer<typeof importSchema>;

export interface ImportSubmissionPayload extends ImportFormValues {
  column_mapping: Record<string, string>;
  data: Record<string, unknown>[];
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ImportSubmissionPayload) => void;
  isLoading?: boolean;
}

interface SheetPreview {
  headers: string[];
  rows: Record<string, unknown>[];
}

interface ValidationFeedback {
  valid: boolean;
  errors: Record<string, unknown>[];
  warnings: Record<string, unknown>[];
}

const TARGET_OPTIONS: Array<{ value: ImportTargetTable; label: string }> = [
  { value: "cameras", label: IMPORT_TARGET_LABELS.cameras },
  { value: "nvr_servers", label: IMPORT_TARGET_LABELS.nvr_servers },
];

function getFileSourceType(fileName: string): ImportFormValues["source_type"] {
  return fileName.toLowerCase().endsWith(".csv") ? "csv" : "excel";
}

export function ImportDialog({ open, onOpenChange, onSubmit, isLoading }: ImportDialogProps) {
  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      batch_name: "",
      source_type: "csv",
      target_table: "cameras",
      source_filename: "",
    },
  });

  const [sheetData, setSheetData] = useState<Record<string, SheetPreview>>({});
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<ImportAssistantAnalysisResponse | null>(null);
  const [validation, setValidation] = useState<ValidationFeedback | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const targetTable = form.watch("target_table");
  const currentSheet = selectedSheet ? sheetData[selectedSheet] : undefined;
  const headers = currentSheet?.headers ?? [];
  const rows = currentSheet?.rows ?? [];
  const fieldOptions = useMemo(() => getTargetFieldOptions(targetTable), [targetTable]);

  useEffect(() => {
    if (!open) {
      form.reset({
        batch_name: "",
        source_type: "csv",
        target_table: "cameras",
        source_filename: "",
      });
      setSheetData({});
      setSheetNames([]);
      setSelectedSheet("");
      setColumnMapping({});
      setAnalysis(null);
      setValidation(null);
      setIsParsing(false);
      setIsAnalyzing(false);
    }
  }, [form, open]);

  useEffect(() => {
    if (!headers.length) {
      setColumnMapping({});
      setAnalysis(null);
      return;
    }

    let cancelled = false;
    const fallback = buildFallbackMapping(headers, targetTable);

    async function runAssistant() {
      setIsAnalyzing(true);
      try {
        const assistant = await analyzeImportSource({
          source_filename: form.getValues("source_filename"),
          source_type: form.getValues("source_type"),
          sheet_names: sheetNames,
          headers,
          sample_data: rows.slice(0, 5),
        });

        if (cancelled) return;

        setAnalysis(assistant);
        setColumnMapping(
          mergeImportMappings(assistant.recommended_mappings?.[targetTable], fallback, targetTable),
        );
      } catch {
        if (cancelled) return;
        setAnalysis(null);
        setColumnMapping(fallback);
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    }

    runAssistant();

    return () => {
      cancelled = true;
    };
  }, [form, headers, rows, sheetNames, targetTable]);

  async function parseFile(file: File) {
    setIsParsing(true);
    setValidation(null);
    setAnalysis(null);

    try {
      const XLSX = await import("xlsx");
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const previews: Record<string, SheetPreview> = {};

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: "",
          raw: false,
        });
        const sheetHeaders = jsonRows.length > 0 ? Object.keys(jsonRows[0] ?? {}) : [];

        if (sheetHeaders.length > 0) {
          previews[sheetName] = {
            headers: sheetHeaders,
            rows: jsonRows.filter((row) =>
              Object.values(row).some((value) => String(value ?? "").trim() !== ""),
            ),
          };
        }
      }

      const availableSheets = Object.keys(previews);
      if (availableSheets.length === 0) {
        toast.error("El archivo no contiene filas utilizables");
        setSheetData({});
        setSheetNames([]);
        setSelectedSheet("");
        setColumnMapping({});
        return;
      }

      setSheetData(previews);
      setSheetNames(availableSheets);
      setSelectedSheet(availableSheets[0]);
      form.setValue("source_filename", file.name);
      form.setValue("source_type", getFileSourceType(file.name));

      if (!form.getValues("batch_name").trim()) {
        const batchName = file.name.replace(/\.[^.]+$/, "");
        form.setValue("batch_name", `Importacion ${batchName}`);
      }
    } catch {
      toast.error("No se pudo leer el archivo seleccionado");
      setSheetData({});
      setSheetNames([]);
      setSelectedSheet("");
      setColumnMapping({});
    } finally {
      setIsParsing(false);
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await parseFile(file);
  };

  const handleMappingChange = (header: string, field: string) => {
    setValidation(null);
    setColumnMapping((current) => ({
      ...current,
      [header]: field === "__ignore__" ? "" : field,
    }));
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!rows.length || !headers.length) {
      toast.error("Selecciona un archivo con datos antes de crear el lote");
      return;
    }

    const effectiveMapping = Object.fromEntries(
      Object.entries(columnMapping).filter(([, value]) => Boolean(value)),
    );

    if (!Object.values(effectiveMapping).includes("name")) {
      toast.error("Mapea al menos una columna hacia Nombre antes de importar");
      return;
    }

    try {
      const validationResult = await validateImportData({
        target_table: values.target_table,
        column_mapping: effectiveMapping,
        sample_data: rows.slice(0, 10),
      });

      setValidation(validationResult);

      if (!validationResult.valid) {
        toast.error("Corrige el mapeo antes de crear el lote");
        return;
      }

      onSubmit({
        ...values,
        column_mapping: effectiveMapping,
        data: buildPreparedImportRows(rows, {
          importSource: values.source_filename ?? values.batch_name,
          sheetName: selectedSheet,
        }),
      });
    } catch {
      toast.error("No se pudo validar la importacion");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva importacion</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="batch_name">Nombre del lote</Label>
              <Input
                id="batch_name"
                placeholder="Ej: Importacion CCTV norte"
                {...form.register("batch_name")}
              />
              {form.formState.errors.batch_name && (
                <p className="text-sm text-destructive">{form.formState.errors.batch_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tabla destino</Label>
              <Select
                value={targetTable}
                onValueChange={(value) => {
                  form.setValue("target_table", value as ImportTargetTable);
                  setValidation(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-dashed">
            <CardContent className="space-y-4 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium">Archivo fuente</p>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceptados: CSV, XLSX, XLS.
                  </p>
                </div>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="max-w-sm"
                />
              </div>

              {form.watch("source_filename") && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Archivo: {form.watch("source_filename")}</span>
                  <span>Tipo: {form.watch("source_type").toUpperCase()}</span>
                  {selectedSheet && <span>Hoja activa: {selectedSheet}</span>}
                </div>
              )}
            </CardContent>
          </Card>

          {(isParsing || isAnalyzing) && (
            <Card className="border-sky-200 bg-sky-50/80">
              <CardContent className="flex items-center gap-3 py-4 text-sm text-sky-950">
                <Loader2 className="h-4 w-4 animate-spin text-sky-700" />
                {isParsing ? "Leyendo archivo y detectando hojas..." : "Analizando headers y preparando mapeo recomendado..."}
              </CardContent>
            </Card>
          )}

          {!!sheetNames.length && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-3 py-4">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Filas detectadas</p>
                      <p className="text-lg font-semibold">{rows.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 py-4">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Columnas detectadas</p>
                      <p className="text-lg font-semibold">{headers.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 py-4">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Columnas mapeadas</p>
                      <p className="text-lg font-semibold">
                        {Object.values(columnMapping).filter(Boolean).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 py-4">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Resultado validacion</p>
                      <p className="text-lg font-semibold">
                        {validation ? (validation.valid ? "OK" : "Revisar") : "Pendiente"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {sheetNames.length > 1 && (
                <div className="space-y-2">
                  <Label>Hoja a importar</Label>
                  <Select value={selectedSheet} onValueChange={(value) => setSelectedSheet(value ?? "")}>
                    <SelectTrigger className="max-w-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetNames.map((sheetName) => (
                        <SelectItem key={sheetName} value={sheetName}>
                          {sheetName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {analysis?.findings?.length ? (
                <Card className="border-sky-200 bg-sky-50/80">
                  <CardContent className="space-y-2 py-4 text-sm text-sky-950">
                    <div className="flex items-center gap-2 font-medium">
                      <Sparkles className="h-4 w-4 text-sky-700" />
                      Analisis del archivo
                    </div>
                    {analysis.template_name && (
                      <p className="text-xs text-sky-800">
                        Plantilla detectada: {analysis.template_name} ({Math.round((analysis.confidence ?? 0) * 100)}%).
                      </p>
                    )}
                    {analysis.suggested_targets?.length ? (
                      <p className="text-xs text-sky-800">
                        Destino sugerido: {analysis.suggested_targets.map((target) => IMPORT_TARGET_LABELS[target as ImportTargetTable] ?? target).join(", ")}.
                      </p>
                    ) : null}
                    {analysis.findings.map((finding) => (
                      <p key={finding} className="text-xs text-sky-800">
                        {finding}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Mapeo de columnas</h3>
                  <p className="text-xs text-muted-foreground">
                    Ajusta el destino de cada columna antes de crear el lote. Solo las columnas mapeadas
                    se incluiran en la importacion.
                  </p>
                </div>

                <div className="grid gap-3">
                  {headers.map((header) => (
                    <div key={header} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr]">
                      <div>
                        <p className="text-xs text-muted-foreground">Columna origen</p>
                        <p className="font-medium">{header}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Campo destino</Label>
                        <Select
                          value={columnMapping[header] || "__ignore__"}
                          onValueChange={(value) => handleMappingChange(header, value ?? "__ignore__")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Ignorar columna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__ignore__">Ignorar columna</SelectItem>
                            {fieldOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {validation && (
                <Card className={validation.valid ? "border-emerald-200 bg-emerald-50/80" : "border-amber-200 bg-amber-50/80"}>
                  <CardContent className="space-y-2 py-4 text-sm">
                    <p className={`font-medium ${validation.valid ? "text-emerald-950" : "text-amber-950"}`}>
                      {validation.valid ? "Validacion lista para crear lote" : "Hay observaciones antes de crear el lote"}
                    </p>
                    {validation.errors.slice(0, 4).map((error, index) => (
                      <p key={`error-${index}`} className="text-xs text-amber-900">
                        Error: {String(error.message ?? "Revisa el mapeo")}
                      </p>
                    ))}
                    {validation.warnings.slice(0, 4).map((warning, index) => (
                      <p key={`warning-${index}`} className={`text-xs ${validation.valid ? "text-emerald-900" : "text-amber-900"}`}>
                        Aviso: {String(warning.message ?? "Advertencia de validacion")}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isParsing || isAnalyzing || !rows.length}>
              {isLoading ? "Creando..." : "Crear lote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
