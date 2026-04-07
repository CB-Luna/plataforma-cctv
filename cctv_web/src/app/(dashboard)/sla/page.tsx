"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Shield } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { listSlaPolicies, createSlaPolicy, updateSlaPolicy, deleteSlaPolicy } from "@/lib/api/sla";
import { getColumns } from "./columns";
import { SlaDialog, type SlaFormValues } from "./sla-dialog";
import type { SlaPolicy } from "@/types/api";

export default function SlaPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSla, setEditSla] = useState<SlaPolicy | null>(null);

  const { data: slaPolicies = [], isLoading } = useQuery({
    queryKey: ["sla-policies"],
    queryFn: () => listSlaPolicies(),
  });

  const createMut = useMutation({
    mutationFn: createSlaPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policies"] });
      toast.success("Política SLA creada");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear política SLA"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SlaFormValues }) => updateSlaPolicy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policies"] });
      toast.success("Política SLA actualizada");
      setDialogOpen(false);
      setEditSla(null);
    },
    onError: () => toast.error("Error al actualizar política SLA"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSlaPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policies"] });
      toast.success("Política SLA eliminada");
    },
    onError: () => toast.error("Error al eliminar política SLA"),
  });

  const handleSubmit = (values: SlaFormValues) => {
    // Clean up empty optional strings
    const data = {
      ...values,
      ticket_priority: values.ticket_priority || undefined,
      ticket_type: values.ticket_type || undefined,
    };
    if (editSla) {
      updateMut.mutate({ id: editSla.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const columns = getColumns({
    onEdit: (sla) => {
      setEditSla(sla);
      setDialogOpen(true);
    },
    onDelete: (sla) => {
      if (confirm("¿Eliminar esta política SLA?")) deleteMut.mutate(sla.id);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Políticas SLA</h1>
          <p className="text-muted-foreground">
            Acuerdos de nivel de servicio para tiempos de respuesta y resolución
          </p>
        </div>
        <Button onClick={() => { setEditSla(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Política SLA
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={slaPolicies}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Shield}
            title="No hay políticas SLA"
            description="Define tiempos de respuesta y resolución por prioridad."
            action={{ label: "Nueva Política SLA", onClick: () => { setEditSla(null); setDialogOpen(true); } }}
          />
        }
      />

      <SlaDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditSla(null); }}
        onSubmit={handleSubmit}
        sla={editSla}
        isLoading={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}
