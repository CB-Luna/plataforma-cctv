"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Eye, EyeOff, UserPlus, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeSelector, type ThemeSelection } from "@/components/theme-selector";
import type { UserAdmin, RoleAdmin } from "@/types/api";

// ─── Clave localStorage para temas de usuario ───────────────────────────────
const USER_THEMES_KEY = "user_theme_assignments_v1";

function getUserThemes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(USER_THEMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getUserTheme(userId: string): string | null {
  return getUserThemes()[userId] ?? null;
}

function setUserTheme(userId: string, themeCode: string | null) {
  const themes = getUserThemes();
  if (themeCode) {
    themes[userId] = themeCode;
  } else {
    delete themes[userId];
  }
  localStorage.setItem(USER_THEMES_KEY, JSON.stringify(themes));
}

// ─── Utilidades de avatar en localStorage ───────────────────────────────────
const USER_AVATARS_KEY = "user_avatar_assignments_v1";

function getUserAvatars(): Record<string, string> {
  try {
    const raw = localStorage.getItem(USER_AVATARS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getUserAvatar(userId: string): string | null {
  return getUserAvatars()[userId] ?? null;
}

export function setUserAvatar(userId: string, dataUrl: string | null) {
  const avatars = getUserAvatars();
  if (dataUrl) {
    avatars[userId] = dataUrl;
  } else {
    delete avatars[userId];
  }
  localStorage.setItem(USER_AVATARS_KEY, JSON.stringify(avatars));
}

// ─── Schema de edicion ──────────────────────────────────────────────────────

const userSchema = z.object({
  first_name: z.string().min(1, "Nombre requerido"),
  last_name: z.string().min(1, "Apellido requerido"),
  phone: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

// ─── Schema de creacion ─────────────────────────────────────────────────────

const createUserSchema = z
  .object({
    first_name: z.string().min(1, "Nombre requerido"),
    last_name: z.string().min(1, "Apellido requerido"),
    email: z.string().email("Email invalido"),
    password: z.string().min(8, "Minimo 8 caracteres"),
    confirm_password: z.string().min(1, "Confirma la contrasena"),
    phone: z.string().optional(),
    role_id: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Las contrasenas no coinciden",
    path: ["confirm_password"],
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

// ─── Dialog de edicion de usuario ───────────────────────────────────────────

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserFormValues) => void;
  user?: UserAdmin | null;
  isLoading?: boolean;
}

export function UserDialog({ open, onOpenChange, onSubmit, user, isLoading }: UserDialogProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { first_name: "", last_name: "", phone: "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({ first_name: user.first_name, last_name: user.last_name, phone: user.phone ?? "" });
      setSelectedTheme(getUserTheme(user.id));
    } else {
      form.reset({ first_name: "", last_name: "", phone: "" });
      setSelectedTheme(null);
    }
  }, [user, form]);

  function handleFormSubmit(values: UserFormValues) {
    if (user) setUserTheme(user.id, selectedTheme);
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>Actualiza los datos del usuario.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input {...form.register("first_name")} />
              {form.formState.errors.first_name && (
                <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Apellido *</Label>
              <Input {...form.register("last_name")} />
              {form.formState.errors.last_name && (
                <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Telefono</Label>
            <Input {...form.register("phone")} />
          </div>

          <ThemeSelector
            value={selectedTheme}
            onChange={(sel: ThemeSelection | null) => setSelectedTheme(sel?.code ?? null)}
          />

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

// ─── Dialog de creacion de usuario ──────────────────────────────────────────

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateUserFormValues, themeCode: string | null, avatarDataUrl: string | null) => void;
  roles: RoleAdmin[];
  isLoading?: boolean;
}

export function CreateUserDialog({ open, onOpenChange, onSubmit, roles, isLoading }: CreateUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      phone: "",
      role_id: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
      setSelectedTheme(null);
      setShowPassword(false);
      setShowConfirm(false);
      setAvatarDataUrl(null);
    }
  }, [open, form]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarDataUrl(ev.target?.result as string ?? null);
    reader.readAsDataURL(file);
  }

  function handleFormSubmit(values: CreateUserFormValues) {
    onSubmit(values, selectedTheme, avatarDataUrl);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo usuario para este tenant. El usuario recibira acceso con las credenciales definidas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-5">
          {/* Avatar */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Foto de perfil</h4>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarDataUrl ? "Cambiar imagen" : "Seleccionar imagen"}
                </Button>
                {avatarDataUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setAvatarDataUrl(null)}
                  >
                    Quitar
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">PNG, JPG o WebP. Se guarda localmente.</p>
              </div>
            </div>
          </div>

          {/* Datos personales */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Datos personales</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input placeholder="Juan" {...form.register("first_name")} />
                {form.formState.errors.first_name && (
                  <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input placeholder="Perez" {...form.register("last_name")} />
                {form.formState.errors.last_name && (
                  <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input placeholder="+52 55 1234 5678" {...form.register("phone")} />
            </div>
          </div>

          {/* Credenciales */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Credenciales</h4>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" placeholder="usuario@empresa.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contrasena *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 caracteres"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Confirmar contrasena *</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repite la contrasena"
                    {...form.register("confirm_password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirm_password && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirm_password.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Rol y tema */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Rol y personalizacion</h4>
            <div className="space-y-2">
              <Label>Rol inicial</Label>
              <Select
                value={form.watch("role_id") || ""}
                onValueChange={(v) => form.setValue("role_id", v || undefined, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ThemeSelector
              value={selectedTheme}
              onChange={(sel: ThemeSelection | null) => setSelectedTheme(sel?.code ?? null)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog de cambio de contrasena ─────────────────────────────────────────

const passwordSchema = z.object({
  password: z.string().min(8, "Minimo 8 caracteres"),
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PasswordFormValues) => void;
  isLoading?: boolean;
}

export function PasswordDialog({ open, onOpenChange, onSubmit, isLoading }: PasswordDialogProps) {
  const [showPw, setShowPw] = useState(false);
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ password: "" });
      setShowPw(false);
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar contrasena</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nueva contrasena *</Label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} {...form.register("password")} />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
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

// ─── Dialog de gestion de roles ─────────────────────────────────────────────

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
