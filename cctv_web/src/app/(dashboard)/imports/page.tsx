"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getColumns } from "./columns";
import { ImportDialog, type ImportFormValues } from "./import-dialog";
import { BatchDetailDialog } from "./batch-detail-dialog";
import {
  listImportBatches,
  createImportBatch,
  processImportBatch,
  cancelImportBatch,
  deleteImportBatch,
  getImportStats,
} from "@/lib/api/imports";
import type { ImportBatch } from "@/types/api";
import { toast } from "sonner";
import { Upload, FileCheck, FileWarning, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function ImportsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailBatch, setDetailBatch] = useState<ImportBatch | null>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ["import-batches"],
    queryFn: () => listImportBatches(),
  });

  const { data: stats } = useQuery({
    queryKey: ["import-stats"],
    queryFn: () => getImportStats(),
  });

  const createMutation = useMutation({
    mutationFn: (values: ImportFormValues & { data: Record<string, unknown>[] }) =>
      createImportBatch({
        batch_name: values.batch_name,
        source_type: values.source_type,
        source_filename: values.source_filename,
        target_table: values.target_table,
        column_mapping: {},
        data: values.data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-batches"] });
      queryClient.invalidateQueries({ queryKey: ["import-stats"] });
      setCreateOpen(false);
      toast.success("Lote de importación creado");
    },
    onError: () => toast.error("Error al crear lote"),
  });

  const processMutation = useMutation({
    mutationFn: (batchId: string) => processImportBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-batches"] });
      queryClient.invalidateQueries({ queryKey: ["import-stats"] });
      toast.success("Procesamiento iniciado");
    },
    onError: () => toast.error("Error al procesar lote"),
  });

  const cancelMutation = useMutation({
    mutationFn: (batchId: string) => cancelImportBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-batches"] });
      toast.success("Lote cancelado");
    },
    onError: () => toast.error("Error al cancelar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (batchId: string) => deleteImportBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-batches"] });
      queryClient.invalidateQueries({ queryKey: ["import-stats"] });
      toast.success("Lote eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const columns = getColumns({
    onView: (batch) => setDetailBatch(batch),
    onProcess: (batch) => processMutation.mutate(batch.id),
    onCancel: (batch) => cancelMutation.mutate(batch.id),
    onDelete: (batch) => {
      if (confirm("¿Eliminar este lote de importación?")) {
        deleteMutation.mutate(batch.id);
      }
    },
  });

  const statsData = stats as { total_batches?: number; pending_batches?: number; completed_batches?: number; failed_batches?: number } | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importación masiva</h1>
          <p className="text-muted-foreground">
            Importa cámaras y NVR desde archivos CSV o Excel
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Nueva importación
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total lotes</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.total_batches ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.pending_batches ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsData?.completed_batches ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {statsData?.failed_batches ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={(batches as ImportBatch[]) ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar lotes…"
        emptyState={
          <EmptyState
            icon={Upload}
            title="No hay importaciones"
            description="Importa cámaras y NVRs desde archivos CSV o Excel."
            action={{ label: "Nueva importación", onClick: () => setCreateOpen(true) }}
          />
        }
      />

      {/* Create dialog */}
      <ImportDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(values) => createMutation.mutate(values)}
        isLoading={createMutation.isPending}
      />

      {/* Detail dialog */}
      <BatchDetailDialog
        open={!!detailBatch}
        onOpenChange={(open) => { if (!open) setDetailBatch(null); }}
        batch={detailBatch}
      />
    </div>
  );
}
