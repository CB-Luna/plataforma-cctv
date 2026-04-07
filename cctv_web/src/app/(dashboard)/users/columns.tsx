"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { UserAdmin } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Key, ShieldCheck, UserX } from "lucide-react";

interface ColumnActions {
  onEdit: (user: UserAdmin) => void;
  onChangePassword: (user: UserAdmin) => void;
  onManageRoles: (user: UserAdmin) => void;
  onDeactivate: (user: UserAdmin) => void;
}

export function getColumns(actions: ColumnActions): ColumnDef<UserAdmin>[] {
  return [
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.avatar_url ? (
            <img src={row.original.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {row.original.first_name?.[0]}{row.original.last_name?.[0]}
            </div>
          )}
          <div>
            <div className="font-medium">{row.original.first_name} {row.original.last_name}</div>
            <div className="text-xs text-muted-foreground">{row.original.email}</div>
          </div>
        </div>
      ),
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
          {row.original.roles?.map((r) => (
            <Badge key={r.id} variant="outline" className="text-xs">{r.name}</Badge>
          )) ?? "—"}
        </div>
      ),
    },
    {
      accessorKey: "last_login_at",
      header: "Último acceso",
      cell: ({ row }) =>
        row.original.last_login_at
          ? new Date(row.original.last_login_at).toLocaleDateString("es-MX")
          : "Nunca",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEdit(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onChangePassword(user)}>
                <Key className="mr-2 h-4 w-4" />
                Cambiar contraseña
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onManageRoles(user)}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Gestionar roles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.onDeactivate(user)} className="text-destructive">
                <UserX className="mr-2 h-4 w-4" />
                Desactivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
