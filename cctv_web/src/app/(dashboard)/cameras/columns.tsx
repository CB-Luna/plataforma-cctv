"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { Camera } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import { safeString, safeStatus } from "@/lib/safe-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Eye } from "lucide-react";

interface ColumnActions {
  onDelete: (camera: Camera) => void;
  onView: (camera: Camera) => void;
  siteNames: Map<string, string>;
  nvrNames: Map<string, string>;
}

export function getColumns(actions: ColumnActions): ColumnDef<Camera>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.code && (
            <div className="text-xs text-muted-foreground">{row.original.code}</div>
          )}
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
        if (!type) return "—";
        const labels: Record<string, string> = {
          dome: "Domo",
          bullet: "Bullet",
          ptz: "PTZ",
          fisheye: "Fisheye",
          box: "Box",
        };
        return (
          <Badge variant="outline">
            {labels[type] ?? type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "camera_model_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Modelo" />,
      cell: ({ row }) => row.original.camera_model_name ?? "—",
    },
    {
      accessorKey: "ip_address",
      header: "IP",
      cell: ({ row }) => (
        <code className="text-xs">{row.original.ip_address ?? "—"}</code>
      ),
    },
    {
      accessorKey: "resolution",
      header: "Resolución",
      cell: ({ row }) => {
        const mp = row.original.megapixels;
        const res = row.original.resolution;
        return mp ? `${mp} MP` : res ?? "—";
      },
    },
    {
      accessorKey: "area",
      header: "Área / Zona",
      cell: ({ row }) => {
        const area = row.original.area;
        const zone = row.original.zone;
        if (!area && !zone) return "—";
        return (
          <div className="text-sm">
            {area && <div>{area}</div>}
            {zone && <div className="text-xs text-muted-foreground">{zone}</div>}
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
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions.onView(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onDelete(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
