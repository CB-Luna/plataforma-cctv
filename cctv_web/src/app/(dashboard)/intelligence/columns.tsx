"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Star, Power } from "lucide-react";
import type { ModelConfig } from "@/types/api";

interface ColumnActions {
  onEdit: (m: ModelConfig) => void;
  onDelete: (m: ModelConfig) => void;
  onSetDefault: (m: ModelConfig) => void;
  onToggleActive: (m: ModelConfig) => void;
}

export function getColumns(actions: ColumnActions): ColumnDef<ModelConfig>[] {
  return [
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
          : "—",
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
    {
      id: "actions",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEdit(m)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              {!m.is_default && (
                <DropdownMenuItem onClick={() => actions.onSetDefault(m)}>
                  <Star className="mr-2 h-4 w-4" /> Establecer predeterminado
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => actions.onToggleActive(m)}>
                <Power className="mr-2 h-4 w-4" /> {m.is_active ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => actions.onDelete(m)}>
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
