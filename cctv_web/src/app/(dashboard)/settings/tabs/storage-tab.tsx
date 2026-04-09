"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, HardDrive, Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";
import type { StorageConfiguration } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsCard } from "@/components/ui/stats-card";
import { usePermissions } from "@/hooks/use-permissions";
import {
  createStorageConfiguration,
  deleteStorageConfiguration,
  getFileStats,
  listStorageConfigurations,
  listStorageProviders,
  updateStorageConfiguration,
} from "@/lib/api/storage";
import { getColumns } from "../../storage/columns";
import { ConfigDialog, type ConfigFormValues } from "../../storage/config-dialog";

export function StorageTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const [editConfig, setEditConfig] = useState<StorageConfiguration | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const canCreateConfig = canAny("storage.create", "storage:update:own", "storage:update:all");
  const canEditConfig = canAny("storage.update", "storage:update:own", "storage:update:all");
  const canDeleteConfig = canAny("storage.delete", "storage:delete:own", "storage:delete:all");

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["storage-configs"],
    queryFn: listStorageConfigurations,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["storage-providers"],
    queryFn: listStorageProviders,
  });

  const { data: stats } = useQuery({
    queryKey: ["file-stats"],
    queryFn: getFileStats,
  });

  const createMutation = useMutation({
    mutationFn: (data: ConfigFormValues) => createStorageConfiguration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-configs"] });
      toast.success("Configuracion creada");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear configuracion"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConfigFormValues }) =>
      updateStorageConfiguration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-configs"] });
      toast.success("Configuracion actualizada");
      setDialogOpen(false);
      setEditConfig(null);
    },
    onError: () => toast.error("Error al actualizar configuracion"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStorageConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-configs"] });
      toast.success("Configuracion eliminada");
    },
    onError: () => toast.error("Error al eliminar configuracion"),
  });

  function handleSubmit(values: ConfigFormValues) {
    const clean = { ...values };
    for (const key of Object.keys(clean) as (keyof ConfigFormValues)[]) {
      if (clean[key] === "") delete clean[key];
    }

    if (editConfig) {
      updateMutation.mutate({ id: editConfig.id, data: clean });
      return;
    }

    createMutation.mutate(clean);
  }

  const columns = getColumns(
    {
      onEdit: (config) => {
        setEditConfig(config);
        setDialogOpen(true);
      },
      onDelete: (config) => {
        if (confirm(`Eliminar "${config.config_name}"?`)) {
          deleteMutation.mutate(config.id);
        }
      },
    },
    {
      canEdit: canEditConfig,
      canDelete: canDeleteConfig,
    },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {canCreateConfig ? (
          <Button
            onClick={() => {
              setEditConfig(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva configuracion
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatsCard title="Archivos totales" value={stats?.total_files ?? 0} icon={FileText} color="blue" />
        <StatsCard
          title="Almacenamiento usado"
          value={stats ? formatBytes(stats.total_storage_size_bytes) : "0 B"}
          icon={HardDrive}
          color="purple"
        />
        <StatsCard title="Configuraciones" value={configs.length} icon={Settings2} color="teal" />
      </div>

      <DataTable
        columns={columns}
        data={configs}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={HardDrive}
            title="Sin configuraciones de almacenamiento"
            description="Configura un proveedor de almacenamiento para este tenant."
            action={
              canCreateConfig
                ? {
                    label: "Nueva configuracion",
                    onClick: () => {
                      setEditConfig(null);
                      setDialogOpen(true);
                    },
                  }
                : undefined
            }
          />
        }
      />

      <ConfigDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditConfig(null);
        }}
        onSubmit={handleSubmit}
        config={editConfig}
        providers={providers}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
