"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserAdmin } from "@/types/api";

const userSchema = z.object({
  first_name: z.string().min(1, "Nombre requerido"),
  last_name: z.string().min(1, "Apellido requerido"),
  phone: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserFormValues) => void;
  user?: UserAdmin | null;
  isLoading?: boolean;
}

export function UserDialog({ open, onOpenChange, onSubmit, user, isLoading }: UserDialogProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { first_name: "", last_name: "", phone: "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({ first_name: user.first_name, last_name: user.last_name, phone: user.phone ?? "" });
    } else {
      form.reset({ first_name: "", last_name: "", phone: "" });
    }
  }, [user, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input {...form.register("first_name")} />
            {form.formState.errors.first_name && (
              <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Apellido *</Label>
            <Input {...form.register("last_name")} />
            {form.formState.errors.last_name && (
              <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input {...form.register("phone")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Password change dialog
const passwordSchema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PasswordFormValues) => void;
  isLoading?: boolean;
}

export function PasswordDialog({ open, onOpenChange, onSubmit, isLoading }: PasswordDialogProps) {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  useEffect(() => {
    if (open) form.reset({ password: "" });
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nueva contraseña *</Label>
            <Input type="password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Cambiando..." : "Cambiar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Roles management dialog
interface RolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserAdmin | null;
  allRoles: { id: string; name: string }[];
  onAssign: (roleId: string) => void;
  onRemove: (roleId: string) => void;
}

export function RolesDialog({ open, onOpenChange, user, allRoles, onAssign, onRemove }: RolesDialogProps) {
  if (!user) return null;
  const userRoleIds = new Set(user.roles?.map((r) => r.id) ?? []);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Roles de {user.first_name} {user.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {allRoles.map((role) => {
            const assigned = userRoleIds.has(role.id);
            return (
              <div key={role.id} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm font-medium">{role.name}</span>
                <Button
                  size="sm"
                  variant={assigned ? "destructive" : "default"}
                  onClick={() => assigned ? onRemove(role.id) : onAssign(role.id)}
                >
                  {assigned ? "Quitar" : "Asignar"}
                </Button>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
