"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users } from "lucide-react";
import type { UserAdmin } from "@/types/api";
import { ScopeCallout } from "@/components/settings/scope-callout";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissions } from "@/hooks/use-permissions";
import { listRoles } from "@/lib/api/roles";
import { assignRole, changePassword, deactivateUser, listUsers, removeRole, updateUser } from "@/lib/api/users";
import { getColumns } from "../../users/columns";
import { PasswordDialog, RolesDialog, UserDialog, type UserFormValues } from "../../users/user-dialogs";

export function UsersTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const [editUser, setEditUser] = useState<UserAdmin | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pwUser, setPwUser] = useState<UserAdmin | null>(null);
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [rolesUser, setRolesUser] = useState<UserAdmin | null>(null);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);

  const canEditUser = canAny("users.update", "users:update:own", "users:update:all");
  const canChangePassword = canEditUser;
  const canManageRoles = canAny("roles.assign", "roles.update", "roles:update:own", "roles:update:all");
  const canDeactivateUser = canAny("users.delete", "users:delete:own", "users:delete:all");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserFormValues }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario actualizado");
      setEditDialogOpen(false);
      setEditUser(null);
    },
    onError: () => toast.error("Error al actualizar usuario"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => changePassword(id, { password }),
    onSuccess: () => {
      toast.success("Contrasena cambiada");
      setPwDialogOpen(false);
      setPwUser(null);
    },
    onError: () => toast.error("Error al cambiar contrasena"),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario desactivado");
    },
    onError: () => toast.error("Error al desactivar usuario"),
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => assignRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Rol asignado");
    },
    onError: () => toast.error("Error al asignar rol"),
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => removeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Rol removido");
    },
    onError: () => toast.error("Error al remover rol"),
  });

  const columns = getColumns(
    {
      onEdit: (user) => {
        setEditUser(user);
        setEditDialogOpen(true);
      },
      onChangePassword: (user) => {
        setPwUser(user);
        setPwDialogOpen(true);
      },
      onManageRoles: (user) => {
        setRolesUser(user);
        setRolesDialogOpen(true);
      },
      onDeactivate: (user) => {
        if (confirm(`Desactivar a ${user.first_name} ${user.last_name}?`)) {
          deactivateMutation.mutate(user.id);
        }
      },
    },
    {
      canEdit: canEditUser,
      canChangePassword,
      canManageRoles,
      canDeactivate: canDeactivateUser,
    },
  );

  return (
    <div className="space-y-6">
      <ScopeCallout
        badge="Tenant activo"
        accent="tenant"
        title="Usuarios internos de la empresa operadora"
        description="Esta consola administra personas del tenant activo y sus roles internos. La identidad global de plataforma y el cambio de empresa no se resuelven aqui."
        footer={
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Badge variant="outline">{users.length} usuarios</Badge>
            <Badge variant="outline">{roles.length} roles cargados</Badge>
            <Badge variant="secondary">Roles globales explicitos: GAP separado</Badge>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Users}
            title="No hay usuarios"
            description="Los usuarios de este tenant se gestionan desde el sistema de autenticacion."
          />
        }
      />

      <UserDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditUser(null);
        }}
        onSubmit={(values) => editUser && updateMutation.mutate({ id: editUser.id, data: values })}
        user={editUser}
        isLoading={updateMutation.isPending}
      />

      <PasswordDialog
        open={pwDialogOpen}
        onOpenChange={(open) => {
          setPwDialogOpen(open);
          if (!open) setPwUser(null);
        }}
        onSubmit={(values) => pwUser && changePasswordMutation.mutate({ id: pwUser.id, password: values.password })}
        isLoading={changePasswordMutation.isPending}
      />

      <RolesDialog
        open={rolesDialogOpen}
        onOpenChange={(open) => {
          setRolesDialogOpen(open);
          if (!open) setRolesUser(null);
        }}
        user={rolesUser}
        allRoles={roles}
        onAssign={(roleId) => rolesUser && assignRoleMutation.mutate({ userId: rolesUser.id, roleId })}
        onRemove={(roleId) => rolesUser && removeRoleMutation.mutate({ userId: rolesUser.id, roleId })}
      />
    </div>
  );
}
