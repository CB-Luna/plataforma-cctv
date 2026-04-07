"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCameras } from "@/lib/api/cameras";
import type { Camera } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [search, setSearch] = useState("");
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fichas Técnicas</h2>
          <p className="text-muted-foreground">
            Catálogo de modelos de cámaras desplegadas en la infraestructura.
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por modelo, tipo o resolución..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Model Cards */}
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
                {/* Summary Row */}
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

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="p-4">
                      {/* Specs grid */}
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

                      {/* Generations */}
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

                      {/* Camera list */}
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
    </div>
  );
}
