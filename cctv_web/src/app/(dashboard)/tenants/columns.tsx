"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Tenant } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";

interface TenantColumnActions {
  onEdit: (tenant: Tenant) => void;
  onToggleActive: (tenant: Tenant) => void;
}

export function getTenantColumns(actions: TenantColumnActions): ColumnDef<Tenant>[] {
  return [
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
      header: "Máx. Usuarios",
      cell: ({ row }) => row.getValue<number>("max_users") ?? "—",
    },
    {
      accessorKey: "max_clients",
      header: "Máx. Clientes",
      cell: ({ row }) => row.getValue<number>("max_clients") ?? "—",
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
        const t = row.original;
        return (
          <div className="flex gap-1">
            {[t.primary_color, t.secondary_color, t.tertiary_color]
              .filter(Boolean)
              .map((color, i) => (
                <div
                  key={i}
                  className="h-5 w-5 rounded-full border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEdit(tenant)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onToggleActive(tenant)}>
                {tenant.is_active ? (
                  <><PowerOff className="mr-2 h-4 w-4" /> Desactivar</>
                ) : (
                  <><Power className="mr-2 h-4 w-4" /> Activar</>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
