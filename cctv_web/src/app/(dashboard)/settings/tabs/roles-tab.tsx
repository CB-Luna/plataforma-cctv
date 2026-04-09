"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield, Pencil, KeyRound, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import type { RoleAdmin } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeBadge } from "@/components/theme-selector";
import { usePermissions } from "@/hooks/use-permissions";
import { useTenantStore } from "@/stores/tenant-store";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { createRole, listRoles, updateRole } from "@/lib/api/roles";
import {
  PermissionsDialog,
  RoleDialog,
  type RoleFormValues,
  getRoleMeta,
  getRoleIcon,
  setRoleMeta,
  type RoleMeta,
} from "../../roles/role-dialogs";

export function RolesTab() {
  const queryClient = useQueryClient();
  const { canAny, permissions, roles: userRoles } = usePermissions();
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const [editRole, setEditRole] = useState<RoleAdmin | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState<RoleAdmin | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const canCreateRole = canAny("roles.create", "roles:create:all");
  const canEditRole = canAny("roles.update", "roles:update:own", "roles:update:all");
  const canManagePermissions = canAny("permissions:read:all", "roles.update", "roles:update:own", "roles:update:all");
  const canDeleteRole = canAny("roles.delete", "roles:delete:all");

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
  });

  // F10: ocultar roles del sistema (super_admin, tenant_admin) en el portal tenant
  const experience = getWorkspaceExperience({ permissions, roles: userRoles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";

  const createMutation = useMutation({
    mutationFn: (data: { values: RoleFormValues; meta: RoleMeta }) =>
      createRole(data.values),
    onSuccess: (newRole, variables) => {
      if (newRole?.id) {
        setRoleMeta(newRole.id, variables.meta);
      }
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol creado");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear rol"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { values: RoleFormValues; meta: RoleMeta } }) =>
      updateRole(id, data.values),
    onSuccess: (_, variables) => {
      setRoleMeta(variables.id, variables.data.meta);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol actualizado");
      setDialogOpen(false);
      setEditRole(null);
    },
    onError: () => toast.error("Error al actualizar rol"),
  });

  function handleSubmit(values: RoleFormValues, meta: RoleMeta) {
    if (editRole) {
      updateMutation.mutate({ id: editRole.id, data: { values, meta } });
      return;
    }
    createMutation.mutate({ values, meta });
  }

  const filtered = roles.filter((r) => {
    // En portal tenant los roles de sistema no deben ser visibles
    if (!isPlatformAdmin && r.is_system) return false;
    return r.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{roles.length} roles</span>
          {canCreateRole && (
            <Button
              onClick={() => {
                setEditRole(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo rol
            </Button>
          )}
        </div>
      </div>

      {/* Grid de cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((role) => {
            const meta = getRoleMeta(role.id);
            const Icon = getRoleIcon(meta.icon);
            const color = meta.color ?? "#2563eb";

            return (
              <div
                key={role.id}
                className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                {/* Fila: icono + info */}
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: color + "20", color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{role.name}</h3>
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{role.description}</p>
                    )}
                  </div>
                </div>

                {/* Badges: sistema + tema */}
                <div className="flex items-center gap-2 flex-wrap">
                  {role.is_system && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Shield className="h-3 w-3" />
                      Sistema
                    </Badge>
                  )}
                  {meta.theme && <ThemeBadge themeCode={meta.theme} />}
                </div>

                {/* Acciones (hover) */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEditRole && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditRole(role);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canManagePermissions && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setPermissionsRole(role);
                        setPermissionsDialogOpen(true);
                      }}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDeleteRole && !role.is_system && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Eliminar rol "${role.name}"?`)) {
                          toast.info("Eliminar rol aun no esta soportado por el contrato de backend");
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
