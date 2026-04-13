"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCameras } from "@/lib/api/cameras";
import { searchSemanticModels } from "@/lib/api/intelligence";
import type { Camera, SemanticModelSearchResult, PDFAnalysisResult, PDFExtractedModel } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera as CameraIcon,
  Search,
  ChevronDown,
  ChevronRight,
  Video,
  Cpu,
  Activity,
  Eye,
  Layers,
  Brain,
  FileText,
  Upload,
  Loader2,
  Sparkles,
  CheckCircle,
  XCircle,
  Thermometer,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Helpers ─────────────────────────────────────────────── */

/** Safely extract a string from camera_type which may arrive as string or object */
function extractCameraType(type: unknown): string {
  if (!type) return "";
  if (typeof type === "string") return type;
  if (typeof type === "object" && type !== null) {
    const obj = type as Record<string, unknown>;
    return String(obj.name ?? obj.label ?? obj.code ?? obj.type ?? "");
  }
  return String(type);
}

interface CameraModelGroup {
  modelName: string;
  cameraType: string;
  count: number;
  activeCount: number;
  resolutions: string[];
  avgMegapixels: number;
  avgIps: number;
  avgQuality: number;
  generations: string[];
  cameras: Camera[];
}

function groupCamerasByModel(cameras: Camera[]): CameraModelGroup[] {
  const map = new Map<string, Camera[]>();
  for (const cam of cameras) {
    const key = cam.camera_model_name || "Sin modelo";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(cam);
  }

  const groups: CameraModelGroup[] = [];
  for (const [modelName, cams] of map) {
    const resolutions = [...new Set(cams.map((c) => c.resolution).filter(Boolean))] as string[];
    const generations = [...new Set(cams.map((c) => c.generation).filter(Boolean))] as string[];
    const megapixels = cams.filter((c) => c.megapixels).map((c) => c.megapixels!);
    const ipsValues = cams.filter((c) => c.ips).map((c) => c.ips!);
    const qualityValues = cams.filter((c) => c.quality).map((c) => c.quality!);

    groups.push({
      modelName,
      cameraType: extractCameraType(cams[0]?.camera_type) || "Desconocido",
      count: cams.length,
      activeCount: cams.filter((c) => c.is_active).length,
      resolutions,
      avgMegapixels: megapixels.length ? Math.round((megapixels.reduce((a, b) => a + b, 0) / megapixels.length) * 10) / 10 : 0,
      avgIps: ipsValues.length ? Math.round(ipsValues.reduce((a, b) => a + b, 0) / ipsValues.length) : 0,
      avgQuality: qualityValues.length ? Math.round(qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length) : 0,
      generations,
      cameras: cams,
    });
  }

  return groups.sort((a, b) => b.count - a.count);
}

function cameraTypeLabel(type: unknown): string {
  const key = extractCameraType(type).toLowerCase();
  const labels: Record<string, string> = {
    dome: "Fija domo",
    bullet: "Fija bullet",
    ptz: "PTZ",
    panoramic: "Panorámica 360°",
    fisheye: "Fisheye",
    box: "Box",
  };
  return labels[key] ?? (extractCameraType(type) || "Desconocido");
}

function cameraTypeBadgeColor(type: unknown): string {
  const key = extractCameraType(type).toLowerCase();
  const colors: Record<string, string> = {
    dome: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    bullet: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    ptz: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    panoramic: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    fisheye: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  };
  return colors[key] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
}

/* ── Page Component ──────────────────────────────────────── */

export default function CameraModelsPage() {
  // ── Estado: Tab inventario ──
  const [search, setSearch] = useState("");
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  // ── Estado: Busqueda semantica ──
  const [semanticQuery, setSemanticQuery] = useState("");
  const [semanticResults, setSemanticResults] = useState<SemanticModelSearchResult[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState<string | null>(null);

  // ── Estado: Analisis PDF ──
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfQuery, setPdfQuery] = useState("");
  const [pdfResult, setPdfResult] = useState<PDFAnalysisResult | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Query de inventario ──
  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => listCameras({ limit: 500 }),
    refetchOnWindowFocus: false,
  });

  const groups = useMemo(() => groupCamerasByModel(cameras), [cameras]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter(
      (g) =>
        g.modelName.toLowerCase().includes(q) ||
        g.cameraType.toLowerCase().includes(q) ||
        g.resolutions.some((r) => r.toLowerCase().includes(q))
    );
  }, [groups, search]);

  const totalModels = groups.length;
  const totalCameras = cameras.length;
  const totalActive = cameras.filter((c) => c.is_active).length;

  // ── Handler: busqueda semantica ──
  const handleSemanticSearch = useCallback(async () => {
    if (!semanticQuery.trim()) return;
    setSemanticLoading(true);
    setSemanticError(null);
    try {
      const results = await searchSemanticModels(semanticQuery, 10);
      setSemanticResults(results);
    } catch (err) {
      setSemanticError(err instanceof Error ? err.message : "Error al buscar modelos");
      setSemanticResults([]);
    } finally {
      setSemanticLoading(false);
    }
  }, [semanticQuery]);

  // ── Handler: analisis PDF ──
  const handlePdfAnalysis = useCallback(async () => {
    if (!pdfFile || !geminiApiKey.trim()) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const buffer = await pdfFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const res = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64: base64,
          fileName: pdfFile.name,
          apiKey: geminiApiKey,
          query: pdfQuery || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data: PDFAnalysisResult = await res.json();
      setPdfResult(data);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Error al analizar PDF");
      setPdfResult(null);
    } finally {
      setPdfLoading(false);
    }
  }, [pdfFile, geminiApiKey, pdfQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fichas Técnicas</h2>
          <p className="text-muted-foreground">
            Catálogo de modelos, búsqueda inteligente y análisis de documentos.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalModels}</p>
              <p className="text-xs text-muted-foreground">Modelos únicos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-lg bg-teal-100 p-2 dark:bg-teal-900/30">
              <CameraIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCameras}</p>
              <p className="text-xs text-muted-foreground">Cámaras totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalActive}</p>
              <p className="text-xs text-muted-foreground">Activas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══════ Tabs principales ══════ */}
      <Tabs defaultValue="inventario" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventario" className="gap-2">
            <CameraIcon className="h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="busqueda-ia" className="gap-2">
            <Brain className="h-4 w-4" />
            Búsqueda IA
          </TabsTrigger>
          <TabsTrigger value="analisis-pdf" className="gap-2">
            <FileText className="h-4 w-4" />
            Análisis PDF
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Inventario existente ── */}
        <TabsContent value="inventario" className="space-y-4">
          {/* Buscador */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por modelo, tipo o resolución..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tarjetas de modelos */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CameraIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {search ? "No se encontraron modelos que coincidan con la búsqueda." : "No hay cámaras registradas en el inventario."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredGroups.map((group) => {
                const isExpanded = expandedModel === group.modelName;
                return (
                  <Card key={group.modelName} className="overflow-hidden transition-shadow hover:shadow-md">
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 p-4 text-left"
                      onClick={() => setExpandedModel(isExpanded ? null : group.modelName)}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Video className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{group.modelName}</span>
                          <Badge variant="outline" className={cameraTypeBadgeColor(group.cameraType)}>
                            {cameraTypeLabel(group.cameraType)}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {group.resolutions.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {group.resolutions.join(", ")}
                            </span>
                          )}
                          {group.avgMegapixels > 0 && (
                            <span className="flex items-center gap-1">
                              <Cpu className="h-3 w-3" />
                              {group.avgMegapixels} MP
                            </span>
                          )}
                          {group.avgIps > 0 && <span>{group.avgIps} IPS</span>}
                          {group.avgQuality > 0 && <span>Calidad: {group.avgQuality}%</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <span className="font-semibold">{group.count}</span>
                          <span className="ml-1 text-muted-foreground">unidad{group.count !== 1 ? "es" : ""}</span>
                        </div>
                        <Badge variant={group.activeCount === group.count ? "default" : "secondary"} className="text-xs">
                          {group.activeCount} activa{group.activeCount !== 1 ? "s" : ""}
                        </Badge>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="p-4">
                          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-lg border bg-white p-3 dark:bg-gray-900">
                              <p className="text-xs text-muted-foreground">Tipo</p>
                              <p className="font-medium text-sm">{cameraTypeLabel(group.cameraType)}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-3 dark:bg-gray-900">
                              <p className="text-xs text-muted-foreground">Resolución(es)</p>
                              <p className="font-medium text-sm">{group.resolutions.join(", ") || "—"}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-3 dark:bg-gray-900">
                              <p className="text-xs text-muted-foreground">Megapíxeles (prom.)</p>
                              <p className="font-medium text-sm">{group.avgMegapixels > 0 ? `${group.avgMegapixels} MP` : "—"}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-3 dark:bg-gray-900">
                              <p className="text-xs text-muted-foreground">IPS (prom.)</p>
                              <p className="font-medium text-sm">{group.avgIps > 0 ? group.avgIps : "—"}</p>
                            </div>
                          </div>
                          {group.generations.length > 0 && (
                            <div className="mb-4">
                              <p className="mb-1 text-xs font-medium text-muted-foreground">Generaciones</p>
                              <div className="flex flex-wrap gap-1">
                                {group.generations.map((g) => (
                                  <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Cámaras de este modelo ({group.count})
                          </p>
                          <div className="max-h-60 overflow-auto rounded-lg border">
                            <table className="w-full text-xs">
                              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                                <tr>
                                  <th className="px-3 py-2 text-left font-medium">Nombre</th>
                                  <th className="px-3 py-2 text-left font-medium">Código</th>
                                  <th className="px-3 py-2 text-left font-medium">IP</th>
                                  <th className="px-3 py-2 text-left font-medium">Resolución</th>
                                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {group.cameras.map((cam) => (
                                  <tr key={cam.id} className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50">
                                    <td className="px-3 py-2">{cam.name}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{cam.code || "—"}</td>
                                    <td className="px-3 py-2 font-mono text-muted-foreground">{cam.ip_address || "—"}</td>
                                    <td className="px-3 py-2">{cam.resolution || "—"}</td>
                                    <td className="px-3 py-2">
                                      <Badge variant={cam.is_active ? "default" : "secondary"} className="text-[10px]">
                                        {cam.is_active ? "Activa" : "Inactiva"}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 2: Busqueda semantica con IA ── */}
        <TabsContent value="busqueda-ia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Búsqueda semántica de modelos
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Describe lo que necesitas en lenguaje natural y la IA buscará los modelos más relevantes del catálogo.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ej: cámara para exterior con visión nocturna de al menos 30 metros, resistente a lluvia..."
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                  className="min-h-[80px] flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSemanticSearch();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleSemanticSearch}
                disabled={semanticLoading || !semanticQuery.trim()}
                className="gap-2"
              >
                {semanticLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {semanticLoading ? "Buscando..." : "Buscar con IA"}
              </Button>

              {semanticError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {semanticError}
                </div>
              )}

              {/* Resultados */}
              {semanticResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {semanticResults.length} resultado{semanticResults.length !== 1 ? "s" : ""} encontrado{semanticResults.length !== 1 ? "s" : ""}
                  </p>
                  {semanticResults.map((result) => (
                    <Card key={result.model_id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{result.model_name}</span>
                              {result.brand_name && (
                                <Badge variant="outline" className="text-xs">{result.brand_name}</Badge>
                              )}
                            </div>
                            {result.part_number && (
                              <p className="mt-0.5 text-xs font-mono text-muted-foreground">
                                P/N: {result.part_number}
                              </p>
                            )}
                            {result.content_summary && (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                                {result.content_summary}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-500" />
                              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                {Math.round(result.similarity_score * 100)}%
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">similitud</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!semanticLoading && semanticResults.length === 0 && semanticQuery && !semanticError && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Brain className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  Presiona &quot;Buscar con IA&quot; para encontrar modelos relevantes.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Analisis de PDF ── */}
        <TabsContent value="analisis-pdf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-500" />
                Análisis de catálogos PDF
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sube un catálogo o datasheet en PDF y la IA extraerá las especificaciones técnicas de cámaras automáticamente.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Key */}
              <div>
                <label htmlFor="gemini-key" className="mb-1 block text-sm font-medium">
                  API Key de Gemini
                </label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="AIza..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="max-w-md"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Necesaria para procesar el PDF con Gemini. No se almacena.
                </p>
              </div>

              {/* Selector de archivo */}
              <div>
                <label className="mb-1 block text-sm font-medium">Archivo PDF</label>
                <div
                  className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
                  role="button"
                  tabIndex={0}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    {pdfFile ? (
                      <>
                        <p className="font-medium">{pdfFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Haz clic para seleccionar un PDF</p>
                        <p className="text-xs text-muted-foreground">Catálogos, datasheets, fichas técnicas (max ~15 MB)</p>
                      </>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPdfFile(f);
                  }}
                />
              </div>

              {/* Pregunta opcional */}
              <div>
                <label htmlFor="pdf-query" className="mb-1 block text-sm font-medium">
                  Pregunta específica (opcional)
                </label>
                <Textarea
                  id="pdf-query"
                  placeholder="Ej: ¿Cuáles modelos tienen analíticas de conteo de personas? Si lo dejas vacío, se extraerán todas las specs."
                  value={pdfQuery}
                  onChange={(e) => setPdfQuery(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              <Button
                onClick={handlePdfAnalysis}
                disabled={pdfLoading || !pdfFile || !geminiApiKey.trim()}
                className="gap-2"
              >
                {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {pdfLoading ? "Analizando PDF..." : "Analizar con IA"}
              </Button>

              {pdfError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {pdfError}
                </div>
              )}

              {/* Resultados del PDF */}
              {pdfResult && (
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Archivo: <strong>{pdfResult.fileName}</strong></span>
                    <span>Latencia: <strong>{pdfResult.latency_ms}ms</strong></span>
                    {pdfResult.usage && (
                      <span>Tokens: <strong>{pdfResult.usage.input_tokens + pdfResult.usage.output_tokens}</strong></span>
                    )}
                  </div>

                  {/* Tabla de modelos extraidos */}
                  {pdfResult.structured && pdfResult.structured.modelos.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {pdfResult.structured.total_modelos} modelo{pdfResult.structured.total_modelos !== 1 ? "s" : ""} extraído{pdfResult.structured.total_modelos !== 1 ? "s" : ""}
                          {pdfResult.structured.fabricante && ` — ${pdfResult.structured.fabricante}`}
                        </CardTitle>
                        {pdfResult.structured.resumen && (
                          <p className="text-sm text-muted-foreground">{pdfResult.structured.resumen}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-auto rounded-lg border">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100 dark:bg-gray-800">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">Modelo</th>
                                <th className="px-3 py-2 text-left font-medium">Tipo</th>
                                <th className="px-3 py-2 text-left font-medium">Resoluciones</th>
                                <th className="px-3 py-2 text-left font-medium">Sensor</th>
                                <th className="px-3 py-2 text-center font-medium">IR</th>
                                <th className="px-3 py-2 text-center font-medium">WDR</th>
                                <th className="px-3 py-2 text-left font-medium">Analíticas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {pdfResult.structured.modelos.map((m: PDFExtractedModel, idx: number) => (
                                <tr key={idx} className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50">
                                  <td className="px-3 py-2">
                                    <span className="font-medium">{m.nombre}</span>
                                    {m.part_number && (
                                      <span className="ml-1 text-muted-foreground">({m.part_number})</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge variant="outline" className="text-[10px]">{m.tipo}</Badge>
                                  </td>
                                  <td className="px-3 py-2">{m.resoluciones?.join(", ") || "—"}</td>
                                  <td className="px-3 py-2">{m.sensor || "—"}</td>
                                  <td className="px-3 py-2 text-center">
                                    {m.ir ? (
                                      <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="mx-auto h-4 w-4 text-gray-300" />
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {m.wdr ? (
                                      <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="mx-auto h-4 w-4 text-gray-300" />
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1">
                                      {m.analiticas?.slice(0, 3).map((a, i) => (
                                        <Badge key={i} variant="secondary" className="text-[10px]">{a}</Badge>
                                      ))}
                                      {(m.analiticas?.length ?? 0) > 3 && (
                                        <Badge variant="secondary" className="text-[10px]">+{m.analiticas!.length - 3}</Badge>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Respuesta de texto (cuando se hizo una pregunta o no se encontraron modelos) */}
                  {pdfResult.content && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Respuesta de la IA</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          {pdfResult.content}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {!pdfResult && !pdfLoading && !pdfError && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  Sube un PDF y presiona &quot;Analizar con IA&quot; para extraer las especificaciones.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
