"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { createPolicy, deletePolicy, listPolicies, updatePolicy } from "@/lib/api/policies";
import { serializePolicyCoverage } from "@/lib/contracts/contractual";
import { useSiteStore } from "@/stores/site-store";
import type { CreatePolicyRequest, Policy, UpdatePolicyRequest } from "@/types/api";
import { SiteContextBanner } from "@/components/context/site-context-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { ExportButton } from "@/components/shared/export-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterByActiveSite } from "@/lib/site-context";
import { getColumns } from "./columns";
import { PolicyDialog, type PolicyFormValues } from "./policy-dialog";

function trimToUndefined(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function optionalNumber(value?: number) {
  return typeof value === "number" && !Number.isNaN(value) ? value : undefined;
}

function toPolicyPayloadBase(values: PolicyFormValues) {
  return {
    policy_number: values.policy_number.trim(),
    client_id: values.client_id,
    site_id: trimToUndefined(values.site_id),
    status: values.status,
    start_date: values.start_date,
    end_date: values.end_date,
    monthly_payment: values.monthly_payment,
    payment_day: optionalNumber(values.payment_day),
    vendor: trimToUndefined(values.vendor),
    contract_type: trimToUndefined(values.contract_type),
    annual_value: optionalNumber(values.annual_value),
    contract_url: trimToUndefined(values.contract_url),
    notes: trimToUndefined(values.notes),
    coverage_json: serializePolicyCoverage({
      covered_services: values.covered_services,
      asset_scope: values.asset_scope,
      service_window: values.service_window,
      coverage_notes: values.coverage_notes ?? "",
    }),
  };
}

function toCreatePolicyPayload(values: PolicyFormValues): CreatePolicyRequest {
  return toPolicyPayloadBase(values);
}

function toUpdatePolicyPayload(values: PolicyFormValues): UpdatePolicyRequest {
  return toPolicyPayloadBase(values);
}

function daysUntil(dateString: string) {
  const today = new Date();
  const endDate = new Date(dateString);
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PoliciesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentSite = useSiteStore((s) => s.currentSite);
  const clearSite = useSiteStore((s) => s.clearSite);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [scopeFilter, setScopeFilter] = useState("__all__");

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: () => listPolicies(),
  });

  const siteScopedPolicies = useMemo(
    () => filterByActiveSite(policies, currentSite?.id, { includeUnassigned: true }),
    [currentSite?.id, policies],
  );

  const visiblePolicies = useMemo(
    () =>
      siteScopedPolicies.filter((policy) => {
        if (scopeFilter === "__all__") return true;
        if (scopeFilter === "client_scope") return !policy.site_id;
        if (scopeFilter === "site_scope") return Boolean(policy.site_id);
        return true;
      }),
    [scopeFilter, siteScopedPolicies],
  );

  const createMut = useMutation({
    mutationFn: (values: PolicyFormValues) => createPolicy(toCreatePolicyPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Poliza creada");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear poliza"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PolicyFormValues }) =>
      updatePolicy(id, toUpdatePolicyPayload(data)),
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
      if (confirm("Eliminar esta poliza?")) deleteMut.mutate(policy.id);
    },
  });

  const active = visiblePolicies.filter((policy) => policy.status === "active").length;
  const expiringSoon = visiblePolicies.filter((policy) => {
    const remainingDays = daysUntil(policy.end_date);
    return remainingDays >= 0 && remainingDays <= 30;
  }).length;
  const clientScope = visiblePolicies.filter((policy) => !policy.site_id).length;
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{active}</div>
            <p className="text-xs text-muted-foreground">Activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Vencen en 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-sky-600">{clientScope}</div>
            <p className="text-xs text-muted-foreground">Cobertura cliente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${totalMonthly.toLocaleString("es-MX")}</div>
            <p className="text-xs text-muted-foreground">Ingreso mensual activo</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={visiblePolicies}
        isLoading={isLoading}
        searchKey="policy_number"
        searchPlaceholder="Buscar poliza..."
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
          <div className="flex flex-wrap items-center gap-2">
            <Select value={scopeFilter} onValueChange={(value) => setScopeFilter(value ?? "__all__")}>
              <SelectTrigger className="h-9 w-[190px]">
                <SelectValue placeholder="Alcance de contrato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todo el alcance</SelectItem>
                <SelectItem value="client_scope">Cobertura cliente</SelectItem>
                <SelectItem value="site_scope">Cobertura por sitio</SelectItem>
              </SelectContent>
            </Select>

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
          </div>
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
