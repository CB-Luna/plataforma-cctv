"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { ImportBatch } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";
import { MoreHorizontal, Play, XCircle, Trash2, Eye } from "lucide-react";

interface ColumnActions {
  onView: (batch: ImportBatch) => void;
  onProcess: (batch: ImportBatch) => void;
  onCancel: (batch: ImportBatch) => void;
  onDelete: (batch: ImportBatch) => void;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  completed: "Completado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  processing: "secondary",
  completed: "default",
  failed: "destructive",
  cancelled: "secondary",
};

export function getColumns(actions: ColumnActions): ColumnDef<ImportBatch>[] {
  return [
    {
      accessorKey: "batch_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre del lote" />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.batch_name}</div>
          {row.original.source_filename && (
            <div className="text-xs text-muted-foreground">{row.original.source_filename}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "target_table",
      header: "Destino",
      cell: ({ row }) => {
        const table = row.original.target_table;
        return (
          <Badge variant="outline">
            {table === "cameras" ? "Cámaras" : table === "nvr_servers" ? "NVR" : table}
          </Badge>
        );
      },
    },
    {
      accessorKey: "source_type",
      header: "Fuente",
      cell: ({ row }) => row.original.source_type.toUpperCase(),
    },
    {
      accessorKey: "total_rows",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Filas" />,
      cell: ({ row }) => row.original.total_rows ?? "—",
    },
    {
      id: "progress",
      header: "Progreso",
      cell: ({ row }) => {
        const { processed_rows, total_rows, success_rows, error_rows } = row.original;
        if (total_rows == null || processed_rows == null) return "—";
        return (
          <div className="text-sm">
            <span className="text-green-600">{success_rows ?? 0}✓</span>
            {" / "}
            <span className="text-destructive">{error_rows ?? 0}✗</span>
            {" / "}
            {total_rows}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        // Defensa contra el objeto NullInventoryImportStatus del backend
        const rawStatus = row.original.status;
        const status: string =
          typeof rawStatus === "string"
            ? rawStatus
            : typeof rawStatus === "object" && rawStatus !== null
              ? ((rawStatus as { inventory_import_status?: string }).inventory_import_status ?? "pending")
              : "pending";
        return (
          <Badge variant={statusVariants[status] ?? "outline"}>
            {statusLabels[status] ?? status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Creado" />,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("es-MX"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const batch = row.original;
        return (
          <ActionMenu trigger={<MoreHorizontal className="h-4 w-4" />}>
            <ActionMenuItem onClick={() => actions.onView(batch)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </ActionMenuItem>
            {batch.status === "pending" && (
              <ActionMenuItem onClick={() => actions.onProcess(batch)}>
                <Play className="mr-2 h-4 w-4" />
                Procesar
              </ActionMenuItem>
            )}
            {(batch.status === "pending" || batch.status === "processing") && (
              <ActionMenuItem onClick={() => actions.onCancel(batch)}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </ActionMenuItem>
            )}
            <ActionMenuItem
              onClick={() => actions.onDelete(batch)}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </ActionMenuItem>
          </ActionMenu>
        );
      },
    },
  ];
}
