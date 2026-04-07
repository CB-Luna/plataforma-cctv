"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { NvrServer } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

interface ColumnActions {
  onEdit: (nvr: NvrServer) => void;
  onDelete: (nvr: NvrServer) => void;
  onView: (nvr: NvrServer) => void;
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
        const status = row.original.status ?? (row.original.is_active ? "active" : "inactive");
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
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions.onView(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onDelete(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
