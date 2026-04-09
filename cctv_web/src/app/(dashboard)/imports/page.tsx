"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, FileCheck, FileWarning, Loader2, Upload } from "lucide-react";
import type { ImportBatch } from "@/types/api";
import {
  cancelImportBatch,
  createImportBatch,
  deleteImportBatch,
  getImportStats,
  listImportBatches,
  processImportBatch,
} from "@/lib/api/imports";
import { getColumns } from "./columns";
import { BatchDetailDialog } from "./batch-detail-dialog";
import { ImportDialog, type ImportSubmissionPayload } from "./import-dialog";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenantStore } from "@/stores/tenant-store";
import { usePermissions } from "@/hooks/use-permissions";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";

export default function ImportsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailBatch, setDetailBatch] = useState<ImportBatch | null>(null);
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const { permissions, roles } = usePermissions();
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";

  const { data: batches, isLoading } = useQuery({
    queryKey: ["import-batches"],
    queryFn: () => listImportBatches(),
    enabled: !isPlatformAdmin,
  });

  const { data: stats } = useQuery({
    queryKey: ["import-stats"],
    queryFn: () => getImportStats(),
    enabled: !isPlatformAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (values: ImportSubmissionPayload) =>
      createImportBatch({
        batch_name: values.batch_name,
        source_type: values.source_type,
        source_filename: values.source_filename,
        target_table: values.target_table,
        column_mapping: values.column_mapping,
        data: values.data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-batches"] });
      queryClient.invalidateQueries({ queryKey: ["import-stats"] });
      setCreateOpen(false);
      toast.success("Lote de importacion creado");
    },
    onError: () => toast.error("No se pudo crear el lote de importacion"),
  });

  const processMutation = useMutation({
    mutationFn: (batchId: string) => processImportBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-batches"] });
      queryClient.invalidateQueries({ queryKey: ["import-stats"] });
      toast.success("Procesamiento iniciado");
    },
    onError: () => toast.error("No se pudo procesar el lote"),
  });

  const cancelMutation = useMutation({
    mutationFn: (batchId: string) => cancelImportBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-batches"] });
      toast.success("Lote cancelado");
    },
    onError: () => toast.error("No se pudo cancelar el lote"),
  });

  const deleteMutation = useMutation({
    mutationFn: (batchId: string) => deleteImportBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-batches"] });
      queryClient.invalidateQueries({ queryKey: ["import-stats"] });
      toast.success("Lote eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el lote"),
  });

  const columns = getColumns({
    onView: (batch) => setDetailBatch(batch),
    onProcess: (batch) => processMutation.mutate(batch.id),
    onCancel: (batch) => cancelMutation.mutate(batch.id),
    onDelete: (batch) => {
      if (confirm("Eliminar este lote de importacion?")) {
        deleteMutation.mutate(batch.id);
      }
    },
  });

  const statsData = stats as {
    total_batches?: number;
    pending_batches?: number;
    completed_batches?: number;
    failed_batches?: number;
  } | undefined;

  return (
    <div className="space-y-6">
      {isPlatformAdmin ? (
        <EmptyState
          icon={Building2}
          title="Importaciones disponibles por empresa"
          description="Este modulo opera en el contexto de una empresa especifica. Selecciona una empresa desde el panel de administracion para gestionar sus importaciones."
        />
      ) : (
      <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importacion masiva</h1>
          <p className="text-muted-foreground">
            Carga CSV o Excel, revisa el mapeo y crea batches reales para camaras y NVR.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Nueva importacion
        </Button>
      </div>

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
            <div className="text-2xl font-bold text-green-600">{statsData?.completed_batches ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statsData?.failed_batches ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={(batches as ImportBatch[]) ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar lotes..."
        emptyState={(
          <EmptyState
            icon={Upload}
            title="No hay importaciones"
            description="Carga un archivo CSV o Excel, revisa el mapeo y crea tu primer lote."
            action={{ label: "Nueva importacion", onClick: () => setCreateOpen(true) }}
          />
        )}
      />

      <ImportDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(values) => createMutation.mutate(values)}
        isLoading={createMutation.isPending}
      />

      <BatchDetailDialog
        open={!!detailBatch}
        onOpenChange={(open) => {
          if (!open) {
            setDetailBatch(null);
          }
        }}
        batch={detailBatch}
      />
      </>
      )}
    </div>
  );
}
