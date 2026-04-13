"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Shield, Trash2 } from "lucide-react";
import type { RoleAdmin } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";

interface ColumnActions {
  onEdit: (role: RoleAdmin) => void;
  onPermissions: (role: RoleAdmin) => void;
  onDelete: (role: RoleAdmin) => void;
}

interface ColumnCapabilities {
  canEdit: boolean;
  canManagePermissions: boolean;
  canDelete: boolean;
}

export function getColumns(actions: ColumnActions, capabilities: ColumnCapabilities): ColumnDef<RoleAdmin>[] {
  const columns: ColumnDef<RoleAdmin>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
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
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("es"),
    },
  ];

  if (capabilities.canEdit || capabilities.canManagePermissions || capabilities.canDelete) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const role = row.original;

        return (
          <ActionMenu trigger={<MoreHorizontal className="h-4 w-4" />}>
              {capabilities.canEdit && (
                <ActionMenuItem onClick={() => actions.onEdit(role)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </ActionMenuItem>
              )}
              {capabilities.canManagePermissions && (
                <ActionMenuItem onClick={() => actions.onPermissions(role)}>
                  <Shield className="mr-2 h-4 w-4" /> Permisos
                </ActionMenuItem>
              )}
              {capabilities.canDelete && !role.is_system && (
                <ActionMenuItem
                  variant="destructive"
                  onClick={() => actions.onDelete(role)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </ActionMenuItem>
              )}
          </ActionMenu>
        );
      },
    });
  }

  return columns;
}
