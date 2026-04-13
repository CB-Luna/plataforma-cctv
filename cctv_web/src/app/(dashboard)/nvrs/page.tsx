"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2, HardDrive, Server } from "lucide-react";
import { toast } from "sonner";
import { createNvr, deleteNvr, getNvrStats, listNvrs, updateNvr } from "@/lib/api/nvrs";
import { listSites } from "@/lib/api/sites";
import type { NvrServer } from "@/types/api";
import { useSiteStore } from "@/stores/site-store";
import { useTenantStore } from "@/stores/tenant-store";
import { usePermissions } from "@/hooks/use-permissions";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { filterByActiveSite } from "@/lib/site-context";
import { getLocalInventory } from "@/lib/inventory/local-store";
import { getColumns } from "./columns";
import { safeStatus } from "@/lib/safe-field";
import { NvrDialog, type NvrFormValues } from "./nvr-dialog";
import { SiteContextBanner } from "@/components/context/site-context-banner";
import { DataTable } from "@/components/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NvrsPage() {
  const queryClient = useQueryClient();
  const currentSite = useSiteStore((state) => state.currentSite);
  const clearSite = useSiteStore((state) => state.clearSite);

  const currentCompany = useTenantStore((s) => s.currentCompany);
  const { permissions, roles } = usePermissions();
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNvr, setEditingNvr] = useState<NvrServer | null>(null);

  const { data: nvrs = [], isLoading } = useQuery({
    queryKey: ["nvrs", currentCompany?.id],
    queryFn: listNvrs,
    enabled: !isPlatformAdmin || !!currentCompany,
  });

  const { data: stats } = useQuery({
    queryKey: ["nvrs", "stats", currentCompany?.id],
    queryFn: () => getNvrStats(),
    enabled: !isPlatformAdmin || !!currentCompany,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites", currentCompany?.id],
    queryFn: listSites,
    enabled: !isPlatformAdmin || !!currentCompany,
  });

  const createMutation = useMutation({
    mutationFn: createNvr,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nvrs"] });
      queryClient.invalidateQueries({ queryKey: ["nvrs", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("NVR creado correctamente");
      setDialogOpen(false);
    },
    onError: () => toast.error("No se pudo crear el NVR"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NvrFormValues }) =>
      updateNvr(id, data as Parameters<typeof updateNvr>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nvrs"] });
      queryClient.invalidateQueries({ queryKey: ["nvrs", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Base del NVR actualizada");
      setDialogOpen(false);
      setEditingNvr(null);
    },
    onError: () => toast.error("No se pudo actualizar el NVR"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNvr,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nvrs"] });
      queryClient.invalidateQueries({ queryKey: ["nvrs", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("NVR eliminado correctamente");
    },
    onError: () => toast.error("No se pudo eliminar el NVR"),
  });

  const siteNames = useMemo(
    () => new Map(sites.map((site) => [site.id, site.name])),
    [sites],
  );

  const scopedNvrs = useMemo(
    () => filterByActiveSite(nvrs, currentSite?.id),
    [currentSite?.id, nvrs],
  );

  // Fusionar datos importados localmente (Excel) con datos del API
  const localData = useMemo(() => {
    const tenantId = currentCompany?.id || null;
    const siteId = currentSite?.id || null;
    return getLocalInventory(tenantId, siteId);
  }, [currentCompany?.id, currentSite?.id]);

  const allNvrs = useMemo(() => {
    const localNvrs = (localData?.nvrs ?? []) as NvrServer[];
    return [...scopedNvrs, ...localNvrs];
  }, [scopedNvrs, localData]);

  const displayStats = useMemo(() => {
    if (!currentSite) return stats;

    const activeServers = scopedNvrs.filter((nvr) => {
      const status = safeStatus(nvr.status, nvr.is_active);
      return status === "active";
    });

    return {
      total_servers: scopedNvrs.length,
      active_servers: activeServers.length,
      inactive_servers: scopedNvrs.length - activeServers.length,
      total_cameras: scopedNvrs.reduce((acc, nvr) => acc + (nvr.camera_channels ?? 0), 0),
      total_storage_tb: scopedNvrs.reduce((acc, nvr) => acc + (nvr.total_storage_tb ?? 0), 0),
    };
  }, [currentSite, scopedNvrs, stats]);

  const exportRows = useMemo(() => allNvrs.map((nvr) => ({
    ...nvr,
    site_name: nvr.site_id ? siteNames.get(nvr.site_id) ?? "Sitio asignado" : "Sin sitio",
  })), [allNvrs, siteNames]);

  const columns = useMemo(() => getColumns({
    onDelete: (nvr) => {
      if (confirm(`Eliminar el NVR "${nvr.name}"?`)) {
        deleteMutation.mutate(nvr.id);
      }
    },
    onOpen: (nvr) => {
      setEditingNvr(nvr);
      setDialogOpen(true);
    },
    siteNames,
  }), [deleteMutation, siteNames]);

  async function handleSubmit(data: NvrFormValues) {
    if (editingNvr) {
      await updateMutation.mutateAsync({ id: editingNvr.id, data });
      return;
    }

    await createMutation.mutateAsync(data as Parameters<typeof createNvr>[0]);
  }

  return (
    <div className="space-y-6">
      {/* Guard: Admin del Sistema sin empresa seleccionada */}
      {isPlatformAdmin && !currentCompany ? (
        <>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Servidores NVR</h2>
            <p className="text-muted-foreground">
              Infraestructura de grabacion.
            </p>
          </div>
          <EmptyState
            icon={Building2}
            title="Selecciona una empresa"
            description="Para ver y gestionar servidores NVR, primero selecciona una empresa desde Configuracion."
          />
        </>
      ) : (
        <>
      <SiteContextBanner
        site={currentSite}
        description="La lista, los KPI y el alta manual se acotan al sitio activo. Limpia el contexto para volver al agregado global del tenant."
        onClear={clearSite}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Servidores NVR</h2>
          <p className="text-muted-foreground">
            Infraestructura de grabacion con contexto operativo por sitio y edicion manual parcial.
          </p>
        </div>
        <Button onClick={() => {
          setEditingNvr(null);
          setDialogOpen(true);
        }}>
          Nuevo NVR
        </Button>
      </div>

      {displayStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total servidores</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.total_servers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{displayStats.active_servers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canales declarados</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.total_cameras}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.total_storage_tb} TB</div>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        columns={columns}
        data={allNvrs}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Buscar NVR..."
        emptyState={(
          <EmptyState
            icon={Server}
            title="No hay servidores NVR"
            description={
              currentSite
                ? "No hay NVR visibles para el sitio activo. Limpia el contexto o registra un servidor manual."
                : "Registra tu primer servidor de grabacion en red."
            }
            action={{ label: "Nuevo NVR", onClick: () => {
              setEditingNvr(null);
              setDialogOpen(true);
            } }}
          />
        )}
        toolbar={(
          <ExportButton
            data={exportRows as unknown as Record<string, unknown>[]}
            columns={[
              { header: "Nombre", accessorKey: "name" },
              { header: "Sitio", accessorKey: "site_name" },
              { header: "Modelo", accessorKey: "model" },
              { header: "Edicion", accessorKey: "edition" },
              { header: "Canales", accessorKey: "camera_channels" },
              { header: "Estado", accessorKey: "status" },
            ]}
            filename="nvrs"
          />
        )}
      />

      <NvrDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);
          if (!value) {
            setEditingNvr(null);
          }
        }}
        nvr={editingNvr}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
        </>
      )}
    </div>
  );
}
