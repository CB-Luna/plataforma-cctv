"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Camera,
  Eye,
  HardDrive,
  Plus,
  RefreshCw,
  Search,
  Server,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import type { Camera as CameraType, NvrServer, SiteListItem, Tenant } from "@/types/api";
import {
  listCameras,
  createCamera,
  updateCamera,
  deleteCamera,
  getCameraStats,
} from "@/lib/api/cameras";
import {
  listNvrs,
  createNvr,
  updateNvr,
  deleteNvr,
  getNvrStats,
} from "@/lib/api/nvrs";
import { listSites } from "@/lib/api/sites";
import { listTenants } from "@/lib/api/tenants";
import { useTenantStore } from "@/stores/tenant-store";
import { useSiteStore } from "@/stores/site-store";
import { usePermissions } from "@/hooks/use-permissions";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { isPlatformTenant } from "@/lib/platform";
import {
  clearLocalInventory,
  getLocalInventory,
} from "@/lib/inventory/local-store";
import { safeString, safeStatus } from "@/lib/safe-field";
import { QuickInventoryImportDialog } from "./quick-import-dialog";
import { getColumns as getCameraColumns } from "../cameras/columns";
import { getColumns as getNvrColumns } from "../nvrs/columns";
import { CameraDialog, type CameraFormValues } from "../cameras/camera-dialog";
import { NvrDialog, type NvrFormValues } from "../nvrs/nvr-dialog";
import { DataTable } from "@/components/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const currentSite = useSiteStore((s) => s.currentSite);
  const { permissions, roles } = usePermissions();
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";

  // Estado local de UI — sincronizar con empresa seleccionada en header
  const [localTenantId, setLocalTenantId] = useState(
    () => (currentCompany && !isPlatformTenant(currentCompany.id) ? currentCompany.id : ""),
  );
  const [localSiteId, setLocalSiteId] = useState(() => currentSite?.id ?? "");
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"cameras" | "nvrs">("cameras");
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);

  // Sincronizar con el filtro global del header
  useEffect(() => {
    const nextTenant = currentCompany && !isPlatformTenant(currentCompany.id)
      ? currentCompany.id : "";
    setLocalTenantId(nextTenant);
  }, [currentCompany]);

  useEffect(() => {
    setLocalSiteId(currentSite?.id ?? "");
  }, [currentSite]);
  const [editingCamera, setEditingCamera] = useState<CameraType | null>(null);
  const [nvrDialogOpen, setNvrDialogOpen] = useState(false);
  const [editingNvr, setEditingNvr] = useState<NvrServer | null>(null);

  const effectiveTenantId = isPlatformAdmin ? localTenantId : (currentCompany?.id ?? "");
  const effectiveSiteId = localSiteId;
  const hasContext = !isPlatformAdmin || !!effectiveTenantId;

  // ──── Queries ────────────────────────────────────────────────────────

  const { data: rawTenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants", "inventory"],
    queryFn: () => listTenants(200),
    enabled: isPlatformAdmin,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Filtrar tenant plataforma del dropdown
  const tenants = rawTenants.filter((t) => !isPlatformTenant(t.id));

  const { data: sites = [], isLoading: sitesLoading } = useQuery<SiteListItem[]>({
    queryKey: ["sites-for-inventory", effectiveTenantId],
    queryFn: listSites,
    enabled: hasContext,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const { data: apiCameras = [], isLoading: camsLoading } = useQuery<CameraType[]>({
    queryKey: ["inventory-cameras", effectiveTenantId, refreshKey],
    queryFn: () => listCameras({ limit: 500 }),
    enabled: hasContext,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const { data: cameraStats } = useQuery({
    queryKey: ["inventory-cameras-stats", effectiveTenantId],
    queryFn: () => getCameraStats(effectiveTenantId || undefined),
    enabled: hasContext,
  });

  const { data: apiNvrs = [], isLoading: nvrsLoading } = useQuery<NvrServer[]>({
    queryKey: ["inventory-nvrs", effectiveTenantId, refreshKey],
    queryFn: listNvrs,
    enabled: hasContext,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const { data: nvrStats } = useQuery({
    queryKey: ["inventory-nvrs-stats", effectiveTenantId],
    queryFn: () => getNvrStats(effectiveTenantId || undefined),
    enabled: hasContext,
  });

  // ──── Mutations: Camaras ─────────────────────────────────────────────

  const createCameraMut = useMutation({
    mutationFn: createCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-cameras"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-cameras-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      toast.success("Camara creada correctamente");
      setCameraDialogOpen(false);
    },
    onError: () => toast.error("No se pudo crear la camara"),
  });

  const updateCameraMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CameraFormValues }) =>
      updateCamera(id, data as Parameters<typeof updateCamera>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-cameras"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-cameras-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      toast.success("Camara actualizada");
      setCameraDialogOpen(false);
      setEditingCamera(null);
    },
    onError: () => toast.error("No se pudo actualizar la camara"),
  });

  const deleteCameraMut = useMutation({
    mutationFn: deleteCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-cameras"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-cameras-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      toast.success("Camara eliminada");
    },
    onError: () => toast.error("No se pudo eliminar la camara"),
  });

  // ──── Mutations: NVRs ────────────────────────────────────────────────

  const createNvrMut = useMutation({
    mutationFn: createNvr,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-nvrs"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-nvrs-stats"] });
      queryClient.invalidateQueries({ queryKey: ["nvrs"] });
      toast.success("NVR creado correctamente");
      setNvrDialogOpen(false);
    },
    onError: () => toast.error("No se pudo crear el NVR"),
  });

  const updateNvrMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NvrFormValues }) =>
      updateNvr(id, data as Parameters<typeof updateNvr>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-nvrs"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-nvrs-stats"] });
      queryClient.invalidateQueries({ queryKey: ["nvrs"] });
      toast.success("NVR actualizado");
      setNvrDialogOpen(false);
      setEditingNvr(null);
    },
    onError: () => toast.error("No se pudo actualizar el NVR"),
  });

  const deleteNvrMut = useMutation({
    mutationFn: deleteNvr,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-nvrs"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-nvrs-stats"] });
      queryClient.invalidateQueries({ queryKey: ["nvrs"] });
      toast.success("NVR eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el NVR"),
  });

  // ──── Datos derivados ────────────────────────────────────────────────

  const localData = useMemo(() => {
    void refreshKey; // dependencia para forzar refresh
    return getLocalInventory(effectiveTenantId || null, effectiveSiteId || null);
  }, [effectiveTenantId, effectiveSiteId, refreshKey]);

  const filteredCameras = useMemo(() => {
    if (!effectiveSiteId) return apiCameras;
    return apiCameras.filter((c) => !c.site_id || c.site_id === effectiveSiteId);
  }, [apiCameras, effectiveSiteId]);

  const filteredNvrs = useMemo(() => {
    if (!effectiveSiteId) return apiNvrs;
    return apiNvrs.filter((n) => !n.site_id || n.site_id === effectiveSiteId);
  }, [apiNvrs, effectiveSiteId]);

  const allCameras = useMemo(
    () => [...filteredCameras, ...(localData?.cameras ?? [])] as CameraType[],
    [filteredCameras, localData],
  );
  const allNvrs = useMemo(
    () => [...filteredNvrs, ...(localData?.nvrs ?? [])] as NvrServer[],
    [filteredNvrs, localData],
  );

  const siteNames = useMemo(
    () => new Map(sites.map((s) => [s.id, s.name])),
    [sites],
  );

  const nvrNames = useMemo(
    () => new Map(apiNvrs.map((n) => [n.id, n.name])),
    [apiNvrs],
  );

  // KPI derivadas cuando hay filtro por sitio
  const displayCameraStats = useMemo(() => {
    if (!effectiveSiteId) return cameraStats;
    const active = filteredCameras.filter((c) => safeStatus(c.status, c.is_active) === "active");
    return {
      total_cameras: filteredCameras.length,
      active_cameras: active.length,
      inactive_cameras: filteredCameras.length - active.length,
      dome_cameras: filteredCameras.filter((c) => safeString(c.camera_type, "").toLowerCase().includes("dome")).length,
      bullet_cameras: filteredCameras.filter((c) => safeString(c.camera_type, "").toLowerCase().includes("bullet")).length,
      ptz_cameras: filteredCameras.filter((c) => safeString(c.camera_type, "").toLowerCase().includes("ptz")).length,
      counting_enabled: filteredCameras.filter((c) => c.counting_enabled).length,
    };
  }, [effectiveSiteId, filteredCameras, cameraStats]);

  const displayNvrStats = useMemo(() => {
    if (!effectiveSiteId) return nvrStats;
    const active = filteredNvrs.filter((n) => safeStatus(n.status, n.is_active) === "active");
    return {
      total_servers: filteredNvrs.length,
      active_servers: active.length,
      inactive_servers: filteredNvrs.length - active.length,
      total_cameras: filteredNvrs.reduce((acc, n) => acc + (n.camera_channels ?? 0), 0),
      total_storage_tb: filteredNvrs.reduce((acc, n) => acc + (n.total_storage_tb ?? 0), 0),
    };
  }, [effectiveSiteId, filteredNvrs, nvrStats]);

  // Export rows
  const cameraExportRows = useMemo(() => allCameras.map((cam) => ({
    ...cam,
    site_name: cam.site_id ? siteNames.get(cam.site_id) ?? "Sitio asignado" : "Sin sitio",
    nvr_name: cam.nvr_server_id ? nvrNames.get(cam.nvr_server_id) ?? "NVR asignado" : "Sin NVR",
  })), [allCameras, siteNames, nvrNames]);

  const nvrExportRows = useMemo(() => allNvrs.map((nvr) => ({
    ...nvr,
    site_name: nvr.site_id ? siteNames.get(nvr.site_id) ?? "Sitio asignado" : "Sin sitio",
  })), [allNvrs, siteNames]);

  // ──── Columns ────────────────────────────────────────────────────────

  const cameraColumns = useMemo(() => getCameraColumns({
    onDelete: (camera) => {
      if (confirm(`Eliminar la camara "${camera.name}"?`)) {
        deleteCameraMut.mutate(camera.id);
      }
    },
    onView: (camera) => {
      setEditingCamera(camera);
      setCameraDialogOpen(true);
    },
    siteNames,
    nvrNames,
  }), [deleteCameraMut, siteNames, nvrNames]);

  const nvrColumns = useMemo(() => getNvrColumns({
    onDelete: (nvr) => {
      if (confirm(`Eliminar el NVR "${nvr.name}"?`)) {
        deleteNvrMut.mutate(nvr.id);
      }
    },
    onOpen: (nvr) => {
      setEditingNvr(nvr);
      setNvrDialogOpen(true);
    },
    siteNames,
  }), [deleteNvrMut, siteNames]);

  // ──── Handlers ───────────────────────────────────────────────────────

  async function handleCameraSubmit(data: CameraFormValues) {
    if (editingCamera) {
      await updateCameraMut.mutateAsync({ id: editingCamera.id, data });
      return;
    }
    await createCameraMut.mutateAsync(data as Parameters<typeof createCamera>[0]);
  }

  async function handleNvrSubmit(data: NvrFormValues) {
    if (editingNvr) {
      await updateNvrMut.mutateAsync({ id: editingNvr.id, data });
      return;
    }
    await createNvrMut.mutateAsync(data as Parameters<typeof createNvr>[0]);
  }

  const handleImported = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleClearLocal = useCallback(() => {
    clearLocalInventory(effectiveTenantId || null, effectiveSiteId || null);
    setRefreshKey((k) => k + 1);
  }, [effectiveTenantId, effectiveSiteId]);

  // ──── Misc ───────────────────────────────────────────────────────────

  const siteLabel = useMemo(() => {
    const siteName = sites.find((s) => s.id === effectiveSiteId)?.name ?? "";
    const tenantName = isPlatformAdmin
      ? (tenants.find((t) => t.id === effectiveTenantId)?.name ?? "")
      : (currentCompany?.name ?? "");
    if (siteName) return `${tenantName} — ${siteName}`.trim();
    return tenantName.trim() || "";
  }, [sites, effectiveSiteId, effectiveTenantId, tenants, isPlatformAdmin, currentCompany]);

  const isLoading = camsLoading || nvrsLoading;
  const hasLocalData = localData && (localData.cameras.length > 0 || localData.nvrs.length > 0);

  // ──── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario CCTV</h1>
          <p className="text-sm text-muted-foreground">
            Gestion unificada de camaras y servidores NVR por empresa y sucursal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setRefreshKey((k) => k + 1)} disabled={isLoading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            Importar
          </Button>
          {hasContext && (
            <Button
              size="sm"
              onClick={() => {
                if (activeTab === "cameras") {
                  setEditingCamera(null);
                  setCameraDialogOpen(true);
                } else {
                  setEditingNvr(null);
                  setNvrDialogOpen(true);
                }
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {activeTab === "cameras" ? "Nueva camara" : "Nuevo NVR"}
            </Button>
          )}
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
                    {/* Evitar mostrar UUID cuando los tenants aun no cargan */}
                    <SelectValue placeholder="Selecciona empresa...">
                      {tenants.find((t) => t.id === localTenantId)?.name
                        ?? currentCompany?.name
                        ?? "Selecciona empresa..."}
                    </SelectValue>
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

      {/* Estado vacio para Admin del Sistema sin empresa */}
      {isPlatformAdmin && !localTenantId && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Selecciona una empresa para ver su inventario CCTV
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Desde ahi podras crear camaras, NVRs o importar datos de Excel.
          </p>
        </div>
      )}

      {/* Contenido principal con tabs */}
      {hasContext && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "cameras" | "nvrs")}>
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

          {/* ── Tab: Camaras ── */}
          <TabsContent value="cameras" className="mt-4 space-y-4">
            {displayCameraStats && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total camaras</CardTitle>
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayCameraStats.total_cameras}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Activas</CardTitle>
                    <Eye className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{displayCameraStats.active_cameras}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tipos</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span>Domo: {displayCameraStats.dome_cameras}</span>
                      <span>Bullet: {displayCameraStats.bullet_cameras}</span>
                      <span>PTZ: {displayCameraStats.ptz_cameras}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conteo habilitado</CardTitle>
                    <Search className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayCameraStats.counting_enabled}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DataTable
              columns={cameraColumns}
              data={allCameras}
              isLoading={isLoading}
              searchKey="name"
              searchPlaceholder="Filtrar camaras por nombre..."
              emptyState={(
                <EmptyState
                  icon={Camera}
                  title="No hay camaras registradas"
                  description="Importa desde Excel o crea una camara manual para comenzar."
                  action={{ label: "Nueva camara", onClick: () => { setEditingCamera(null); setCameraDialogOpen(true); } }}
                />
              )}
              toolbar={(
                <ExportButton
                  data={cameraExportRows as unknown as Record<string, unknown>[]}
                  columns={[
                    { header: "Nombre", accessorKey: "name" },
                    { header: "Codigo", accessorKey: "code" },
                    { header: "Sitio", accessorKey: "site_name" },
                    { header: "NVR", accessorKey: "nvr_name" },
                    { header: "Modelo", accessorKey: "camera_model_name" },
                    { header: "Estado", accessorKey: "status" },
                  ]}
                  filename="camaras-inventario"
                />
              )}
            />
          </TabsContent>

          {/* ── Tab: NVRs ── */}
          <TabsContent value="nvrs" className="mt-4 space-y-4">
            {displayNvrStats && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total servidores</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayNvrStats.total_servers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Activos</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{displayNvrStats.active_servers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Canales declarados</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayNvrStats.total_cameras}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayNvrStats.total_storage_tb} TB</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DataTable
              columns={nvrColumns}
              data={allNvrs}
              isLoading={isLoading}
              searchKey="name"
              searchPlaceholder="Filtrar NVR por nombre..."
              emptyState={(
                <EmptyState
                  icon={Server}
                  title="No hay servidores NVR"
                  description="Importa desde Excel o registra tu primer servidor."
                  action={{ label: "Nuevo NVR", onClick: () => { setEditingNvr(null); setNvrDialogOpen(true); } }}
                />
              )}
              toolbar={(
                <ExportButton
                  data={nvrExportRows as unknown as Record<string, unknown>[]}
                  columns={[
                    { header: "Nombre", accessorKey: "name" },
                    { header: "Sitio", accessorKey: "site_name" },
                    { header: "Modelo", accessorKey: "model" },
                    { header: "Edicion", accessorKey: "edition" },
                    { header: "Canales", accessorKey: "camera_channels" },
                    { header: "Estado", accessorKey: "status" },
                  ]}
                  filename="nvrs-inventario"
                />
              )}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* ── Dialogos ── */}
      <CameraDialog
        open={cameraDialogOpen}
        onOpenChange={(v) => {
          setCameraDialogOpen(v);
          if (!v) setEditingCamera(null);
        }}
        camera={editingCamera}
        onSubmit={handleCameraSubmit}
        isSubmitting={createCameraMut.isPending || updateCameraMut.isPending}
      />

      <NvrDialog
        open={nvrDialogOpen}
        onOpenChange={(v) => {
          setNvrDialogOpen(v);
          if (!v) setEditingNvr(null);
        }}
        nvr={editingNvr}
        onSubmit={handleNvrSubmit}
        isSubmitting={createNvrMut.isPending || updateNvrMut.isPending}
      />

      <QuickInventoryImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        tenantId={effectiveTenantId || null}
        siteId={effectiveSiteId || null}
        siteLabel={siteLabel}
        onImported={handleImported}
        defaultType={activeTab}
      />
    </div>
  );
}
