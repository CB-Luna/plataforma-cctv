"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { listPolicies, createPolicy, updatePolicy, deletePolicy } from "@/lib/api/policies";
import { getColumns } from "./columns";
import { PolicyDialog, type PolicyFormValues } from "./policy-dialog";
import type { Policy } from "@/types/api";
import { useRouter } from "next/navigation";

export default function PoliciesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: () => listPolicies(),
  });

  const createMut = useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Póliza creada");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear póliza"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PolicyFormValues }) => updatePolicy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Póliza actualizada");
      setDialogOpen(false);
      setEditPolicy(null);
    },
    onError: () => toast.error("Error al actualizar póliza"),
  });

  const deleteMut = useMutation({
    mutationFn: deletePolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Póliza eliminada");
    },
    onError: () => toast.error("Error al eliminar póliza"),
  });

  const handleSubmit = (values: PolicyFormValues) => {
    if (editPolicy) {
      updateMut.mutate({ id: editPolicy.id, data: values });
    } else {
      createMut.mutate(values);
    }
  };

  const columns = getColumns({
    onView: (p) => router.push(`/policies/${p.id}`),
    onEdit: (p) => {
      setEditPolicy(p);
      setDialogOpen(true);
    },
    onDelete: (p) => {
      if (confirm("¿Eliminar esta póliza?")) deleteMut.mutate(p.id);
    },
  });

  // Stats
  const active = policies.filter((p) => p.status === "active").length;
  const expired = policies.filter((p) => p.status === "expired").length;
  const totalMonthly = policies
    .filter((p) => p.status === "active")
    .reduce((acc, p) => acc + p.monthly_payment, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pólizas</h1>
          <p className="text-muted-foreground">Gestión de pólizas y contratos de mantenimiento</p>
        </div>
        <Button onClick={() => { setEditPolicy(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Póliza
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{active}</div>
            <p className="text-xs text-muted-foreground">Activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{expired}</div>
            <p className="text-xs text-muted-foreground">Expiradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${totalMonthly.toLocaleString("es-MX")}</div>
            <p className="text-xs text-muted-foreground">Ingreso Mensual (activas)</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={policies}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={FileText}
            title="No hay pólizas"
            description="Crea una póliza de mantenimiento para gestionar contratos."
            action={{ label: "Nueva Póliza", onClick: () => { setEditPolicy(null); setDialogOpen(true); } }}
          />
        }
        toolbar={
          <ExportButton
            data={policies as unknown as Record<string, unknown>[]}
            columns={[
              { header: "Número", accessorKey: "policy_number" },
              { header: "Estado", accessorKey: "status" },
              { header: "Inicio", accessorKey: "start_date" },
              { header: "Fin", accessorKey: "end_date" },
              { header: "Monto Mensual", accessorKey: "monthly_amount" },
            ]}
            filename="Polizas"
          />
        }
      />

      <PolicyDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditPolicy(null); }}
        onSubmit={handleSubmit}
        policy={editPolicy}
        isLoading={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}
