"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Shield, Trash2 } from "lucide-react";
import type { RoleAdmin } from "@/types/api";

interface ColumnActions {
  onEdit: (role: RoleAdmin) => void;
  onPermissions: (role: RoleAdmin) => void;
  onDelete: (role: RoleAdmin) => void;
}

export function getColumns(actions: ColumnActions): ColumnDef<RoleAdmin>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.description || "—"}</span>
      ),
    },
    {
      accessorKey: "is_system",
      header: "Tipo",
      cell: ({ row }) =>
        row.original.is_system ? (
          <Badge variant="secondary">Sistema</Badge>
        ) : (
          <Badge variant="outline">Personalizado</Badge>
        ),
    },
    {
      accessorKey: "created_at",
      header: "Creado",
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString("es"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEdit(role)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onPermissions(role)}>
                <Shield className="mr-2 h-4 w-4" /> Permisos
              </DropdownMenuItem>
              {!role.is_system && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => actions.onDelete(role)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
