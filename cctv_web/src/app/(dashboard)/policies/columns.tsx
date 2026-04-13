"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Policy } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";

interface ColumnActions {
  onView: (policy: Policy) => void;
  onEdit: (policy: Policy) => void;
  onDelete: (policy: Policy) => void;
}

const statusLabels: Record<string, string> = {
  active: "Activa",
  expired: "Expirada",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  expired: "secondary",
  suspended: "outline",
  cancelled: "destructive",
};

export function getColumns(actions: ColumnActions): ColumnDef<Policy>[] {
  return [
    {
      accessorKey: "policy_number",
      header: ({ column }) => <DataTableColumnHeader column={column} title="# Poliza" />,
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.policy_number}</span>,
    },
    {
      accessorKey: "client_name",
      header: "Cliente",
      cell: ({ row }) => row.original.client_name ?? "-",
    },
    {
      accessorKey: "site_name",
      header: "Sitio",
      cell: ({ row }) => row.original.site_name ?? "Cobertura cliente",
    },
    {
      id: "scope",
      header: "Alcance",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.site_id ? "Por sitio" : "Nivel cliente"}</Badge>
      ),
    },
    {
      accessorKey: "vendor",
      header: "Proveedor",
      cell: ({ row }) => row.original.vendor ?? "-",
    },
    {
      accessorKey: "contract_type",
      header: "Tipo",
      cell: ({ row }) => row.original.contract_type ?? "-",
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
      accessorKey: "monthly_payment",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mensual" />,
      cell: ({ row }) => `$${row.original.monthly_payment.toLocaleString("es-MX")}`,
    },
    {
      accessorKey: "start_date",
      header: "Vigencia",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.start_date}</div>
          <div className="text-xs text-muted-foreground">hasta {row.original.end_date}</div>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const policy = row.original;
        return (
          <ActionMenu trigger={<MoreHorizontal className="h-4 w-4" />}>
            <ActionMenuItem onClick={() => actions.onView(policy)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </ActionMenuItem>
            <ActionMenuItem onClick={() => actions.onEdit(policy)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </ActionMenuItem>
            <ActionMenuItem onClick={() => actions.onDelete(policy)} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </ActionMenuItem>
          </ActionMenu>
        );
      },
    },
  ];
}
