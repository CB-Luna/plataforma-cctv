"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2, Star, Power } from "lucide-react";
import type { ModelConfig } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnActions {
  onEdit: (model: ModelConfig) => void;
  onDelete: (model: ModelConfig) => void;
  onSetDefault: (model: ModelConfig) => void;
  onToggleActive: (model: ModelConfig) => void;
}

interface ColumnCapabilities {
  canEdit: boolean;
  canDelete: boolean;
  canSetDefault: boolean;
  canToggleActive: boolean;
}

export function getColumns(actions: ColumnActions, capabilities: ColumnCapabilities): ColumnDef<ModelConfig>[] {
  const columns: ColumnDef<ModelConfig>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          {row.original.is_default && (
            <Badge variant="default" className="ml-2">Predeterminado</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "provider",
      header: "Proveedor",
      cell: ({ row }) => <Badge variant="outline">{row.original.provider}</Badge>,
    },
    {
      accessorKey: "model_name",
      header: "Modelo",
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge variant="default">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
    {
      accessorKey: "monthly_budget_usd",
      header: "Presupuesto Mensual",
      cell: ({ row }) =>
        row.original.monthly_budget_usd != null
          ? `$${row.original.monthly_budget_usd.toFixed(2)}`
          : "â€”",
    },
    {
      accessorKey: "has_api_key",
      header: "API Key",
      cell: ({ row }) =>
        row.original.has_api_key ? (
          <Badge variant="secondary">Configurada</Badge>
        ) : (
          <Badge variant="destructive">Sin configurar</Badge>
        ),
    },
  ];

  if (capabilities.canEdit || capabilities.canDelete || capabilities.canSetDefault || capabilities.canToggleActive) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const model = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {capabilities.canEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit(model)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
              )}
              {capabilities.canSetDefault && !model.is_default && (
                <DropdownMenuItem onClick={() => actions.onSetDefault(model)}>
                  <Star className="mr-2 h-4 w-4" /> Establecer predeterminado
                </DropdownMenuItem>
              )}
              {capabilities.canToggleActive && (
                <DropdownMenuItem onClick={() => actions.onToggleActive(model)}>
                  <Power className="mr-2 h-4 w-4" /> {model.is_active ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
              )}
              {capabilities.canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => actions.onDelete(model)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
