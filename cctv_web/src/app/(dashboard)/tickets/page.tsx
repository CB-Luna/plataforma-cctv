"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTickets,
  getTicketStats,
  createTicket,
  updateTicket,
  deleteTicket,
  changeTicketStatus,
  assignTicket,
} from "@/lib/api/tickets";
import type { Ticket } from "@/types/api";
import { DataTable } from "@/components/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { getColumns } from "./columns";
import { TicketDialog, type TicketFormValues } from "./ticket-dialog";
import { AssignDialog, StatusDialog } from "./ticket-actions";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { Plus, TicketIcon, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [assignTarget, setAssignTarget] = useState<Ticket | null>(null);
  const [statusTarget, setStatusTarget] = useState<Ticket | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => listTickets({ limit: 200 }),
  });

  const { data: stats } = useQuery({
    queryKey: ["ticket-stats"],
    queryFn: getTicketStats,
  });

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
      toast.success("Técnico asignado");
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

  const columns = getColumns({
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
  });

  function handleSubmit(values: TicketFormValues) {
    if (editingTicket) {
      updateMutation.mutate({ id: editingTicket.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">Gestión de tickets de soporte técnico</p>
        </div>
        <Button onClick={() => { setEditingTicket(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Abiertos" value={stats?.open_count ?? 0} icon={TicketIcon} color="blue" />
        <StatsCard title="En progreso" value={stats?.in_progress_count ?? 0} icon={Clock} color="amber" />
        <StatsCard title="Críticos" value={stats?.critical_count ?? 0} icon={AlertTriangle} color="red" />
        <StatsCard title="Completados" value={stats?.completed_count ?? 0} icon={CheckCircle} color="green" />
      </div>

      <DataTable
        columns={columns}
        data={tickets as Ticket[]}
        isLoading={isLoading}
        searchPlaceholder="Buscar tickets…"
        emptyState={
          <EmptyState
            icon={TicketIcon}
            title="No hay tickets"
            description="Crea un ticket de soporte para comenzar el seguimiento."
            action={{ label: "Nuevo Ticket", onClick: () => { setEditingTicket(null); setDialogOpen(true); } }}
          />
        }
        toolbar={
          <ExportButton
            data={(tickets as Ticket[]) as unknown as Record<string, unknown>[]}
            columns={[
              { header: "Folio", accessorKey: "folio" },
              { header: "Título", accessorKey: "title" },
              { header: "Estado", accessorKey: "status" },
              { header: "Prioridad", accessorKey: "priority" },
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
        onOpenChange={(open) => { if (!open) setAssignTarget(null); }}
        onAssign={(technicianId) => {
          if (assignTarget) assignMutation.mutate({ id: assignTarget.id, technicianId });
        }}
        isLoading={assignMutation.isPending}
      />

      <StatusDialog
        open={!!statusTarget}
        onOpenChange={(open) => { if (!open) setStatusTarget(null); }}
        currentStatus={statusTarget?.status}
        onChangeStatus={(status, reason) => {
          if (statusTarget) statusMutation.mutate({ id: statusTarget.id, status, reason });
        }}
        isLoading={statusMutation.isPending}
      />
    </div>
  );
}
