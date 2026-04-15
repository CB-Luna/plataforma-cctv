"use client";

import { useCallback, useMemo, useState } from "react";
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
import { listCameras, createCamera, updateCamera, deleteCamera } from "@/lib/api/cameras";
import { listNvrs, createNvr, updateNvr, deleteNvr } from "@/lib/api/nvrs";
import { listSites } from "@/lib/api/sites";
import { listTenants } from "@/lib/api/tenants";
import { useTenantStore } from "@/stores/tenant-store";
import { useSiteStore } from "@/stores/site-store";
import { usePermissions } from "@/hooks/use-permissions";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { isPlatformTenant } from "@/lib/platform";
import { clearLocalInventory, getLocalInventory } from "@/lib/inventory/local-store";
import { resolvePersistedSiteId } from "@/lib/site-context";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function dedupeById<T extends { id: string }>(collections: T[][]): T[] {
  const deduped = new Map<string, T>();
  for (const collection of collections) {
    for (const item of collection) {
      deduped.set(item.id, item);
    }
  }
  return Array.from(deduped.values());
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const currentSite = useSiteStore((s) => s.currentSite);
  const { permissions, roles } = usePermissions();
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";

  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"cameras" | "nvrs">("cameras");
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraType | null>(null);
  const [nvrDialogOpen, setNvrDialogOpen] = useState(false);
  const [editingNvr, setEditingNvr] = useState<NvrServer | null>(null);

  const { data: rawTenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants", "inventory"],
    queryFn: () => listTenants(200),
    enabled: isPlatformAdmin,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const tenants = rawTenants.filter((tenant) => !isPlatformTenant(tenant.id));
  const tenantScopeIds = useMemo(() => {
    if (!isPlatformAdmin) {
      return currentCompany?.id ? [currentCompany.id] : [];
    }

    if (currentCompany?.id && !isPlatformTenant(currentCompany.id)) {
      return [currentCompany.id];
    }

    return tenants.map((tenant) => tenant.id);
  }, [currentCompany?.id, isPlatformAdmin, tenants]);
  const tenantScopeKey = tenantScopeIds.join(",") || "__none__";
  const effectiveSiteId = resolvePersistedSiteId(currentSite) ?? "";
  const currentLocalSiteId = currentSite?.id ?? "";
  const hasContext = tenantScopeIds.length > 0;
  const canMutate = !isPlatformAdmin || !!currentCompany;
  const isAllCompaniesView = isPlatformAdmin && !currentCompany;
  const tenantMeta = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, tenant])),
    [tenants],
  );

  const { data: sites = [] } = useQuery<SiteListItem[]>({
    queryKey: ["sites-for-inventory", tenantScopeKey, refreshKey],
    queryFn: async () =>
      dedupeById(await Promise.all(tenantScopeIds.map((tenantId) => listSites({ tenantId })))),
    enabled: hasContext,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const { data: apiCameras = [], isLoading: camsLoading } = useQuery<CameraType[]>({
    queryKey: ["inventory-cameras", tenantScopeKey, refreshKey],
    queryFn: async () =>
      dedupeById(
        await Promise.all(
          tenantScopeIds.map((tenantId) => listCameras({ limit: 1000, tenantId })),
        ),
      ),
    enabled: hasContext,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const { data: apiNvrs = [], isLoading: nvrsLoading } = useQuery<NvrServer[]>({
    queryKey: ["inventory-nvrs", tenantScopeKey, refreshKey],
    queryFn: async () =>
      dedupeById(await Promise.all(tenantScopeIds.map((tenantId) => listNvrs({ tenantId })))),
    enabled: hasContext,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const createCameraMut = useMutation({
    mutationFn: createCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-cameras"] });
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
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      toast.success("Camara eliminada");
    },
    onError: () => toast.error("No se pudo eliminar la camara"),
  });

  const createNvrMut = useMutation({
    mutationFn: createNvr,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-nvrs"] });
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
      queryClient.invalidateQueries({ queryKey: ["nvrs"] });
      toast.success("NVR eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el NVR"),
  });

  const localData = useMemo(() => {
    void refreshKey;
    if (!currentCompany?.id) return null;
    return getLocalInventory(currentCompany.id, currentLocalSiteId || null);
  }, [currentCompany?.id, currentLocalSiteId, refreshKey]);

  const filteredApiCameras = useMemo(() => {
    if (!effectiveSiteId) return apiCameras;
    return apiCameras.filter((camera) => !camera.site_id || camera.site_id === effectiveSiteId);
  }, [apiCameras, effectiveSiteId]);

  const filteredApiNvrs = useMemo(() => {
    if (!effectiveSiteId) return apiNvrs;
    return apiNvrs.filter((nvr) => !nvr.site_id || nvr.site_id === effectiveSiteId);
  }, [apiNvrs, effectiveSiteId]);

  const allCameras = useMemo(
    () => [...filteredApiCameras, ...(localData?.cameras ?? [])] as CameraType[],
    [filteredApiCameras, localData],
  );
  const allNvrs = useMemo(
    () => [...filteredApiNvrs, ...(localData?.nvrs ?? [])] as NvrServer[],
    [filteredApiNvrs, localData],
  );

  const siteNames = useMemo(
    () => new Map(sites.map((site) => [site.id, site.name])),
    [sites],
  );
  const nvrNames = useMemo(
    () => new Map(allNvrs.map((nvr) => [nvr.id, nvr.name])),
    [allNvrs],
  );

  const displayCameraStats = useMemo(() => {
    const active = allCameras.filter((camera) => safeStatus(camera.status, camera.is_active) === "active");
    return {
      total_cameras: allCameras.length,
      active_cameras: active.length,
      inactive_cameras: allCameras.length - active.length,
      dome_cameras: allCameras.filter((camera) => safeString(camera.camera_type, "").toLowerCase().includes("dome")).length,
      bullet_cameras: allCameras.filter((camera) => safeString(camera.camera_type, "").toLowerCase().includes("bullet")).length,
      ptz_cameras: allCameras.filter((camera) => safeString(camera.camera_type, "").toLowerCase().includes("ptz")).length,
      counting_enabled: allCameras.filter((camera) => camera.counting_enabled).length,
    };
  }, [allCameras]);

  const displayNvrStats = useMemo(() => {
    const active = allNvrs.filter((nvr) => safeStatus(nvr.status, nvr.is_active) === "active");
    return {
      total_servers: allNvrs.length,
      active_servers: active.length,
      inactive_servers: allNvrs.length - active.length,
      total_cameras: allNvrs.reduce((acc, nvr) => acc + (nvr.camera_channels ?? 0), 0),
      total_storage_tb: allNvrs.reduce((acc, nvr) => acc + (nvr.total_storage_tb ?? 0), 0),
    };
  }, [allNvrs]);

  const cameraExportRows = useMemo(() => allCameras.map((camera) => ({
    ...camera,
    company_name: camera.tenant_id ? tenantMeta.get(camera.tenant_id)?.name ?? "Sin empresa" : "Sin empresa",
    site_name: camera.site_id ? siteNames.get(camera.site_id) ?? "Sitio asignado" : "Sin sitio",
    nvr_name: camera.nvr_server_id ? nvrNames.get(camera.nvr_server_id) ?? "Sin NVR" : "Sin NVR",
  })), [allCameras, nvrNames, siteNames, tenantMeta]);

  const nvrExportRows = useMemo(() => allNvrs.map((nvr) => ({
    ...nvr,
    company_name: nvr.tenant_id ? tenantMeta.get(nvr.tenant_id)?.name ?? "Sin empresa" : "Sin empresa",
    site_name: nvr.site_id ? siteNames.get(nvr.site_id) ?? "Sitio asignado" : "Sin sitio",
  })), [allNvrs, siteNames, tenantMeta]);

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
    tenantMeta,
    showTenantColumn: isAllCompaniesView,
  }), [deleteCameraMut, isAllCompaniesView, nvrNames, siteNames, tenantMeta]);

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
    tenantMeta,
    showTenantColumn: isAllCompaniesView,
  }), [deleteNvrMut, isAllCompaniesView, siteNames, tenantMeta]);

  async function handleCameraSubmit(data: CameraFormValues) {
    if (editingCamera) {
      const { id, tenant_id, is_active, created_at, updated_at, ...existingFields } = editingCamera;
      const merged = { ...existingFields, ...data };
      await updateCameraMut.mutateAsync({ id: editingCamera.id, data: merged as CameraFormValues });
      return;
    }

    await createCameraMut.mutateAsync(data as Parameters<typeof createCamera>[0]);
  }

  async function handleNvrSubmit(data: NvrFormValues) {
    if (editingNvr) {
      const { id, tenant_id, is_active, created_at, updated_at, ...existingFields } = editingNvr;
      const merged = { ...existingFields, ...data };
      await updateNvrMut.mutateAsync({ id: editingNvr.id, data: merged as NvrFormValues });
      return;
    }

    await createNvrMut.mutateAsync(data as Parameters<typeof createNvr>[0]);
  }

  const handleImported = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const handleClearLocal = useCallback(() => {
    if (!currentCompany?.id) return;
    clearLocalInventory(currentCompany.id, currentLocalSiteId || null);
    setRefreshKey((key) => key + 1);
  }, [currentCompany?.id, currentLocalSiteId]);

  const siteLabel = useMemo(() => {
    if (currentSite) {
      return `${currentSite.client_name ?? currentCompany?.name ?? "Empresa"} â€” ${currentSite.name}`;
    }
    if (currentCompany?.name) return currentCompany.name;
    if (isAllCompaniesView) return "Todas las empresas";
    return "";
  }, [currentCompany?.name, currentSite, isAllCompaniesView]);

  const displaySiteLabel = useMemo(() => {
    if (currentSite) {
      return `${currentSite.company_name ?? currentCompany?.name ?? currentSite.client_name ?? "Empresa"} / ${currentSite.name}`;
    }
    if (currentCompany?.name) return currentCompany.name;
    if (isAllCompaniesView) return "Todas las empresas";
    return "";
  }, [currentCompany?.name, currentSite, isAllCompaniesView]);

  const isLoading = camsLoading || nvrsLoading;
  const hasLocalData = Boolean(localData && (localData.cameras.length > 0 || localData.nvrs.length > 0));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario CCTV</h1>
          <p className="text-sm text-muted-foreground">
            Gestion unificada de camaras y servidores NVR por empresa y sucursal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setRefreshKey((key) => key + 1)} disabled={isLoading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {canMutate ? (
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-1.5 h-4 w-4" />
              Importar
            </Button>
          ) : null}
          {canMutate ? (
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
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contexto activo
              </p>
              <p className="text-sm font-medium">{displaySiteLabel || "Sin contexto operativo"}</p>
              <p className="text-xs text-muted-foreground">
                Esta pantalla ya no mantiene filtros propios de empresa o sucursal. El header es la unica fuente de verdad.
              </p>
              {isAllCompaniesView ? (
                <p className="text-xs text-amber-700">
                  Vista agregada de inspeccion. Para crear, editar o importar inventario primero selecciona una empresa especifica.
                </p>
              ) : null}
            </div>
            {hasLocalData ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-destructive hover:text-destructive"
                onClick={handleClearLocal}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Limpiar importados
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {!hasContext ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay empresas disponibles para esta vista
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cuando existan tenants reales, aqui apareceran sus camaras, NVRs y sucursales.
          </p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "cameras" | "nvrs")}>
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
            {displaySiteLabel ? (
              <span className="text-xs text-muted-foreground">
                Contexto: <span className="font-medium">{displaySiteLabel}</span>
              </span>
            ) : null}
          </div>

          <TabsContent value="cameras" className="mt-4 space-y-4">
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
                  description={
                    isAllCompaniesView
                      ? "No hay camaras visibles en la vista agregada actual."
                      : "Importa desde Excel o crea una camara manual para comenzar."
                  }
                  action={
                    canMutate
                      ? { label: "Nueva camara", onClick: () => { setEditingCamera(null); setCameraDialogOpen(true); } }
                      : undefined
                  }
                />
              )}
              toolbar={(
                <ExportButton
                  data={cameraExportRows as unknown as Record<string, unknown>[]}
                  columns={[
                    ...(isAllCompaniesView ? [{ header: "Empresa", accessorKey: "company_name" }] : []),
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

          <TabsContent value="nvrs" className="mt-4 space-y-4">
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
                  description={
                    isAllCompaniesView
                      ? "No hay servidores NVR visibles en la vista agregada actual."
                      : "Importa desde Excel o registra tu primer servidor."
                  }
                  action={
                    canMutate
                      ? { label: "Nuevo NVR", onClick: () => { setEditingNvr(null); setNvrDialogOpen(true); } }
                      : undefined
                  }
                />
              )}
              toolbar={(
                <ExportButton
                  data={nvrExportRows as unknown as Record<string, unknown>[]}
                  columns={[
                    ...(isAllCompaniesView ? [{ header: "Empresa", accessorKey: "company_name" }] : []),
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

      <CameraDialog
        open={cameraDialogOpen}
        onOpenChange={(open) => {
          setCameraDialogOpen(open);
          if (!open) setEditingCamera(null);
        }}
        camera={editingCamera}
        onSubmit={handleCameraSubmit}
        isSubmitting={createCameraMut.isPending || updateCameraMut.isPending}
      />

      <NvrDialog
        open={nvrDialogOpen}
        onOpenChange={(open) => {
          setNvrDialogOpen(open);
          if (!open) setEditingNvr(null);
        }}
        nvr={editingNvr}
        onSubmit={handleNvrSubmit}
        isSubmitting={createNvrMut.isPending || updateNvrMut.isPending}
      />

      {canMutate ? (
        <QuickInventoryImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          tenantId={currentCompany?.id ?? null}
          siteId={effectiveSiteId || null}
          siteLabel={displaySiteLabel}
          onImported={handleImported}
          defaultType={activeTab}
        />
      ) : null}
    </div>
  );
}
