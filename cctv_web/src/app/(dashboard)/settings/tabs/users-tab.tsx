"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { listUsers, updateUser, changePassword, deactivateUser, assignRole, removeRole } from "@/lib/api/users";
import { listRoles } from "@/lib/api/roles";
import { getColumns } from "../../users/columns";
import { UserDialog, PasswordDialog, RolesDialog, type UserFormValues } from "../../users/user-dialogs";
import type { UserAdmin } from "@/types/api";

export function UsersTab() {
  const queryClient = useQueryClient();
  const [editUser, setEditUser] = useState<UserAdmin | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pwUser, setPwUser] = useState<UserAdmin | null>(null);
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [rolesUser, setRolesUser] = useState<UserAdmin | null>(null);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserFormValues }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario actualizado");
      setEditDialogOpen(false);
      setEditUser(null);
    },
    onError: () => toast.error("Error al actualizar usuario"),
  });

  const changePwMut = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => changePassword(id, { password }),
    onSuccess: () => {
      toast.success("Contraseña cambiada");
      setPwDialogOpen(false);
      setPwUser(null);
    },
    onError: () => toast.error("Error al cambiar contraseña"),
  });

  const deactivateMut = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario desactivado");
    },
    onError: () => toast.error("Error al desactivar usuario"),
  });

  const assignRoleMut = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => assignRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Rol asignado");
    },
    onError: () => toast.error("Error al asignar rol"),
  });

  const removeRoleMut = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => removeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Rol removido");
    },
    onError: () => toast.error("Error al remover rol"),
  });

  const columns = getColumns({
    onEdit: (u) => { setEditUser(u); setEditDialogOpen(true); },
    onChangePassword: (u) => { setPwUser(u); setPwDialogOpen(true); },
    onManageRoles: (u) => { setRolesUser(u); setRolesDialogOpen(true); },
    onDeactivate: (u) => { if (confirm(`¿Desactivar a ${u.first_name} ${u.last_name}?`)) deactivateMut.mutate(u.id); },
  });

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Users}
            title="No hay usuarios"
            description="Los usuarios se gestionan desde el sistema de autenticación."
          />
        }
      />

      <UserDialog
        open={editDialogOpen}
        onOpenChange={(v) => { setEditDialogOpen(v); if (!v) setEditUser(null); }}
        onSubmit={(vals) => editUser && updateMut.mutate({ id: editUser.id, data: vals })}
        user={editUser}
        isLoading={updateMut.isPending}
      />

      <PasswordDialog
        open={pwDialogOpen}
        onOpenChange={(v) => { setPwDialogOpen(v); if (!v) setPwUser(null); }}
        onSubmit={(vals) => pwUser && changePwMut.mutate({ id: pwUser.id, password: vals.password })}
        isLoading={changePwMut.isPending}
      />

      <RolesDialog
        open={rolesDialogOpen}
        onOpenChange={(v) => { setRolesDialogOpen(v); if (!v) setRolesUser(null); }}
        user={rolesUser}
        allRoles={roles}
        onAssign={(roleId) => rolesUser && assignRoleMut.mutate({ userId: rolesUser.id, roleId })}
        onRemove={(roleId) => rolesUser && removeRoleMut.mutate({ userId: rolesUser.id, roleId })}
      />
    </div>
  );
}
