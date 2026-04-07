"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Shield } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { listRoles, createRole, updateRole } from "@/lib/api/roles";
import { getColumns } from "../../roles/columns";
import { RoleDialog, PermissionsDialog, type RoleFormValues } from "../../roles/role-dialogs";
import type { RoleAdmin } from "@/types/api";

export function RolesTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const [editRole, setEditRole] = useState<RoleAdmin | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permRole, setPermRole] = useState<RoleAdmin | null>(null);
  const [permDialogOpen, setPermDialogOpen] = useState(false);

  const canCreateRole = canAny("roles.create", "roles:create:all");
  const canEditRole = canAny("roles.update", "roles:update:own", "roles:update:all");
  const canManagePermissions = canAny("permissions:read:all", "roles.update", "roles:update:own", "roles:update:all");
  const canDeleteRole = canAny("roles.delete", "roles:delete:all");

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
  });

  const createMut = useMutation({
    mutationFn: (data: RoleFormValues) => createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol creado");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear rol"),
  });

  const updateMut = useMutation({
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
      updateMut.mutate({ id: editRole.id, data: values });
    } else {
      createMut.mutate(values);
    }
  }

  const columns = getColumns(
    {
      onEdit: (role) => { setEditRole(role); setDialogOpen(true); },
      onPermissions: (role) => { setPermRole(role); setPermDialogOpen(true); },
      onDelete: (role) => { if (confirm(`Â¿Eliminar rol "${role.name}"?`)) toast.info("Eliminar rol no soportado por la API"); },
    },
    {
      canEdit: canEditRole,
      canManagePermissions,
      canDelete: canDeleteRole,
    },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {canCreateRole && (
          <Button onClick={() => { setEditRole(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={roles}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Shield}
            title="No hay roles definidos"
            description="Crea roles para gestionar permisos de acceso."
            action={canCreateRole ? { label: "Nuevo Rol", onClick: () => { setEditRole(null); setDialogOpen(true); } } : undefined}
          />
        }
      />

      <RoleDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditRole(null); }}
        onSubmit={handleSubmit}
        role={editRole}
        isLoading={createMut.isPending || updateMut.isPending}
      />

      <PermissionsDialog
        open={permDialogOpen}
        onOpenChange={(open) => { setPermDialogOpen(open); if (!open) setPermRole(null); }}
        role={permRole}
      />
    </div>
  );
}
