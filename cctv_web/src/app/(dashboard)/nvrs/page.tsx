"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listNvrs, getNvrStats, createNvr, updateNvr, deleteNvr } from "@/lib/api/nvrs";
import type { NvrServer } from "@/types/api";
import { DataTable } from "@/components/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { getColumns } from "./columns";
import { NvrDialog, type NvrFormValues } from "./nvr-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Server, HardDrive, Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

export default function NvrsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNvr, setEditingNvr] = useState<NvrServer | null>(null);

  const { data: nvrs = [], isLoading } = useQuery({
    queryKey: ["nvrs"],
    queryFn: listNvrs,
  });

  const { data: stats } = useQuery({
    queryKey: ["nvrs", "stats"],
    queryFn: getNvrStats,
  });

  const createMutation = useMutation({
    mutationFn: createNvr,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nvrs"] });
      toast.success("NVR creado correctamente");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear el NVR"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NvrFormValues }) =>
      updateNvr(id, data as Parameters<typeof updateNvr>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nvrs"] });
      toast.success("NVR actualizado correctamente");
      setDialogOpen(false);
      setEditingNvr(null);
    },
    onError: () => toast.error("Error al actualizar el NVR"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNvr,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nvrs"] });
      toast.success("NVR eliminado correctamente");
    },
    onError: () => toast.error("Error al eliminar el NVR"),
  });

  const columns = getColumns({
    onEdit: (nvr) => {
      setEditingNvr(nvr);
      setDialogOpen(true);
    },
    onDelete: (nvr) => {
      if (confirm(`¿Eliminar el NVR "${nvr.name}"?`)) {
        deleteMutation.mutate(nvr.id);
      }
    },
    onView: (nvr) => {
      setEditingNvr(nvr);
      setDialogOpen(true);
    },
  });

  async function handleSubmit(data: NvrFormValues) {
    if (editingNvr) {
      await updateMutation.mutateAsync({ id: editingNvr.id, data });
    } else {
      await createMutation.mutateAsync(data as Parameters<typeof createNvr>[0]);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Servidores NVR</h2>
          <p className="text-muted-foreground">
            Gestión de servidores de grabación en red.
          </p>
        </div>
        <Button onClick={() => { setEditingNvr(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo NVR
        </Button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servidores</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_servers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active_servers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cámaras</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_cameras}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_storage_tb} TB</div>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        columns={columns}
        data={nvrs}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Buscar NVR..."
        emptyState={
          <EmptyState
            icon={Server}
            title="No hay servidores NVR"
            description="Registra tu primer servidor de grabación en red."
            action={{ label: "Nuevo NVR", onClick: () => { setEditingNvr(null); setDialogOpen(true); } }}
          />
        }
        toolbar={
          <ExportButton
            data={nvrs as unknown as Record<string, unknown>[]}
            columns={[
              { header: "Nombre", accessorKey: "name" },
              { header: "IP", accessorKey: "ip_address" },
              { header: "Estado", accessorKey: "status" },
              { header: "Modelo", accessorKey: "model" },
              { header: "Fabricante", accessorKey: "manufacturer" },
              { header: "Canales", accessorKey: "channel_count" },
            ]}
            filename="NVRs"
          />
        }
      />

      <NvrDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nvr={editingNvr}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
