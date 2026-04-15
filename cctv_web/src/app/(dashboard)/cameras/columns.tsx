"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import type { Camera } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import { safeString, safeStatus } from "@/lib/safe-field";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";

interface TenantPresentation {
  name: string;
  logo_url?: string | null;
  primary_color?: string;
}

interface ColumnActions {
  onDelete: (camera: Camera) => void;
  onView: (camera: Camera) => void;
  siteNames: Map<string, string>;
  nvrNames: Map<string, string>;
  tenantMeta?: Map<string, TenantPresentation>;
  showTenantColumn?: boolean;
}

function buildTenantColumn(tenantMeta?: Map<string, TenantPresentation>): ColumnDef<Camera> {
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

export function getColumns(actions: ColumnActions): ColumnDef<Camera>[] {
  const columns: ColumnDef<Camera>[] = [];

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
      id: "nvr",
      header: "NVR",
      cell: ({ row }) => {
        const nvrId = row.original.nvr_server_id ?? "";
        if (!nvrId) return "Sin NVR";
        return actions.nvrNames.get(nvrId) ?? "NVR asignado";
      },
    },
    {
      accessorKey: "camera_type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = safeString(row.original.camera_type, "");
        if (!type) return "-";

        const labels: Record<string, string> = {
          dome: "Domo",
          bullet: "Bullet",
          ptz: "PTZ",
          fisheye: "Fisheye",
          box: "Box",
        };

        return <Badge variant="outline">{labels[type] ?? type}</Badge>;
      },
    },
    {
      accessorKey: "camera_model_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Modelo" />,
      cell: ({ row }) => row.original.camera_model_name ?? "-",
    },
    {
      accessorKey: "ip_address",
      header: "IP",
      cell: ({ row }) => <code className="text-xs">{row.original.ip_address ?? "-"}</code>,
    },
    {
      accessorKey: "resolution",
      header: "Resolucion",
      cell: ({ row }) => {
        const mp = row.original.megapixels;
        const resolution = row.original.resolution;
        return mp ? `${mp} MP` : resolution ?? "-";
      },
    },
    {
      accessorKey: "area",
      header: "Area / Zona",
      cell: ({ row }) => {
        const area = row.original.area;
        const zone = row.original.zone;
        if (!area && !zone) return "-";

        return (
          <div className="text-sm">
            {area ? <div>{area}</div> : null}
            {zone ? <div className="text-xs text-muted-foreground">{zone}</div> : null}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = safeStatus(row.original.status, row.original.is_active);
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "Activo" : "Inactivo"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ActionMenu trigger={<MoreHorizontal className="h-4 w-4" />}>
          <ActionMenuItem onClick={() => actions.onView(row.original)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalle
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
