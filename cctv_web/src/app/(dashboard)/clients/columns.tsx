"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Client } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

export const clientColumns: ColumnDef<Client>[] = [
  {
    accessorKey: "company_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Empresa" />,
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("company_name")}</span>
    ),
  },
  {
    accessorKey: "legal_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Razón Social" />,
    cell: ({ row }) => row.getValue<string>("legal_name") || "—",
  },
  {
    accessorKey: "rfc",
    header: "RFC",
    cell: ({ row }) => {
      const rfc = row.getValue<string>("rfc");
      return rfc ? (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{rfc}</code>
      ) : (
        "—"
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue<string>("email") || "—",
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => row.getValue<string>("phone") || "—",
  },
  {
    accessorKey: "city",
    header: "Ciudad",
    cell: ({ row }) => {
      const city = row.getValue<string>("city");
      const state = row.original.state;
      if (!city && !state) return "—";
      return [city, state].filter(Boolean).join(", ");
    },
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
];
