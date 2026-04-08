"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import type { RoleAdmin } from "@/types/api";
import { ScopeCallout } from "@/components/settings/scope-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissions } from "@/hooks/use-permissions";
import { createRole, listRoles, updateRole } from "@/lib/api/roles";
import { getColumns } from "../../roles/columns";
import { PermissionsDialog, RoleDialog, type RoleFormValues } from "../../roles/role-dialogs";

export function RolesTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const [editRole, setEditRole] = useState<RoleAdmin | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState<RoleAdmin | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

  const canCreateRole = canAny("roles.create", "roles:create:all");
  const canEditRole = canAny("roles.update", "roles:update:own", "roles:update:all");
  const canManagePermissions = canAny("permissions:read:all", "roles.update", "roles:update:own", "roles:update:all");
  const canDeleteRole = canAny("roles.delete", "roles:delete:all");

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
        title="Roles internos y permisos del tenant"
        description="Esta consola gobierna roles internos del tenant activo. Los system roles o un plano global de plataforma no tienen CRUD separado en la API actual y se mantienen como GAP documentado."
        footer={
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Badge variant="outline">{roles.length} roles visibles</Badge>
            <Badge variant="secondary">Eliminacion de roles: no soportada por API</Badge>
          </div>
        }
      />

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
