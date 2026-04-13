"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import type { Ticket } from "@/types/api";
import { CoverageStatusBadge, SlaStatusBadge } from "@/components/contracts/status-badges";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";

interface ColumnActions {
  onView: (ticket: Ticket) => void;
  onEdit: (ticket: Ticket) => void;
  onAssign: (ticket: Ticket) => void;
  onChangeStatus: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

interface ColumnCapabilities {
  canEdit: boolean;
  canAssign: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
}

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusLabels: Record<string, string> = {
  open: "Abierto",
  assigned: "Asignado",
  in_progress: "En progreso",
  pending_parts: "Esperando piezas",
  pending_client: "Esperando cliente",
  completed: "Completado",
  closed: "Cerrado",
  cancelled: "Cancelado",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "outline",
  assigned: "secondary",
  in_progress: "default",
  pending_parts: "outline",
  pending_client: "outline",
  completed: "default",
  closed: "secondary",
  cancelled: "destructive",
};

const typeLabels: Record<string, string> = {
  corrective: "Correctivo",
  preventive: "Preventivo",
  installation: "Instalacion",
  other: "Otro",
};

export function getColumns(
  actions: ColumnActions,
  capabilities: ColumnCapabilities,
): ColumnDef<Ticket>[] {
  const columns: ColumnDef<Ticket>[] = [
    {
      accessorKey: "ticket_number",
      header: ({ column }) => <DataTableColumnHeader column={column} title="# Ticket" />,
      cell: ({ row }) => (
        <div>
          <div className="font-mono text-sm font-medium">{row.original.ticket_number}</div>
          <div className="max-w-[180px] truncate text-xs text-muted-foreground">
            {row.original.title}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant="outline">{typeLabels[row.original.type] ?? row.original.type}</Badge>
      ),
    },
    {
      accessorKey: "priority",
      header: "Prioridad",
      cell: ({ row }) => {
        const priority = row.original.priority;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              priorityColors[priority] ?? ""
            }`}
          >
            {priority === "urgent"
              ? "Urgente"
              : priority === "high"
                ? "Alta"
                : priority === "medium"
                  ? "Media"
                  : "Baja"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status] ?? "outline"}>
          {statusLabels[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "client_name",
      header: "Cliente",
      cell: ({ row }) => row.original.client_name ?? "-",
    },
    {
      accessorKey: "site_name",
      header: "Sitio",
      cell: ({ row }) => row.original.site_name ?? "-",
    },
    {
      accessorKey: "assigned_to_name",
      header: "Asignado",
      cell: ({ row }) => row.original.assigned_to_name ?? "Sin asignar",
    },
    {
      accessorKey: "coverage_status",
      header: "Cobertura",
      cell: ({ row }) => <CoverageStatusBadge status={row.original.coverage_status} />,
    },
    {
      accessorKey: "sla_status",
      header: "SLA",
      cell: ({ row }) => <SlaStatusBadge status={row.original.sla_status} />,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Creado" />,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("es-MX"),
    },
  ];

  if (
    capabilities.canEdit ||
    capabilities.canAssign ||
    capabilities.canChangeStatus ||
    capabilities.canDelete
  ) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const ticket = row.original;

        return (
          <ActionMenu trigger={<MoreHorizontal className="h-4 w-4" />}>
            <ActionMenuItem onClick={() => actions.onView(ticket)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </ActionMenuItem>
            {capabilities.canEdit && (
              <ActionMenuItem onClick={() => actions.onEdit(ticket)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </ActionMenuItem>
            )}
            {capabilities.canAssign && (
              <ActionMenuItem onClick={() => actions.onAssign(ticket)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Asignar
              </ActionMenuItem>
            )}
            {capabilities.canChangeStatus && (
              <ActionMenuItem onClick={() => actions.onChangeStatus(ticket)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Cambiar estado
              </ActionMenuItem>
            )}
            {capabilities.canDelete && (
              <ActionMenuItem
                onClick={() => actions.onDelete(ticket)}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </ActionMenuItem>
            )}
          </ActionMenu>
        );
      },
    });
  }

  return columns;
}
