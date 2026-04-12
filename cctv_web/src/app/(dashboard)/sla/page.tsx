"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { useTenantStore } from "@/stores/tenant-store";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { listSlaPolicies, createSlaPolicy, updateSlaPolicy, deleteSlaPolicy } from "@/lib/api/sla";
import { getColumns } from "./columns";
import { SlaDialog, type SlaFormValues } from "./sla-dialog";
import type { SlaPolicy } from "@/types/api";

export default function SlaPage() {
  const queryClient = useQueryClient();
  const { permissions, roles } = usePermissions();
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSla, setEditSla] = useState<SlaPolicy | null>(null);

  const { data: slaPolicies = [], isLoading } = useQuery({
    queryKey: ["sla-policies", currentCompany?.id],
    queryFn: () => listSlaPolicies(),
    enabled: !isPlatformAdmin || !!currentCompany,
  });

  const createMut = useMutation({
    mutationFn: createSlaPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policies"] });
      toast.success("Politica SLA creada");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear politica SLA"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SlaFormValues }) => updateSlaPolicy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policies"] });
      toast.success("Politica SLA actualizada");
      setDialogOpen(false);
      setEditSla(null);
    },
    onError: () => toast.error("Error al actualizar politica SLA"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSlaPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policies"] });
      toast.success("Politica SLA eliminada");
    },
    onError: () => toast.error("Error al eliminar politica SLA"),
  });

  const handleSubmit = (values: SlaFormValues) => {
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

  const summary = useMemo(
    () => ({
      active: slaPolicies.filter((policy) => policy.is_active).length,
      defaults: slaPolicies.filter((policy) => policy.is_active && policy.is_default).length,
      scoped: slaPolicies.filter((policy) => policy.ticket_priority || policy.ticket_type).length,
      exact: slaPolicies.filter((policy) => policy.ticket_priority && policy.ticket_type).length,
    }),
    [slaPolicies],
  );

  const columns = getColumns({
    onEdit: (sla) => {
      setEditSla(sla);
      setDialogOpen(true);
    },
    onDelete: (sla) => {
      if (confirm("Eliminar esta politica SLA?")) deleteMut.mutate(sla.id);
    },
  });

  // F7: guardia de contexto
  if (isPlatformAdmin && !currentCompany) {
    return (
      <EmptyState
        icon={Shield}
        title="Selecciona una empresa"
        description="Este modulo muestra politicas SLA del tenant activo. Selecciona una empresa desde la barra de navegacion para continuar."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Politicas SLA</h1>
          <p className="text-muted-foreground">
            Acuerdos de nivel de servicio para tiempos de respuesta y resolucion
          </p>
        </div>
        <Button
          onClick={() => {
            setEditSla(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Politica SLA
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">{summary.active}</div>
            <p className="text-xs text-muted-foreground">Reglas activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-sky-600">{summary.defaults}</div>
            <p className="text-xs text-muted-foreground">Defaults activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{summary.scoped}</div>
            <p className="text-xs text-muted-foreground">Reglas con alcance especifico</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-violet-600">{summary.exact}</div>
            <p className="text-xs text-muted-foreground">Prioridad + tipo exactos</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        El backend elige la primera regla activa que coincide con prioridad y tipo; luego cae a coincidencias parciales y al default. Las horas hoy se calculan corridas. `business_hours` queda documentado, pero todavia no altera el motor SLA.
      </div>

      <DataTable
        columns={columns}
        data={slaPolicies}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Buscar politica SLA..."
        emptyState={
          <EmptyState
            icon={Shield}
            title="No hay politicas SLA"
            description="Define tiempos de respuesta y resolucion por prioridad."
            action={{
              label: "Nueva Politica SLA",
              onClick: () => {
                setEditSla(null);
                setDialogOpen(true);
              },
            }}
          />
        }
        toolbar={
          <div className="text-xs text-muted-foreground">
            La columna Coincidencia replica el criterio real con el que se resuelve un ticket al crearse.
          </div>
        }
      />

      <SlaDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);
          if (!value) setEditSla(null);
        }}
        onSubmit={handleSubmit}
        sla={editSla}
        isLoading={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}
