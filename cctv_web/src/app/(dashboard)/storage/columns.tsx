"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { StorageConfiguration } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnActions {
  onEdit: (cfg: StorageConfiguration) => void;
  onDelete: (cfg: StorageConfiguration) => void;
}

interface ColumnCapabilities {
  canEdit: boolean;
  canDelete: boolean;
}

export function getColumns(actions: ColumnActions, capabilities: ColumnCapabilities): ColumnDef<StorageConfiguration>[] {
  const columns: ColumnDef<StorageConfiguration>[] = [
    {
      accessorKey: "config_name",
      header: "Nombre",
      cell: ({ row }) => <span className="font-medium">{row.original.config_name}</span>,
    },
    {
      accessorKey: "provider_display_name",
      header: "Proveedor",
    },
    {
      accessorKey: "bucket_name",
      header: "Bucket / Base",
      cell: ({ row }) => row.original.bucket_name || row.original.database_name || "â€”",
    },
    {
      accessorKey: "is_default",
      header: "Predeterminado",
      cell: ({ row }) =>
        row.original.is_default ? <Badge>SÃ­</Badge> : <span className="text-muted-foreground">No</span>,
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge variant="default">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
    {
      accessorKey: "created_at",
      header: "Creado",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("es"),
    },
  ];

  if (capabilities.canEdit || capabilities.canDelete) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const config = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {capabilities.canEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit(config)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
              )}
              {capabilities.canDelete && (
                <DropdownMenuItem className="text-destructive" onClick={() => actions.onDelete(config)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
