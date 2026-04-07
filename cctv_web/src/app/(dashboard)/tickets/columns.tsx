"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { Ticket } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, UserPlus, RefreshCw, Trash2 } from "lucide-react";

interface ColumnActions {
  onView: (ticket: Ticket) => void;
  onEdit: (ticket: Ticket) => void;
  onAssign: (ticket: Ticket) => void;
  onChangeStatus: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
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
  installation: "Instalación",
  other: "Otro",
};

export function getColumns(actions: ColumnActions): ColumnDef<Ticket>[] {
  return [
    {
      accessorKey: "ticket_number",
      header: ({ column }) => <DataTableColumnHeader column={column} title="# Ticket" />,
      cell: ({ row }) => (
        <div>
          <div className="font-mono font-medium text-sm">{row.original.ticket_number}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
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
        const p = row.original.priority;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[p] ?? ""}`}>
            {p === "urgent" ? "Urgente" : p === "high" ? "Alta" : p === "medium" ? "Media" : "Baja"}
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
      cell: ({ row }) => row.original.client_name ?? "—",
    },
    {
      accessorKey: "assigned_to_name",
      header: "Asignado",
      cell: ({ row }) => row.original.assigned_to_name ?? "Sin asignar",
    },
    {
      accessorKey: "sla_status",
      header: "SLA",
      cell: ({ row }) => {
        const sla = row.original.sla_status;
        if (!sla) return "—";
        const breached = row.original.breached_sla;
        return (
          <Badge variant={breached ? "destructive" : "default"}>
            {sla}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Creado" />,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("es-MX"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(ticket)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(ticket)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onAssign(ticket)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Asignar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onChangeStatus(ticket)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Cambiar estado
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.onDelete(ticket)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
