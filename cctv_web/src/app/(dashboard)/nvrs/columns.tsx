"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { NvrServer } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";
import { safeStatus } from "@/lib/safe-field";

interface TenantPresentation {
  name: string;
  logo_url?: string | null;
  primary_color?: string;
}

interface ColumnActions {
  onDelete: (nvr: NvrServer) => void;
  onOpen: (nvr: NvrServer) => void;
  siteNames: Map<string, string>;
  tenantMeta?: Map<string, TenantPresentation>;
  showTenantColumn?: boolean;
}

function buildTenantColumn(tenantMeta?: Map<string, TenantPresentation>): ColumnDef<NvrServer> {
  return {
    id: "tenant",
    header: "Empresa",
    cell: ({ row }) => {
      const tenant = row.original.tenant_id ? tenantMeta?.get(row.original.tenant_id) : undefined;

      return (
        <div className="flex items-center gap-2">
          {tenant?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-7 w-7 rounded-md border object-contain"
            />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: tenant?.primary_color ?? "#64748b" }}
            >
              <Building2 className="h-3.5 w-3.5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate font-medium">{tenant?.name ?? "Sin empresa"}</div>
          </div>
        </div>
      );
    },
  };
}

export function getColumns(actions: ColumnActions): ColumnDef<NvrServer>[] {
  const columns: ColumnDef<NvrServer>[] = [];

  if (actions.showTenantColumn) {
    columns.push(buildTenantColumn(actions.tenantMeta));
  }

  columns.push(
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.code ? (
            <div className="text-xs text-muted-foreground">{row.original.code}</div>
          ) : null}
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
      cell: ({ row }) => row.original.model ?? "-",
    },
    {
      accessorKey: "ip_address",
      header: "IP",
      cell: ({ row }) => <code className="text-xs">{row.original.ip_address ?? "-"}</code>,
    },
    {
      accessorKey: "camera_channels",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Canales" />,
      cell: ({ row }) => row.original.camera_channels ?? "-",
    },
    {
      accessorKey: "total_storage_tb",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Storage (TB)" />,
      cell: ({ row }) =>
        row.original.total_storage_tb != null ? `${row.original.total_storage_tb} TB` : "-",
    },
    {
      accessorKey: "recording_days",
      header: "Dias Grab.",
      cell: ({ row }) => row.original.recording_days ?? "-",
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
          <ActionMenuItem onClick={() => actions.onDelete(row.original)} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </ActionMenuItem>
        </ActionMenu>
      ),
    },
  );

  return columns;
}
