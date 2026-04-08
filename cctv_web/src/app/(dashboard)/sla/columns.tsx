"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { SlaPolicy } from "@/types/api";
import { describeSlaScope, summarizeBusinessHours } from "@/lib/contracts/contractual";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnActions {
  onEdit: (sla: SlaPolicy) => void;
  onDelete: (sla: SlaPolicy) => void;
}

export function getColumns(actions: ColumnActions): ColumnDef<SlaPolicy>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          {row.original.is_default && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Default
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "scope",
      header: "Coincidencia",
      cell: ({ row }) => describeSlaScope(row.original),
    },
    {
      accessorKey: "response_time_hours",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Respuesta (h)" />,
      cell: ({ row }) => `${row.original.response_time_hours}h`,
    },
    {
      accessorKey: "resolution_time_hours",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Resolucion (h)" />,
      cell: ({ row }) => `${row.original.resolution_time_hours}h`,
    },
    {
      id: "schedule",
      header: "Horario",
      cell: ({ row }) => summarizeBusinessHours(row.original.business_hours),
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sla = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEdit(sla)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDelete(sla)} className="text-destructive">
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
