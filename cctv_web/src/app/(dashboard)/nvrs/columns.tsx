"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { NvrServer } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { safeStatus } from "@/lib/safe-field";

interface ColumnActions {
  onDelete: (nvr: NvrServer) => void;
  onOpen: (nvr: NvrServer) => void;
  siteNames: Map<string, string>;
}

export function getColumns(actions: ColumnActions): ColumnDef<NvrServer>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.code && (
            <div className="text-xs text-muted-foreground">{row.original.code}</div>
          )}
        </div>
      ),
    },
    {
      id: "site",
      header: "Sitio",
      cell: ({ row }) => {
        const siteId = row.original.site_id ?? "";
        if (!siteId) return "Sin sitio";
        return actions.siteNames.get(siteId) ?? "Sitio asignado";
      },
    },
    {
      accessorKey: "model",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Modelo" />,
      cell: ({ row }) => row.original.model ?? "—",
    },
    {
      accessorKey: "ip_address",
      header: "IP",
      cell: ({ row }) => (
        <code className="text-xs">{row.original.ip_address ?? "—"}</code>
      ),
    },
    {
      accessorKey: "camera_channels",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Canales" />,
      cell: ({ row }) => row.original.camera_channels ?? "—",
    },
    {
      accessorKey: "total_storage_tb",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Storage (TB)" />,
      cell: ({ row }) =>
        row.original.total_storage_tb != null
          ? `${row.original.total_storage_tb} TB`
          : "—",
    },
    {
      accessorKey: "recording_days",
      header: "Días Grab.",
      cell: ({ row }) => row.original.recording_days ?? "—",
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = safeStatus(row.original.status, row.original.is_active);
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "Activo" : status === "maintenance" ? "Mant." : "Inactivo"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ActionMenu trigger={<MoreHorizontal className="h-4 w-4" />}>
          <ActionMenuItem onClick={() => actions.onOpen(row.original)}>
            <Pencil className="mr-2 h-4 w-4" />
            Ver / editar base
          </ActionMenuItem>
          <ActionMenuItem
            onClick={() => actions.onDelete(row.original)}
            variant="destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </ActionMenuItem>
        </ActionMenu>
      ),
    },
  ];
}
