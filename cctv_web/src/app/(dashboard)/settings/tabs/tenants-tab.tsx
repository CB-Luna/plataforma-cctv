"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import {
  listTenants,
  createTenant,
  updateTenant,
  activateTenant,
  deactivateTenant,
  getTenantStats,
} from "@/lib/api/tenants";
import type { Tenant } from "@/types/api";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { getTenantColumns } from "../../tenants/columns";
import { TenantDialog, type TenantFormValues } from "../../tenants/tenant-dialog";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";

export function TenantsTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const canCreateTenant = canAny("tenants.create", "tenants:create:all");
  const canEditTenant = canAny("tenants.update", "tenants:update:all");
  const canToggleTenant = canEditTenant;

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => listTenants(),
  });

  const { data: stats } = useQuery({
    queryKey: ["tenants", "stats"],
    queryFn: getTenantStats,
  });

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setDialogOpen(false);
      toast.success("Empresa creada exitosamente");
    },
    onError: () => toast.error("Error al crear empresa"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TenantFormValues }) =>
      updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setDialogOpen(false);
      setEditingTenant(null);
      toast.success("Empresa actualizada");
    },
    onError: () => toast.error("Error al actualizar empresa"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (tenant: Tenant) =>
      tenant.is_active ? deactivateTenant(tenant.id) : activateTenant(tenant.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al cambiar estado"),
  });

  const columns = useMemo(
    () =>
      getTenantColumns(
        {
          onEdit: (tenant) => {
            setEditingTenant(tenant);
            setDialogOpen(true);
          },
          onToggleActive: (tenant) => toggleActiveMutation.mutate(tenant),
        },
        {
          canEdit: canEditTenant,
          canToggleActive: canToggleTenant,
        },
      ),
    [canEditTenant, canToggleTenant, toggleActiveMutation],
  );

  async function handleSubmit(data: TenantFormValues) {
    if (editingTenant) {
      await updateMutation.mutateAsync({ id: editingTenant.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Empresas del sistema</h3>
          <p className="text-sm text-muted-foreground">GestiÃ³n de organizaciones multi-tenant</p>
        </div>
        {canCreateTenant && (
          <Button onClick={() => { setEditingTenant(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Empresa
          </Button>
        )}
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard title="Total Empresas" value={stats.total_tenants} icon={Building2} color="blue" />
          <StatsCard title="Activas" value={stats.active_tenants} icon={CheckCircle} color="green" />
          <StatsCard title="Inactivas" value={stats.total_tenants - stats.active_tenants} icon={Building2} color="red" />
        </div>
      )}

      <DataTable
        columns={columns}
        data={tenants}
        searchKey="name"
        searchPlaceholder="Buscar empresa..."
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Building2}
            title="No hay empresas registradas"
            description="Registra tu primera empresa para comenzar."
            action={canCreateTenant ? { label: "Nueva Empresa", onClick: () => { setEditingTenant(null); setDialogOpen(true); } } : undefined}
          />
        }
      />

      <TenantDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTenant(null);
        }}
        tenant={editingTenant}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
