"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listClients, createClient } from "@/lib/api/clients";
import { DataTable } from "@/components/data-table";
import { clientColumns } from "./columns";
import { ClientDialog, type ClientFormValues } from "./client-dialog";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { Plus, Users, Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import type { CreateClientRequest } from "@/types/api";

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Gestión de clientes de la organización</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Total Clientes" value={clients.length} icon={Users} color="blue" />
        <StatsCard title="Empresas" value={clients.filter((c) => c.company_name).length} icon={Building2} color="teal" />
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
            description="Crea tu primer cliente para comenzar a gestionar servicios."
            action={{ label: "Nuevo Cliente", onClick: () => setDialogOpen(true) }}
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
