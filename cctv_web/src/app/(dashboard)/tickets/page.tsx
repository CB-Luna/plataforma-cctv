"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  TicketIcon,
} from "lucide-react";
import {
  assignTicket,
  changeTicketStatus,
  createTicket,
  deleteTicket,
  getTicketStats,
  listTickets,
  updateTicket,
} from "@/lib/api/tickets";
import { usePermissions } from "@/hooks/use-permissions";
import { useSiteStore } from "@/stores/site-store";
import type { Ticket } from "@/types/api";
import { DataTable } from "@/components/data-table";
import { SiteContextBanner } from "@/components/context/site-context-banner";
import { ExportButton } from "@/components/shared/export-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { toast } from "sonner";
import { filterByActiveSite } from "@/lib/site-context";
import { getColumns } from "./columns";
import { AssignDialog, StatusDialog } from "./ticket-actions";
import { TicketDialog, type TicketFormValues } from "./ticket-dialog";

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { canAny } = usePermissions();
  const currentSite = useSiteStore((s) => s.currentSite);
  const clearSite = useSiteStore((s) => s.clearSite);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [assignTarget, setAssignTarget] = useState<Ticket | null>(null);
  const [statusTarget, setStatusTarget] = useState<Ticket | null>(null);

  const canCreateTicket = canAny("tickets.create", "tickets:create:own", "tickets:create:all");
  const canEditTicket = canAny("tickets.update", "tickets:update:own", "tickets:update:all");
  const canAssignTicket = canAny("tickets.assign", "tickets:assign:own", "tickets:assign:all");
  const canChangeStatus = canAny(
    "tickets.update",
    "tickets.update:own",
    "tickets:update:own",
    "tickets:update:all",
    "tickets.close",
    "tickets:close:own",
    "tickets:close:all",
  );
  const canDeleteTicket = canAny("tickets.delete", "tickets:delete:own", "tickets:delete:all");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => listTickets({ limit: 200 }),
  });

  const { data: stats } = useQuery({
    queryKey: ["ticket-stats"],
    queryFn: getTicketStats,
  });

  const filteredTickets = useMemo(
    () => filterByActiveSite(tickets, currentSite?.id),
    [currentSite?.id, tickets],
  );

  const displayedStats = useMemo(() => {
    if (!currentSite) return stats;

    return {
      open_count: filteredTickets.filter((ticket) => ticket.status === "open").length,
      in_progress_count: filteredTickets.filter((ticket) => ticket.status === "in_progress").length,
      critical_count: filteredTickets.filter((ticket) => ticket.priority === "urgent").length,
      completed_count: filteredTickets.filter((ticket) => ticket.status === "completed").length,
    };
  }, [currentSite, filteredTickets, stats]);

  const createMutation = useMutation({
    mutationFn: (values: TicketFormValues) => createTicket(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-stats"] });
      setDialogOpen(false);
      setEditingTicket(null);
      toast.success("Ticket creado");
    },
    onError: () => toast.error("Error al crear ticket"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TicketFormValues }) => updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setDialogOpen(false);
      setEditingTicket(null);
      toast.success("Ticket actualizado");
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-stats"] });
      toast.success("Ticket eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, technicianId }: { id: string; technicianId: string }) =>
      assignTicket(id, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setAssignTarget(null);
      toast.success("Tecnico asignado");
    },
    onError: () => toast.error("Error al asignar"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      changeTicketStatus(id, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-stats"] });
      setStatusTarget(null);
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al cambiar estado"),
  });

  const columns = getColumns(
    {
      onView: (ticket) => router.push(`/tickets/${ticket.id}`),
      onEdit: (ticket) => {
        setEditingTicket(ticket);
        setDialogOpen(true);
      },
      onAssign: (ticket) => setAssignTarget(ticket),
      onChangeStatus: (ticket) => setStatusTarget(ticket),
      onDelete: (ticket) => {
        if (confirm(`¿Eliminar ticket "${ticket.ticket_number}"?`)) {
          deleteMutation.mutate(ticket.id);
        }
      },
    },
    {
      canEdit: canEditTicket,
      canAssign: canAssignTicket,
      canChangeStatus,
      canDelete: canDeleteTicket,
    },
  );

  function handleSubmit(values: TicketFormValues) {
    if (editingTicket) {
      updateMutation.mutate({ id: editingTicket.id, data: values });
      return;
    }

    createMutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <SiteContextBanner
        site={currentSite}
        description="La lista y los indicadores visibles se limitan al sitio operativo activo."
        onClear={clearSite}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">Gestion de tickets de soporte tecnico</p>
        </div>
        {canCreateTicket && (
          <Button
            onClick={() => {
              setEditingTicket(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo ticket
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Abiertos" value={displayedStats?.open_count ?? 0} icon={TicketIcon} color="blue" />
        <StatsCard title="En progreso" value={displayedStats?.in_progress_count ?? 0} icon={Clock} color="amber" />
        <StatsCard title="Criticos" value={displayedStats?.critical_count ?? 0} icon={AlertTriangle} color="red" />
        <StatsCard title="Completados" value={displayedStats?.completed_count ?? 0} icon={CheckCircle} color="green" />
      </div>

      <DataTable
        columns={columns}
        data={filteredTickets as Ticket[]}
        isLoading={isLoading}
        searchPlaceholder="Buscar tickets..."
        emptyState={
          <EmptyState
            icon={TicketIcon}
            title="No hay tickets"
            description={
              canCreateTicket
                ? "Crea un ticket de soporte para comenzar el seguimiento."
                : "No hay tickets visibles para este contexto y tu perfil no puede registrar nuevos."
            }
            action={
              canCreateTicket
                ? {
                    label: "Nuevo Ticket",
                    onClick: () => {
                      setEditingTicket(null);
                      setDialogOpen(true);
                    },
                  }
                : undefined
            }
          />
        }
        toolbar={
          <ExportButton
            data={filteredTickets as unknown as Record<string, unknown>[]}
            columns={[
              { header: "Ticket", accessorKey: "ticket_number" },
              { header: "Titulo", accessorKey: "title" },
              { header: "Estado", accessorKey: "status" },
              { header: "Prioridad", accessorKey: "priority" },
              { header: "Sitio", accessorKey: "site_name" },
              { header: "Creado", accessorKey: "created_at" },
            ]}
            filename="Tickets"
          />
        }
      />

      <TicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        ticket={editingTicket}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AssignDialog
        open={!!assignTarget}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
        onAssign={(technicianId) => {
          if (assignTarget) assignMutation.mutate({ id: assignTarget.id, technicianId });
        }}
        isLoading={assignMutation.isPending}
      />

      <StatusDialog
        open={!!statusTarget}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        currentStatus={statusTarget?.status}
        onChangeStatus={(status, reason) => {
          if (statusTarget) statusMutation.mutate({ id: statusTarget.id, status, reason });
        }}
        isLoading={statusMutation.isPending}
      />
    </div>
  );
}
