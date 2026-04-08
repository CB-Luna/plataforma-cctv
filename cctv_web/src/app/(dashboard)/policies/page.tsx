"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { listPolicies, createPolicy, updatePolicy, deletePolicy } from "@/lib/api/policies";
import { useSiteStore } from "@/stores/site-store";
import type { Policy } from "@/types/api";
import { SiteContextBanner } from "@/components/context/site-context-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { filterByActiveSite } from "@/lib/site-context";
import { getColumns } from "./columns";
import { PolicyDialog, type PolicyFormValues } from "./policy-dialog";

export default function PoliciesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentSite = useSiteStore((s) => s.currentSite);
  const clearSite = useSiteStore((s) => s.clearSite);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: () => listPolicies(),
  });

  const visiblePolicies = useMemo(
    () => filterByActiveSite(policies, currentSite?.id, { includeUnassigned: true }),
    [currentSite?.id, policies],
  );

  const createMut = useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Poliza creada");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear poliza"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PolicyFormValues }) => updatePolicy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Poliza actualizada");
      setDialogOpen(false);
      setEditPolicy(null);
    },
    onError: () => toast.error("Error al actualizar poliza"),
  });

  const deleteMut = useMutation({
    mutationFn: deletePolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Poliza eliminada");
    },
    onError: () => toast.error("Error al eliminar poliza"),
  });

  const handleSubmit = (values: PolicyFormValues) => {
    if (editPolicy) {
      updateMut.mutate({ id: editPolicy.id, data: values });
      return;
    }

    createMut.mutate(values);
  };

  const columns = getColumns({
    onView: (policy) => router.push(`/policies/${policy.id}`),
    onEdit: (policy) => {
      setEditPolicy(policy);
      setDialogOpen(true);
    },
    onDelete: (policy) => {
      if (confirm("¿Eliminar esta poliza?")) deleteMut.mutate(policy.id);
    },
  });

  const active = visiblePolicies.filter((policy) => policy.status === "active").length;
  const expired = visiblePolicies.filter((policy) => policy.status === "expired").length;
  const totalMonthly = visiblePolicies
    .filter((policy) => policy.status === "active")
    .reduce((acc, policy) => acc + policy.monthly_payment, 0);

  return (
    <div className="space-y-6">
      <SiteContextBanner
        site={currentSite}
        description="Se muestran polizas del sitio activo y tambien coberturas sin `site_id`, para no ocultar contratos a nivel cliente."
        onClear={clearSite}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Polizas</h1>
          <p className="text-muted-foreground">Gestion de polizas y contratos de mantenimiento</p>
        </div>
        <Button
          onClick={() => {
            setEditPolicy(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva poliza
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
            <p className="text-xs text-muted-foreground">Ingreso mensual (activas)</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={visiblePolicies}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={FileText}
            title="No hay polizas"
            description="Crea una poliza de mantenimiento para gestionar contratos."
            action={{
              label: "Nueva poliza",
              onClick: () => {
                setEditPolicy(null);
                setDialogOpen(true);
              },
            }}
          />
        }
        toolbar={
          <ExportButton
            data={visiblePolicies as unknown as Record<string, unknown>[]}
            columns={[
              { header: "Numero", accessorKey: "policy_number" },
              { header: "Cliente", accessorKey: "client_name" },
              { header: "Sitio", accessorKey: "site_name" },
              { header: "Estado", accessorKey: "status" },
              { header: "Inicio", accessorKey: "start_date" },
              { header: "Fin", accessorKey: "end_date" },
              { header: "Monto mensual", accessorKey: "monthly_payment" },
            ]}
            filename="Polizas"
          />
        }
      />

      <PolicyDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditPolicy(null);
        }}
        onSubmit={handleSubmit}
        policy={editPolicy}
        isLoading={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}
