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
import { toScheduledDatePayload } from "@/lib/contracts/contractual";
import { useSiteStore } from "@/stores/site-store";
import { useTenantStore } from "@/stores/tenant-store";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import type { CreateTicketRequest, Ticket, UpdateTicketRequest } from "@/types/api";
import { DataTable } from "@/components/data-table";
import { SiteContextBanner } from "@/components/context/site-context-banner";
import { CoverageStatusBadge, SlaStatusBadge } from "@/components/contracts/status-badges";
import { ExportButton } from "@/components/shared/export-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { filterByActiveSite } from "@/lib/site-context";
import { getColumns } from "./columns";
import { AssignDialog, StatusDialog } from "./ticket-actions";
import { TicketDialog, type TicketFormValues } from "./ticket-dialog";

function trimToUndefined(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toCreateTicketPayload(values: TicketFormValues): CreateTicketRequest {
  return {
    title: values.title.trim(),
    description: trimToUndefined(values.description),
    client_id: values.client_id,
    site_id: values.site_id,
    type: values.type,
    priority: values.priority,
    policy_id: trimToUndefined(values.policy_id),
    equipment_id: trimToUndefined(values.equipment_id),
  };
}

function toUpdateTicketPayload(values: TicketFormValues): UpdateTicketRequest {
  return {
    title: values.title.trim(),
    description: trimToUndefined(values.description),
    equipment_id: trimToUndefined(values.equipment_id),
    scheduled_date: toScheduledDatePayload(values.scheduled_date),
  };
}

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { canAny, permissions, roles } = usePermissions();
  const currentSite = useSiteStore((s) => s.currentSite);
  const clearSite = useSiteStore((s) => s.clearSite);
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [assignTarget, setAssignTarget] = useState<Ticket | null>(null);
  const [statusTarget, setStatusTarget] = useState<Ticket | null>(null);
  const [coverageFilter, setCoverageFilter] = useState("__all__");
  const [slaFilter, setSlaFilter] = useState("__all__");

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

  const siteScopedTickets = useMemo(
    () => filterByActiveSite(tickets, currentSite?.id),
    [currentSite?.id, tickets],
  );

  const filteredTickets = useMemo(
    () =>
      siteScopedTickets.filter((ticket) => {
        const matchesCoverage =
          coverageFilter === "__all__" || (ticket.coverage_status ?? "unknown") === coverageFilter;
        const matchesSla = slaFilter === "__all__" || (ticket.sla_status ?? "unknown") === slaFilter;
        return matchesCoverage && matchesSla;
      }),
    [coverageFilter, siteScopedTickets, slaFilter],
  );

  const displayedStats = useMemo(() => {
    if (!currentSite) return stats;

    return {
      open_count: siteScopedTickets.filter((ticket) => ticket.status === "open").length,
      in_progress_count: siteScopedTickets.filter((ticket) => ticket.status === "in_progress").length,
      critical_count: siteScopedTickets.filter((ticket) => ticket.priority === "urgent").length,
      completed_count: siteScopedTickets.filter((ticket) => ticket.status === "completed").length,
    };
  }, [currentSite, siteScopedTickets, stats]);

  const contractSummary = useMemo(
    () => ({
      covered: siteScopedTickets.filter((ticket) => ticket.coverage_status === "covered").length,
      partial: siteScopedTickets.filter((ticket) => ticket.coverage_status === "partial").length,
      uncovered: siteScopedTickets.filter(
        (ticket) => !ticket.coverage_status || ticket.coverage_status === "unknown" || ticket.coverage_status === "not_covered",
      ).length,
      sla_ok: siteScopedTickets.filter((ticket) => ticket.sla_status === "ok").length,
      sla_at_risk: siteScopedTickets.filter((ticket) => ticket.sla_status === "at_risk").length,
      sla_breached: siteScopedTickets.filter((ticket) => ticket.sla_status === "breached").length,
      sla_unknown: siteScopedTickets.filter(
        (ticket) => !ticket.sla_status || ticket.sla_status === "unknown",
      ).length,
    }),
    [siteScopedTickets],
  );

  const createMutation = useMutation({
    mutationFn: (values: TicketFormValues) => createTicket(toCreateTicketPayload(values)),
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
    mutationFn: ({ id, data }: { id: string; data: TicketFormValues }) =>
      updateTicket(id, toUpdateTicketPayload(data)),
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
        if (confirm(`Eliminar ticket "${ticket.ticket_number}"?`)) {
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

  // F7: guardia de contexto — el Admin de Plataforma debe seleccionar empresa antes de operar
  if (isPlatformAdmin && !currentCompany) {
    return (
      <EmptyState
        icon={TicketIcon}
        title="Selecciona una empresa"
        description="Este modulo muestra tickets del tenant activo. Selecciona una empresa desde la barra de navegacion para continuar."
      />
    );
  }

  return (
    <div className="space-y-6">
      <SiteContextBanner
        site={currentSite}
        description="La lista visible se limita al sitio operativo activo y los filtros contractuales ayudan a revisar cobertura y SLA sin perder ese contexto."
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cobertura contractual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              El backend marca cobertura al crear el ticket segun poliza explicita o poliza activa del cliente/sitio.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-lg border px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Cubiertos</div>
                <div className="mt-1 flex items-center gap-2">
                  <CoverageStatusBadge status="covered" />
                  <span className="font-semibold">{contractSummary.covered}</span>
                </div>
              </div>
              <div className="rounded-lg border px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Parcial</div>
                <div className="mt-1 flex items-center gap-2">
                  <CoverageStatusBadge status="partial" />
                  <span className="font-semibold">{contractSummary.partial}</span>
                </div>
              </div>
              <div className="rounded-lg border px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Sin validar</div>
                <div className="mt-1 flex items-center gap-2">
                  <CoverageStatusBadge status="unknown" />
                  <span className="font-semibold">{contractSummary.uncovered}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Seguimiento SLA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              El SLA se resuelve al crear el ticket y se refresca en cambios de estado. La tabla permite revisar incumplidos o en riesgo.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-lg border px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">En tiempo</div>
                <div className="mt-1 flex items-center gap-2">
                  <SlaStatusBadge status="ok" />
                  <span className="font-semibold">{contractSummary.sla_ok}</span>
                </div>
              </div>
              <div className="rounded-lg border px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">En riesgo</div>
                <div className="mt-1 flex items-center gap-2">
                  <SlaStatusBadge status="at_risk" />
                  <span className="font-semibold">{contractSummary.sla_at_risk}</span>
                </div>
              </div>
              <div className="rounded-lg border px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">Incumplidos / sin regla</div>
                <div className="mt-1 flex items-center gap-2">
                  <SlaStatusBadge status="breached" />
                  <span className="font-semibold">
                    {contractSummary.sla_breached + contractSummary.sla_unknown}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={filteredTickets as Ticket[]}
        isLoading={isLoading}
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
          <div className="flex flex-wrap items-center gap-2">
            <Select value={coverageFilter} onValueChange={(value) => setCoverageFilter(value ?? "__all__")}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Cobertura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Toda la cobertura</SelectItem>
                <SelectItem value="covered">Cubiertos</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="unknown">Pendiente</SelectItem>
                <SelectItem value="not_covered">Sin cobertura</SelectItem>
              </SelectContent>
            </Select>

            <Select value={slaFilter} onValueChange={(value) => setSlaFilter(value ?? "__all__")}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="SLA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todo el SLA</SelectItem>
                <SelectItem value="ok">En tiempo</SelectItem>
                <SelectItem value="at_risk">En riesgo</SelectItem>
                <SelectItem value="breached">Incumplido</SelectItem>
                <SelectItem value="unknown">Sin regla</SelectItem>
              </SelectContent>
            </Select>

            <ExportButton
              data={filteredTickets as unknown as Record<string, unknown>[]}
              columns={[
                { header: "Ticket", accessorKey: "ticket_number" },
                { header: "Titulo", accessorKey: "title" },
                { header: "Estado", accessorKey: "status" },
                { header: "Prioridad", accessorKey: "priority" },
                { header: "Poliza", accessorKey: "policy_number" },
                { header: "Cobertura", accessorKey: "coverage_status" },
                { header: "SLA", accessorKey: "sla_status" },
                { header: "Sitio", accessorKey: "site_name" },
              ]}
              filename="Tickets"
            />
          </div>
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
