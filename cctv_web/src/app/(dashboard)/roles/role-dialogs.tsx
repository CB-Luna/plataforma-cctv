"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RoleAdmin } from "@/types/api";

// ─── Role Form ───
const roleSchema = z.object({
  name: z.string().min(1, "Requerido"),
  description: z.string().optional(),
});

export type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RoleFormValues) => void;
  role?: RoleAdmin | null;
  isLoading?: boolean;
}

export function RoleDialog({ open, onOpenChange, onSubmit, role, isLoading }: RoleDialogProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
  });

  useEffect(() => {
    if (open && role) {
      reset({ name: role.name, description: role.description ?? "" });
    } else if (open) {
      reset({ name: "", description: "" });
    }
  }, [open, role, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register("description")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Permissions Dialog ───
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRolePermissions, assignPermission, listPermissions } from "@/lib/api/roles";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Plus, Check } from "lucide-react";

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleAdmin | null;
}

export function PermissionsDialog({ open, onOpenChange, role }: PermissionsDialogProps) {
  const queryClient = useQueryClient();

  const { data: allPermissions = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: listPermissions,
    enabled: open,
  });

  const { data: rolePermissions = [] } = useQuery({
    queryKey: ["role-permissions", role?.id],
    queryFn: () => getRolePermissions(role!.id),
    enabled: open && !!role,
  });

  const assignMut = useMutation({
    mutationFn: (permId: string) => assignPermission(role!.id, permId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", role?.id] });
      toast.success("Permiso asignado");
    },
    onError: () => toast.error("Error al asignar permiso"),
  });

  const rolePermIds = new Set(rolePermissions.map((p) => p.id));

  // Group permissions by module
  const grouped = allPermissions.reduce<Record<string, typeof allPermissions>>((acc, p) => {
    const mod = p.module || "General";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permisos — {role?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">{module}</h4>
              <div className="space-y-1">
                {perms.map((perm) => {
                  const assigned = rolePermIds.has(perm.id);
                  return (
                    <div key={perm.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div>
                        <span className="text-sm font-medium">{perm.code}</span>
                        {perm.description && (
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        )}
                      </div>
                      {assigned ? (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" /> Asignado
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => assignMut.mutate(perm.id)}
                          disabled={assignMut.isPending}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Asignar
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {allPermissions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hay permisos disponibles</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
