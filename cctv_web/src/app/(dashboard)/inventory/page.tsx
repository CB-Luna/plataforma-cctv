"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Camera, Plus, RefreshCw, Server, Trash2, Upload } from "lucide-react";
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

// ---------- helpers ---------------------------------------------------------

function statusBadge(status: string | undefined, isActive: boolean) {
  const s = status ?? (isActive ? "active" : "inactive");
  return (
    <Badge variant={s === "active" ? "default" : "secondary"} className="text-xs">
      {s === "active" ? "Activo" : s === "inactive" ? "Inactivo" : s}
    </Badge>
  );
}

function localBadge(isLocal: boolean) {
  if (!isLocal) return null;
  return (
    <Badge variant="outline" className="ml-1 border-amber-400 text-xs text-amber-600">
      importado
    </Badge>
  );
}

// ---------- sub-tablas -------------------------------------------------------

function CamerasTable({ cameras }: { cameras: (CameraType | LocalCamera)[] }) {
  if (cameras.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Sin camaras en este contexto. Usa el boton <strong>Importar Excel</strong> para agregar datos.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
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
          {cameras.map((cam) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const isLocal = (cam as any).source === "local";
            return (
              <TableRow key={cam.id}>
                <TableCell>
                  <div className="font-medium">
                    {cam.name}
                    {localBadge(isLocal)}
                  </div>
                  {cam.code && <div className="text-xs text-muted-foreground">{cam.code}</div>}
                </TableCell>
                <TableCell>
                  {cam.camera_type ? (
                    <Badge variant="outline" className="text-xs">
                      {cam.camera_type}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{cam.camera_model_name ?? "—"}</TableCell>
                <TableCell>
                  <code className="text-xs">{cam.ip_address ?? "—"}</code>
                </TableCell>
                <TableCell>{cam.resolution ?? (cam.megapixels ? `${cam.megapixels}MP` : "—")}</TableCell>
                <TableCell>
                  <div className="text-sm">{cam.area ?? "—"}</div>
                  {cam.zone && <div className="text-xs text-muted-foreground">{cam.zone}</div>}
                </TableCell>
                <TableCell>{statusBadge(cam.status, cam.is_active)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function NvrsTable({ nvrs }: { nvrs: (NvrServer | LocalNvr)[] }) {
  if (nvrs.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Sin servidores NVR en este contexto. Usa el boton <strong>Importar Excel</strong> para agregar datos.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
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
          {nvrs.map((nvr) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const isLocal = (nvr as any).source === "local";
            return (
              <TableRow key={nvr.id}>
                <TableCell>
                  <div className="font-medium">
                    {nvr.name}
                    {localBadge(isLocal)}
                  </div>
                  {nvr.code && <div className="text-xs text-muted-foreground">{nvr.code}</div>}
                </TableCell>
                <TableCell>{nvr.model ?? "—"}</TableCell>
                <TableCell>
                  <code className="text-xs">{nvr.ip_address ?? "—"}</code>
                </TableCell>
                <TableCell>{nvr.camera_channels ?? "—"}</TableCell>
                <TableCell>{nvr.total_storage_tb != null ? `${nvr.total_storage_tb} TB` : "—"}</TableCell>
                <TableCell>{nvr.recording_days ?? "—"}</TableCell>
                <TableCell>{statusBadge(nvr.status, nvr.is_active)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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
    queryKey: ["tenants-for-inventory"],
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
