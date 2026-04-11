"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Camera, ChevronLeft, ChevronRight, Download, Plus, RefreshCw, Search, Server, Trash2, Upload } from "lucide-react";
import type { Camera as CameraType, NvrServer, SiteListItem, Tenant } from "@/types/api";
import { listCameras } from "@/lib/api/cameras";
import { listNvrs } from "@/lib/api/nvrs";
import { listSites } from "@/lib/api/sites";
import { listTenants } from "@/lib/api/tenants";
import { useTenantStore } from "@/stores/tenant-store";
import { usePermissions } from "@/hooks/use-permissions";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import {
  clearLocalInventory,
  getLocalInventory,
  type LocalCamera,
  type LocalNvr,
} from "@/lib/inventory/local-store";
import { QuickInventoryImportDialog } from "./quick-import-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeString, safeStatus } from "@/lib/safe-field";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

// ---------- helpers ---------------------------------------------------------

function statusBadge(status: unknown, isActive: boolean) {
  const s = safeStatus(status, isActive);
  const active = s === "active";
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
      <span className={`text-xs font-medium ${active ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
        {active ? "Activo" : "Inactivo"}
      </span>
    </div>
  );
}

/** Badge de tipo con color segun categoria */
function typeBadge(type: unknown) {
  const t = safeString(type);
  if (!t || t === "\u2014") return <span className="text-muted-foreground">\u2014</span>;
  const colorMap: Record<string, string> = {
    dome: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    bullet: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    ptz: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    turret: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    fisheye: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
    box: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  };
  const lower = t.toLowerCase();
  const colors = colorMap[lower] ?? "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700";
  return (
    <Badge variant="outline" className={`text-xs ${colors}`}>
      {t}
    </Badge>
  );
}

/** Exportar datos a CSV con BOM UTF-8 */
function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function localBadge(isLocal: boolean) {
  if (!isLocal) return null;
  return (
    <Badge variant="outline" className="ml-1 border-amber-400 text-xs text-amber-600">
      importado
    </Badge>
  );
}

/** Componente de paginacion reutilizable */
function Pagination({
  page, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange,
}: {
  page: number; totalPages: number; pageSize: number; totalItems: number;
  onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Mostrar</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v ?? pageSize))}>
          <SelectTrigger className="h-7 w-17.5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((s) => (
              <SelectItem key={s} value={String(s)}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>de {totalItems}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-xs text-muted-foreground">
          {page} / {totalPages || 1}
        </span>
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------- sub-tablas -------------------------------------------------------

function CamerasTable({ cameras }: { cameras: (CameraType | LocalCamera)[] }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("__all__");
  const [filterStatus, setFilterStatus] = useState<string>("__all__");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Opciones unicas de tipo de camara
  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const cam of cameras) {
      const t = safeString(cam.camera_type);
      if (t && t !== "—") types.add(t);
    }
    return Array.from(types).sort();
  }, [cameras]);

  // Filtrado
  const filtered = useMemo(() => {
    let result = cameras;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.ip_address?.toLowerCase().includes(q) ||
          c.camera_model_name?.toLowerCase().includes(q),
      );
    }
    if (filterType !== "__all__") {
      result = result.filter((c) => safeString(c.camera_type) === filterType);
    }
    if (filterStatus !== "__all__") {
      result = result.filter((c) => {
        const s = safeStatus(c.status, c.is_active);
        return s === filterStatus;
      });
    }
    return result;
  }, [cameras, search, filterType, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  // Resetear pagina al cambiar filtros
  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleType = useCallback((v: string | null) => { setFilterType(v ?? "__all__"); setPage(1); }, []);
  const handleStatus = useCallback((v: string | null) => { setFilterStatus(v ?? "__all__"); setPage(1); }, []);
  const handlePageSize = useCallback((s: number) => { setPageSize(s); setPage(1); }, []);

  if (cameras.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Sin camaras en este contexto. Usa el boton <strong>Importar Excel</strong> para agregar datos.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, codigo, IP, modelo..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={handleType}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los tipos</SelectItem>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={handleStatus}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            const rows = filtered.map((c) => [
              c.name ?? "", c.code ?? "", safeString(c.camera_type),
              c.camera_model_name ?? "", c.ip_address ?? "",
              c.resolution ?? (c.megapixels ? `${c.megapixels}MP` : ""),
              c.area ?? "", c.zone ?? "",
              safeStatus(c.status, c.is_active) === "active" ? "Activo" : "Inactivo",
            ]);
            downloadCSV("camaras.csv", ["Nombre","Codigo","Tipo","Modelo","IP","Resolucion","Area","Zona","Estado"], rows);
          }}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Exportar
        </Button>
      </div>

      <div className="max-h-125 overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Resolucion</TableHead>
              <TableHead>Area / Zona</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No se encontraron camaras con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((cam) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const isLocal = (cam as any).source === "local";
                return (
                  <TableRow key={cam.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                          <Camera className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {cam.name}
                            {localBadge(isLocal)}
                          </div>
                          {cam.code && <div className="text-xs text-muted-foreground">{cam.code}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{typeBadge(cam.camera_type)}</TableCell>
                    <TableCell>{cam.camera_model_name ?? "—"}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{cam.ip_address ?? "—"}</code>
                    </TableCell>
                    <TableCell>{cam.resolution ?? (cam.megapixels ? `${cam.megapixels}MP` : "—")}</TableCell>
                    <TableCell>
                      <div className="text-sm">{cam.area ?? "—"}</div>
                      {cam.zone && <div className="text-xs text-muted-foreground">{cam.zone}</div>}
                    </TableCell>
                    <TableCell>{statusBadge(cam.status, cam.is_active)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length}
        onPageChange={setPage} onPageSizeChange={handlePageSize}
      />
    </div>
  );
}

function NvrsTable({ nvrs }: { nvrs: (NvrServer | LocalNvr)[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("__all__");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    let result = nvrs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.name?.toLowerCase().includes(q) ||
          n.code?.toLowerCase().includes(q) ||
          n.ip_address?.toLowerCase().includes(q) ||
          n.model?.toLowerCase().includes(q),
      );
    }
    if (filterStatus !== "__all__") {
      result = result.filter((n) => {
        const s = safeStatus(n.status, n.is_active);
        return s === filterStatus;
      });
    }
    return result;
  }, [nvrs, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleStatus = useCallback((v: string | null) => { setFilterStatus(v ?? "__all__"); setPage(1); }, []);
  const handlePageSize = useCallback((s: number) => { setPageSize(s); setPage(1); }, []);

  if (nvrs.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Sin servidores NVR en este contexto. Usa el boton <strong>Importar Excel</strong> para agregar datos.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, codigo, IP, modelo..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={handleStatus}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            const rows = filtered.map((n) => [
              n.name ?? "", n.code ?? "", n.model ?? "", n.ip_address ?? "",
              String(n.camera_channels ?? ""), n.total_storage_tb != null ? `${n.total_storage_tb}` : "",
              String(n.recording_days ?? ""),
              safeStatus(n.status, n.is_active) === "active" ? "Activo" : "Inactivo",
            ]);
            downloadCSV("nvrs.csv", ["Nombre","Codigo","Modelo","IP","Canales","Storage TB","Dias Grab.","Estado"], rows);
          }}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Exportar
        </Button>
      </div>

      <div className="max-h-125 overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Canales</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Dias Grab.</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No se encontraron NVRs con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((nvr) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const isLocal = (nvr as any).source === "local";
                return (
                  <TableRow key={nvr.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                          <Server className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {nvr.name}
                            {localBadge(isLocal)}
                          </div>
                          {nvr.code && <div className="text-xs text-muted-foreground">{nvr.code}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{nvr.model ?? "—"}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{nvr.ip_address ?? "—"}</code>
                    </TableCell>
                    <TableCell>{nvr.camera_channels ?? "—"}</TableCell>
                    <TableCell>{nvr.total_storage_tb != null ? `${nvr.total_storage_tb} TB` : "—"}</TableCell>
                    <TableCell>{nvr.recording_days ?? "—"}</TableCell>
                    <TableCell>{statusBadge(nvr.status, nvr.is_active)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length}
        onPageChange={setPage} onPageSizeChange={handlePageSize}
      />
    </div>
  );
}

// ---------- pagina -----------------------------------------------------------

export default function InventoryPage() {
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const { permissions, roles } = usePermissions();
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";

  // Para Admin del Sistema: empresa seleccionada localmente
  const [localTenantId, setLocalTenantId] = useState<string>("");
  const [localSiteId, setLocalSiteId] = useState<string>("");
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const effectiveTenantId = isPlatformAdmin ? localTenantId : (currentCompany?.id ?? "");
  const effectiveSiteId = localSiteId;

  // Tenants para Admin del Sistema
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants", "inventory"],
    queryFn: () => listTenants(200),
    enabled: isPlatformAdmin,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Sitios
  const { data: sites = [], isLoading: sitesLoading } = useQuery<SiteListItem[]>({
    queryKey: ["sites-for-inventory", effectiveTenantId],
    queryFn: listSites,
    enabled: isPlatformAdmin ? !!effectiveTenantId : true,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  // Camaras
  const { data: apiCameras = [], isLoading: camsLoading } = useQuery<CameraType[]>({
    queryKey: ["inventory-cameras", effectiveSiteId, refreshKey],
    queryFn: () => listCameras({ limit: 500 }),
    enabled: isPlatformAdmin ? !!effectiveTenantId : true,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  // NVRs
  const { data: apiNvrs = [], isLoading: nvrsLoading } = useQuery<NvrServer[]>({
    queryKey: ["inventory-nvrs", effectiveSiteId, refreshKey],
    queryFn: listNvrs,
    enabled: isPlatformAdmin ? !!effectiveTenantId : true,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  // Datos locales desde localStorage
  const localData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _r = refreshKey;
    return getLocalInventory(effectiveTenantId || null, effectiveSiteId || null);
  }, [effectiveTenantId, effectiveSiteId, refreshKey]);

  // Filtrar por sitio
  const filteredCameras = useMemo(() => {
    if (!effectiveSiteId) return apiCameras;
    return apiCameras.filter((c) => !c.site_id || c.site_id === effectiveSiteId);
  }, [apiCameras, effectiveSiteId]);

  const filteredNvrs = useMemo(() => {
    if (!effectiveSiteId) return apiNvrs;
    return apiNvrs.filter((n) => !n.site_id || n.site_id === effectiveSiteId);
  }, [apiNvrs, effectiveSiteId]);

  // Merge API + localStorage
  const allCameras = useMemo(
    () => [...filteredCameras, ...(localData?.cameras ?? [])],
    [filteredCameras, localData],
  );
  const allNvrs = useMemo(
    () => [...filteredNvrs, ...(localData?.nvrs ?? [])],
    [filteredNvrs, localData],
  );

  // Etiqueta legible de contexto
  const siteLabel = useMemo(() => {
    const siteName = sites.find((s) => s.id === effectiveSiteId)?.name ?? "";
    const tenantName = isPlatformAdmin
      ? (tenants.find((t) => t.id === effectiveTenantId)?.name ?? "")
      : (currentCompany?.name ?? "");
    if (siteName) return `${tenantName} — ${siteName}`.trim();
    return tenantName.trim() || "Inventario local";
  }, [sites, effectiveSiteId, effectiveTenantId, tenants, isPlatformAdmin, currentCompany]);

  const isLoading = camsLoading || nvrsLoading;
  const hasLocalData = localData && (localData.cameras.length > 0 || localData.nvrs.length > 0);

  const handleImported = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleClearLocal = useCallback(() => {
    clearLocalInventory(effectiveTenantId || null, effectiveSiteId || null);
    setRefreshKey((k) => k + 1);
  }, [effectiveTenantId, effectiveSiteId]);

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario CCTV</h1>
          <p className="text-sm text-muted-foreground">
            Equipos registrados por sucursal. Los datos importados desde Excel se guardan localmente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setRefreshKey((k) => k + 1)} disabled={isLoading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            Importar Excel
          </Button>
        </div>
      </div>

      {/* Selectores de contexto */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-3">
            {isPlatformAdmin && (
              <div className="min-w-52">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Empresa</p>
                <Select
                  value={localTenantId}
                  onValueChange={(v) => { setLocalTenantId(v ?? ""); setLocalSiteId(""); }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecciona empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="min-w-52">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Sucursal</p>
              <Select
                value={localSiteId}
                onValueChange={(v) => setLocalSiteId(v ?? "")}
                disabled={isPlatformAdmin && !localTenantId}
              >
                <SelectTrigger className="h-9">
                  <SelectValue
                    placeholder={
                      sitesLoading ? "Cargando..." :
                      isPlatformAdmin && !localTenantId ? "Selecciona empresa primero" :
                      "Todas las sucursales"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las sucursales</SelectItem>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.client_name && (
                        <span className="ml-1 text-xs text-muted-foreground">— {s.client_name}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasLocalData && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-xs text-destructive hover:text-destructive"
                onClick={handleClearLocal}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Limpiar importados
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estado vacio para Admin del Sistema sin empresa seleccionada */}
      {isPlatformAdmin && !localTenantId && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Selecciona una empresa para ver su inventario CCTV
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            O importa un Excel directamente — los datos quedaran guardados
          </p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setImportOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Importar Excel de todas formas
          </Button>
        </div>
      )}

      {/* Tabla de inventario */}
      {(!isPlatformAdmin || localTenantId) && (
        <Tabs defaultValue="cameras">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="cameras">
                <Camera className="mr-1.5 h-4 w-4" />
                Camaras
                <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0 text-xs">
                  {allCameras.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="nvrs">
                <Server className="mr-1.5 h-4 w-4" />
                Servidores NVR
                <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0 text-xs">
                  {allNvrs.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            {siteLabel && (
              <span className="text-xs text-muted-foreground">
                Contexto: <span className="font-medium">{siteLabel}</span>
              </span>
            )}
          </div>

          <TabsContent value="cameras" className="mt-4">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Cargando inventario...</div>
            ) : (
              <CamerasTable cameras={allCameras} />
            )}
          </TabsContent>

          <TabsContent value="nvrs" className="mt-4">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Cargando inventario...</div>
            ) : (
              <NvrsTable nvrs={allNvrs} />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogo de importacion rapida */}
      <QuickInventoryImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        tenantId={effectiveTenantId || null}
        siteId={effectiveSiteId || null}
        siteLabel={siteLabel}
        onImported={handleImported}
      />
    </div>
  );
}
