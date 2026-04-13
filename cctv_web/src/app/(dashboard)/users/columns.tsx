"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Key, ShieldCheck, UserX } from "lucide-react";
import type { UserAdmin } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import { ThemeBadge } from "@/components/theme-selector";
import { getUserTheme, getUserAvatar } from "./user-dialogs";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";

interface ColumnActions {
  onEdit: (user: UserAdmin) => void;
  onChangePassword: (user: UserAdmin) => void;
  onManageRoles: (user: UserAdmin) => void;
  onDeactivate: (user: UserAdmin) => void;
}

interface ColumnCapabilities {
  canEdit: boolean;
  canChangePassword: boolean;
  canManageRoles: boolean;
  canDeactivate: boolean;
}

export function getColumns(actions: ColumnActions, capabilities: ColumnCapabilities): ColumnDef<UserAdmin>[] {
  const columns: ColumnDef<UserAdmin>[] = [
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => {
        const localAvatar = getUserAvatar(row.original.id);
        const avatarSrc = row.original.avatar_url || localAvatar;
        return (
          <div className="flex items-center gap-3">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {row.original.first_name?.[0]}{row.original.last_name?.[0]}
              </div>
            )}
            <div>
              <div className="font-medium">{row.original.first_name} {row.original.last_name}</div>
              <div className="text-xs text-muted-foreground">{row.original.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ row }) => row.original.phone ?? "—",
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
      accessorKey: "roles",
      header: "Roles",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles?.map((role) => (
            <Badge key={role.id} variant="outline" className="text-xs">{role.name}</Badge>
          )) ?? "—"}
        </div>
      ),
    },
    {
      id: "theme",
      header: "Tema",
      cell: ({ row }) => <ThemeBadge themeCode={getUserTheme(row.original.id)} />,
    },
    {
      accessorKey: "last_login_at",
      header: "Último acceso",
      cell: ({ row }) =>
        row.original.last_login_at
          ? new Date(row.original.last_login_at).toLocaleDateString("es-MX")
          : "Nunca",
    },
  ];

  if (capabilities.canEdit || capabilities.canChangePassword || capabilities.canManageRoles || capabilities.canDeactivate) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <ActionMenu trigger={<MoreHorizontal className="h-4 w-4" />}>
            {capabilities.canEdit && (
              <ActionMenuItem onClick={() => actions.onEdit(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </ActionMenuItem>
            )}
            {capabilities.canChangePassword && (
              <ActionMenuItem onClick={() => actions.onChangePassword(user)}>
                <Key className="mr-2 h-4 w-4" />
                Cambiar contraseña
              </ActionMenuItem>
            )}
            {capabilities.canManageRoles && (
              <ActionMenuItem onClick={() => actions.onManageRoles(user)}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Gestionar roles
              </ActionMenuItem>
            )}
            {capabilities.canDeactivate && (
              <ActionMenuItem onClick={() => actions.onDeactivate(user)} variant="destructive">
                <UserX className="mr-2 h-4 w-4" />
                Desactivar
              </ActionMenuItem>
            )}
          </ActionMenu>
        );
      },
    });
  }

  return columns;
}
