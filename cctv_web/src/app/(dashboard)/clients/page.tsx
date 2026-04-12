"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Building2 } from "lucide-react";
import { listClients, createClient } from "@/lib/api/clients";
import { usePermissions } from "@/hooks/use-permissions";
import { useTenantStore } from "@/stores/tenant-store";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { DataTable } from "@/components/data-table";
import { clientColumns } from "./columns";
import { ClientDialog, type ClientFormValues } from "./client-dialog";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const { canAny, permissions, roles } = usePermissions();
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";
  const [dialogOpen, setDialogOpen] = useState(false);
  const canCreateClient = canAny("clients.create", "clients:create:own", "clients:create:all");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", currentCompany?.id],
    queryFn: () => listClients(),
    enabled: !isPlatformAdmin || !!currentCompany,
  });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
      toast.success("Cliente creado exitosamente");
    },
    onError: () => toast.error("Error al crear cliente"),
  });

  async function handleSubmit(data: ClientFormValues) {
    await createMutation.mutateAsync(data);
  }

  // F7: guardia de contexto
  if (isPlatformAdmin && !currentCompany) {
    return (
      <EmptyState
        icon={Users}
        title="Selecciona una empresa"
        description="Este modulo muestra clientes del tenant activo. Selecciona una empresa desde la barra de navegacion para continuar."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Gestión de clientes de la organización</p>
        </div>
        {canCreateClient && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Total Clientes" value={clients.length} icon={Users} color="blue" />
        <StatsCard title="Empresas" value={clients.filter((client) => client.company_name).length} icon={Building2} color="teal" />
      </div>

      <DataTable
        columns={clientColumns}
        data={clients}
        searchKey="company_name"
        searchPlaceholder="Buscar clientes..."
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Building2}
            title="No hay clientes registrados"
            description={
              canCreateClient
                ? "Crea tu primer cliente para comenzar a gestionar servicios."
                : "No hay clientes visibles para este tenant y tu perfil no puede registrar nuevos."
            }
            action={canCreateClient ? { label: "Nuevo Cliente", onClick: () => setDialogOpen(true) } : undefined}
          />
        }
      />

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
