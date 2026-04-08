"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import type { RoleAdmin } from "@/types/api";
import { ScopeCallout } from "@/components/settings/scope-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissions } from "@/hooks/use-permissions";
import { createRole, listRoles, updateRole } from "@/lib/api/roles";
import { parseTenantProductProfile } from "@/lib/product/service-catalog";
import { useTenantStore } from "@/stores/tenant-store";
import { getColumns } from "../../roles/columns";
import { PermissionsDialog, RoleDialog, type RoleFormValues } from "../../roles/role-dialogs";

export function RolesTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const [editRole, setEditRole] = useState<RoleAdmin | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState<RoleAdmin | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

  const canCreateRole = canAny("roles.create", "roles:create:all");
  const canEditRole = canAny("roles.update", "roles:update:own", "roles:update:all");
  const canManagePermissions = canAny("permissions:read:all", "roles.update", "roles:update:own", "roles:update:all");
  const canDeleteRole = canAny("roles.delete", "roles:delete:all");
  const tenantProfile = parseTenantProductProfile(currentCompany);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
  });

  const createMutation = useMutation({
    mutationFn: (data: RoleFormValues) => createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol creado");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear rol"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleFormValues }) => updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol actualizado");
      setDialogOpen(false);
      setEditRole(null);
    },
    onError: () => toast.error("Error al actualizar rol"),
  });

  function handleSubmit(values: RoleFormValues) {
    if (editRole) {
      updateMutation.mutate({ id: editRole.id, data: values });
      return;
    }

    createMutation.mutate(values);
  }

  const columns = getColumns(
    {
      onEdit: (role) => {
        setEditRole(role);
        setDialogOpen(true);
      },
      onPermissions: (role) => {
        setPermissionsRole(role);
        setPermissionsDialogOpen(true);
      },
      onDelete: (role) => {
        if (confirm(`Eliminar rol "${role.name}"?`)) {
          toast.info("Eliminar rol aun no esta soportado por el contrato de backend");
        }
      },
    },
    {
      canEdit: canEditRole,
      canManagePermissions,
      canDelete: canDeleteRole,
    },
  );

  return (
    <div className="space-y-6">
      <ScopeCallout
        badge="Tenant activo"
        accent="tenant"
        title={`Roles internos y permisos de ${currentCompany?.name ?? "la empresa activa"}`}
        description="Esta consola gobierna roles internos del tenant activo. Los system roles o un plano global de plataforma no tienen CRUD separado en la API actual y se mantienen como GAP documentado."
        footer={
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Badge variant="outline">{roles.length} roles visibles</Badge>
            <Badge variant="secondary">Eliminacion de roles: no soportada por API</Badge>
            {currentCompany ? <Badge variant="outline">Scope: {currentCompany.slug}</Badge> : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Aislamiento de roles por tenant</CardTitle>
            <CardDescription>
              Esta empresa gobierna sus propios roles. Un rol creado aqui vive dentro de {currentCompany?.name ?? "este tenant"} y no define permisos globales de plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Roles que controlan este portal</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tenantProfile.enabledServices.map((serviceCode) => (
                  <Badge key={`service-scope-${serviceCode}`} variant="secondary">
                    {serviceCode.replace("_", " ")}
                  </Badge>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                Los permisos de estos roles deben gobernar solo los modulos habilitados para esta empresa.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Lectura correcta del producto</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>`Administrador Calimax` es un rol del tenant, no un rol del sistema completo.</span>
                </li>
                <li className="flex gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>La empresa solo debe gobernar lo que ella ve en su menu y en sus modulos habilitados.</span>
                </li>
                <li className="flex gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>El CRUD global de system roles sigue siendo una capacidad aparte del backoffice.</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Resumen visible del tenant</CardTitle>
            <CardDescription>
              Esta vista ayuda a que el admin entienda que esta editando permisos de empresa, no de plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Empresa activa</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{currentCompany?.name ?? "Sin tenant activo"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">Roles cargados: {roles.length}</Badge>
                <Badge variant="secondary">Tenant only</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Dominio visible actual
              </p>
              <div className="flex flex-wrap gap-2">
                {tenantProfile.enabledServices.map((serviceCode) => (
                  <Badge key={`role-domain-${serviceCode}`} variant="outline">
                    {serviceCode.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end">
        {canCreateRole ? (
          <Button
            onClick={() => {
              setEditRole(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo rol
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={roles}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Shield}
            title="No hay roles definidos"
            description="Crea roles internos para gestionar permisos de acceso dentro del tenant."
            action={
              canCreateRole
                ? {
                    label: "Nuevo rol",
                    onClick: () => {
                      setEditRole(null);
                      setDialogOpen(true);
                    },
                  }
                : undefined
            }
          />
        }
      />

      <RoleDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditRole(null);
        }}
        onSubmit={handleSubmit}
        role={editRole}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <PermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={(open) => {
          setPermissionsDialogOpen(open);
          if (!open) setPermissionsRole(null);
        }}
        role={permissionsRole}
      />
    </div>
  );
}
