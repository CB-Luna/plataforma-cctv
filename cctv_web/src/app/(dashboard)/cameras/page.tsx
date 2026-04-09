"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Camera as CameraIcon, Eye, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { searchCameras, createCamera, deleteCamera, getCameraStats, listCameras } from "@/lib/api/cameras";
import { createImportBatch, processImportBatch } from "@/lib/api/imports";
import { listNvrs } from "@/lib/api/nvrs";
import { listSites } from "@/lib/api/sites";
import type { Camera } from "@/types/api";
import { useSiteStore } from "@/stores/site-store";
import { filterByActiveSite } from "@/lib/site-context";
import { CameraDialog, type CameraFormValues } from "./camera-dialog";
import { ImportDialog, type ImportSubmissionPayload } from "../imports/import-dialog";
import { getColumns } from "./columns";
import { SiteContextBanner } from "@/components/context/site-context-banner";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExportButton } from "@/components/shared/export-button";

export default function CamerasPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentSite = useSiteStore((state) => state.currentSite);
  const clearSite = useSiteStore((state) => state.clearSite);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Camera[] | null>(null);

  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => listCameras({ limit: 200 }),
  });

  const { data: stats } = useQuery({
    queryKey: ["cameras", "stats"],
    queryFn: getCameraStats,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: listSites,
  });

  const { data: nvrs = [] } = useQuery({
    queryKey: ["nvrs"],
    queryFn: listNvrs,
  });

  const createMutation = useMutation({
    mutationFn: createCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      queryClient.invalidateQueries({ queryKey: ["cameras", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Camara creada correctamente");
      setDialogOpen(false);
    },
    onError: () => toast.error("No se pudo crear la camara"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      queryClient.invalidateQueries({ queryKey: ["cameras", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Camara eliminada correctamente");
    },
    onError: () => toast.error("No se pudo eliminar la camara"),
  });

  const siteNames = useMemo(
    () => new Map(sites.map((site) => [site.id, site.name])),
    [sites],
  );

  const nvrNames = useMemo(
    () => new Map(nvrs.map((nvr) => [nvr.id, nvr.name])),
    [nvrs],
  );

  const scopedCameras = useMemo(
    () => filterByActiveSite(cameras, currentSite?.id),
    [cameras, currentSite?.id],
  );

  const displayData = useMemo(() => {
    const baseData = searchResults ?? cameras;
    return filterByActiveSite(baseData, currentSite?.id);
  }, [cameras, currentSite?.id, searchResults]);

  const displayStats = useMemo(() => {
    if (!currentSite) return stats;

    const activeCameras = scopedCameras.filter((camera) => {
      const status = camera.status ?? (camera.is_active ? "active" : "inactive");
      return status === "active";
    });

    return {
      total_cameras: scopedCameras.length,
      active_cameras: activeCameras.length,
      inactive_cameras: scopedCameras.length - activeCameras.length,
      dome_cameras: scopedCameras.filter((camera) => String(camera.camera_type ?? "").toLowerCase().includes("dome")).length,
      bullet_cameras: scopedCameras.filter((camera) => String(camera.camera_type ?? "").toLowerCase().includes("bullet")).length,
      ptz_cameras: scopedCameras.filter((camera) => String(camera.camera_type ?? "").toLowerCase().includes("ptz")).length,
      counting_enabled: scopedCameras.filter((camera) => camera.counting_enabled).length,
    };
  }, [currentSite, scopedCameras, stats]);

  const exportRows = useMemo(() => displayData.map((camera) => ({
    ...camera,
    site_name: camera.site_id ? siteNames.get(camera.site_id) ?? "Sitio asignado" : "Sin sitio",
    nvr_name: camera.nvr_server_id ? nvrNames.get(camera.nvr_server_id) ?? "NVR asignado" : "Sin NVR",
  })), [displayData, nvrNames, siteNames]);

  const columns = useMemo(() => getColumns({
    onDelete: (camera) => {
      if (confirm(`Eliminar la camara "${camera.name}"?`)) {
        deleteMutation.mutate(camera.id);
      }
    },
    onView: (camera) => router.push(`/cameras/${camera.id}`),
    siteNames,
    nvrNames,
  }), [deleteMutation, nvrNames, router, siteNames]);

  async function handleSubmit(data: CameraFormValues) {
    await createMutation.mutateAsync(data as Parameters<typeof createCamera>[0]);
  }

  const importMutation = useMutation({
    mutationFn: async (payload: ImportSubmissionPayload) => {
      const batch = await createImportBatch({
        batch_name: payload.batch_name,
        source_type: payload.source_type,
        source_filename: payload.source_filename,
        target_table: payload.target_table,
        column_mapping: payload.column_mapping,
        data: payload.data,
      });
      if (batch?.id) {
        await processImportBatch(batch.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Importacion iniciada. Los datos apareceran en breve.");
      setImportOpen(false);
    },
    onError: () => toast.error("Error al iniciar la importacion"),
  });

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchCameras(searchQuery.trim());
      setSearchResults(results);
    } catch {
      toast.error("No se pudo ejecutar la busqueda");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      <SiteContextBanner
        site={currentSite}
        description="La tabla, los KPI y el alta manual se acotan al sitio activo. Limpia el contexto para volver al inventario agregado del tenant."
        onClear={clearSite}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Camaras</h2>
          <p className="text-muted-foreground">
            Inventario operativo CCTV con contexto por sitio y lectura honesta del contrato backend.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Excel
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            Nueva camara
          </Button>
        </div>
      </div>

      {displayStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total camaras</CardTitle>
              <CameraIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.total_cameras}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{displayStats.active_cameras}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-xs">
                <span>Domo: {displayStats.dome_cameras}</span>
                <span>Bullet: {displayStats.bullet_cameras}</span>
                <span>PTZ: {displayStats.ptz_cameras}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conteo habilitado</CardTitle>
              <Search className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.counting_enabled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, serie, area o IP..."
            className="pl-9"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>
        <Button variant="secondary" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? "Buscando..." : "Buscar"}
        </Button>
        {searchResults && (
          <Button variant="ghost" onClick={() => {
            setSearchQuery("");
            setSearchResults(null);
          }}>
            Limpiar
          </Button>
        )}
      </div>

      {searchResults && (
        <p className="text-sm text-muted-foreground">
          {displayData.length} resultado(s) visibles para &quot;{searchQuery}&quot; en el contexto actual.
        </p>
      )}

      <DataTable
        columns={columns}
        data={displayData}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Filtrar por nombre..."
        emptyState={(
          <EmptyState
            icon={CameraIcon}
            title="No hay camaras registradas"
            description={
              currentSite
                ? "No hay camaras visibles para el sitio activo. Limpia el contexto o crea una camara manual."
                : "Importa desde CSV/Excel o crea una camara manual para comenzar."
            }
            action={{ label: "Nueva camara", onClick: () => setDialogOpen(true) }}
          />
        )}
        toolbar={(
          <ExportButton
            data={exportRows as unknown as Record<string, unknown>[]}
            columns={[
              { header: "Nombre", accessorKey: "name" },
              { header: "Codigo", accessorKey: "code" },
              { header: "Sitio", accessorKey: "site_name" },
              { header: "NVR", accessorKey: "nvr_name" },
              { header: "Modelo", accessorKey: "camera_model_name" },
              { header: "Estado", accessorKey: "status" },
            ]}
            filename="camaras"
          />
        )}
      />

      <CameraDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSubmit={(payload) => importMutation.mutate(payload)}
        isLoading={importMutation.isPending}
      />
    </div>
  );
}
