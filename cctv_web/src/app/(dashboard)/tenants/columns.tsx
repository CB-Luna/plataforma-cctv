"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, MoreHorizontal, Pencil, Power, PowerOff, Upload } from "lucide-react";
import type { Tenant } from "@/types/api";
import { DataTableColumnHeader } from "@/components/data-table";
import { ServiceBadges } from "@/components/product/service-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTenantReadinessMeta, parseTenantProductProfile } from "@/lib/product/service-catalog";

interface TenantColumnActions {
  onEdit: (tenant: Tenant) => void;
  onToggleActive: (tenant: Tenant) => void;
  onUploadLogo?: (tenant: Tenant) => void;
}

interface TenantColumnCapabilities {
  canEdit: boolean;
  canToggleActive: boolean;
  canUploadLogo?: boolean;
}

export function getTenantColumns(
  actions: TenantColumnActions,
  capabilities: TenantColumnCapabilities,
): ColumnDef<Tenant>[] {
  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Empresa" />,
      cell: ({ row }) => {
        const tenant = row.original;

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-xl">
              {tenant.logo_url ? <AvatarImage src={tenant.logo_url} alt={tenant.name} className="rounded-xl" /> : null}
              <AvatarFallback className="rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Building2 className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{tenant.name}</p>
              <p className="truncate text-xs text-muted-foreground">{tenant.domain || "Sin dominio corporativo"}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "slug",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
      cell: ({ row }) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.getValue("slug")}</code>,
    },
    {
      accessorKey: "subscription_plan",
      header: "Plan",
      cell: ({ row }) => {
        const plan = row.getValue<string>("subscription_plan") ?? "basic";
        return <Badge variant={plan === "enterprise" ? "default" : "secondary"}>{plan}</Badge>;
      },
    },
    {
      id: "services",
      header: "Servicios",
      cell: ({ row }) => {
        const profile = parseTenantProductProfile(row.original);

        return (
          <div className="space-y-2">
            <ServiceBadges services={profile.enabledServices} compact />
            <p className="text-xs text-muted-foreground">
              {profile.source === "explicit" ? "Asignacion explicita" : "Visibilidad legacy por defecto"}
            </p>
          </div>
        );
      },
    },
    {
      id: "onboarding",
      header: "Readiness",
      cell: ({ row }) => {
        const profile = parseTenantProductProfile(row.original);
        const statusMeta = getTenantReadinessMeta({
          companyId: row.original.id,
          productProfile: profile,
        });

        return (
          <div className="space-y-1">
            <Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>
            {profile.onboarding.adminEmail ? (
              <p className="max-w-[180px] truncate text-xs text-muted-foreground">{profile.onboarding.adminEmail}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Sin admin bootstrap</p>
            )}
            <p className="text-[11px] text-muted-foreground">{statusMeta.evidenceLabel}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "max_users",
      header: "Max. usuarios",
      cell: ({ row }) => row.getValue<number>("max_users") ?? "-",
    },
    {
      accessorKey: "max_clients",
      header: "Max. clientes",
      cell: ({ row }) => row.getValue<number>("max_clients") ?? "-",
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
      header: "Paleta",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex gap-1">
            {[tenant.primary_color, tenant.secondary_color, tenant.tertiary_color]
              .filter(Boolean)
              .map((color, index) => (
                <div
                  key={`${tenant.id}-${index}`}
                  className="h-5 w-5 rounded-full border"
                  style={{ backgroundColor: color }}
                  title={color || undefined}
                />
              ))}
          </div>
        );
      },
    },
  ];

  if (capabilities.canEdit || capabilities.canToggleActive || capabilities.canUploadLogo) {
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
              {capabilities.canEdit ? (
                <DropdownMenuItem onClick={() => actions.onEdit(tenant)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              ) : null}
              {capabilities.canUploadLogo && actions.onUploadLogo ? (
                <DropdownMenuItem onClick={() => actions.onUploadLogo?.(tenant)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Logo / branding
                </DropdownMenuItem>
              ) : null}
              {capabilities.canToggleActive ? (
                <DropdownMenuItem onClick={() => actions.onToggleActive(tenant)}>
                  {tenant.is_active ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Activar
                    </>
                  )}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
