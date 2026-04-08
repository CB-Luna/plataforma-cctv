"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, KeyRound, Users } from "lucide-react";
import type { UserAdmin } from "@/types/api";
import { TenantPortalPreview } from "@/components/settings/tenant-portal-preview";
import { ScopeCallout } from "@/components/settings/scope-callout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissions } from "@/hooks/use-permissions";
import { listRoles } from "@/lib/api/roles";
import { assignRole, changePassword, deactivateUser, listUsers, removeRole, updateUser } from "@/lib/api/users";
import { getOnboardingStatusMeta, parseTenantProductProfile } from "@/lib/product/service-catalog";
import { useTenantStore } from "@/stores/tenant-store";
import { getColumns } from "../../users/columns";
import { PasswordDialog, RolesDialog, UserDialog, type UserFormValues } from "../../users/user-dialogs";

export function UsersTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const currentCompany = useTenantStore((state) => state.currentCompany);
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
  const tenantProfile = parseTenantProductProfile(currentCompany);
  const onboardingMeta = getOnboardingStatusMeta(tenantProfile.onboarding.status);

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
        title={`Usuarios internos de ${currentCompany?.name ?? "la empresa operadora"}`}
        description="Esta consola administra personas del tenant activo y sus roles internos. La identidad global de plataforma y el cambio de empresa no se resuelven aqui."
        footer={
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Badge variant="outline">{users.length} usuarios</Badge>
            <Badge variant="outline">{roles.length} roles cargados</Badge>
            <Badge variant="secondary">Roles globales explicitos: GAP separado</Badge>
            {currentCompany ? <Badge variant="outline">Tenant: {currentCompany.slug}</Badge> : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Admin inicial y acceso interno</CardTitle>
            <CardDescription>
              Aqui se vuelve visible con que usuario entra la empresa y como se separa ese ownership del backoffice global.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-950">
                  <KeyRound className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Admin bootstrap del tenant</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cuenta inicial para operar esta empresa</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p>Email: <span className="font-medium text-slate-900 dark:text-slate-100">{tenantProfile.onboarding.adminEmail ?? "pendiente"}</span></p>
                <p>Rol: <span className="font-medium text-slate-900 dark:text-slate-100">{tenantProfile.onboarding.roleName ?? "tenant_admin pendiente"}</span></p>
                <p>Estado: <span className="font-medium text-slate-900 dark:text-slate-100">{onboardingMeta.label}</span></p>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
                La contrasena se define en el bootstrap inicial. Las altas administrativas generales de usuarios siguen limitadas por el contrato actual del backend.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Lo que ya puede hacer esta empresa</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>Entrar con su propio admin inicial y operar bajo su branding.</span>
                </li>
                <li className="flex gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>Editar usuarios existentes, cambiar contrasenas y asignar roles internos del tenant.</span>
                </li>
                <li className="flex gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>Ver un portal distinto al backoffice global, con menu segun sus modulos habilitados.</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <TenantPortalPreview
          tenant={currentCompany}
          title="Preview del portal de la empresa"
          description="Esto ayuda a validar que el usuario interno no esta viendo el backoffice global sino el portal del tenant activo."
          compact
        />
      </div>

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
