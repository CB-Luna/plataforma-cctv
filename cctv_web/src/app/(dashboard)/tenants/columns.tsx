"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";
import type { Tenant } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TenantColumnActions {
  onEdit: (tenant: Tenant) => void;
  onToggleActive: (tenant: Tenant) => void;
}

interface TenantColumnCapabilities {
  canEdit: boolean;
  canToggleActive: boolean;
}

export function getTenantColumns(actions: TenantColumnActions, capabilities: TenantColumnCapabilities): ColumnDef<Tenant>[] {
  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    },
    {
      accessorKey: "slug",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.getValue("slug")}</code>
      ),
    },
    {
      accessorKey: "subscription_plan",
      header: "Plan",
      cell: ({ row }) => {
        const plan = row.getValue<string>("subscription_plan") ?? "basic";
        return (
          <Badge variant={plan === "enterprise" ? "default" : "secondary"}>
            {plan}
          </Badge>
        );
      },
    },
    {
      accessorKey: "max_users",
      header: "MÃ¡x. Usuarios",
      cell: ({ row }) => row.getValue<number>("max_users") ?? "â€”",
    },
    {
      accessorKey: "max_clients",
      header: "MÃ¡x. Clientes",
      cell: ({ row }) => row.getValue<number>("max_clients") ?? "â€”",
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.getValue("is_active") ? "default" : "secondary"}>
          {row.getValue("is_active") ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "colors",
      header: "Colores",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex gap-1">
            {[tenant.primary_color, tenant.secondary_color, tenant.tertiary_color]
              .filter(Boolean)
              .map((color, index) => (
                <div
                  key={index}
                  className="h-5 w-5 rounded-full border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
          </div>
        );
      },
    },
  ];

  if (capabilities.canEdit || capabilities.canToggleActive) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const tenant = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {capabilities.canEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit(tenant)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
              )}
              {capabilities.canToggleActive && (
                <DropdownMenuItem onClick={() => actions.onToggleActive(tenant)}>
                  {tenant.is_active ? (
                    <><PowerOff className="mr-2 h-4 w-4" /> Desactivar</>
                  ) : (
                    <><Power className="mr-2 h-4 w-4" /> Activar</>
                  )}
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
