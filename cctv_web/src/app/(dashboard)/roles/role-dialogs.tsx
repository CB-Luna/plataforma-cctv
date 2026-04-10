"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeSelector, type ThemeSelection } from "@/components/theme-selector";
import type { RoleAdmin } from "@/types/api";
import {
  Shield,
  Users,
  Settings,
  Eye,
  Lock,
  Zap,
  Star,
  Bell,
  Database,
  Globe,
  Cloud,
  Key,
  BarChart3,
  AlertTriangle,
  Plus,
  Check,
} from "lucide-react";

// ─── Iconos disponibles para roles ──────────────────────────────────────────

const ROLE_ICONS = [
  { name: "Shield", icon: Shield },
  { name: "Users", icon: Users },
  { name: "Settings", icon: Settings },
  { name: "Eye", icon: Eye },
  { name: "Lock", icon: Lock },
  { name: "Zap", icon: Zap },
  { name: "Star", icon: Star },
  { name: "Bell", icon: Bell },
  { name: "Database", icon: Database },
  { name: "Globe", icon: Globe },
  { name: "Cloud", icon: Cloud },
  { name: "Key", icon: Key },
  { name: "BarChart3", icon: BarChart3 },
  { name: "AlertTriangle", icon: AlertTriangle },
] as const;

const ROLE_COLORS = [
  "#2563eb", "#7c3aed", "#059669", "#dc2626", "#ea580c",
  "#0284c7", "#db2777", "#16a34a", "#ca8a04", "#475569",
  "#6366f1", "#0891b2",
];

// ─── localStorage para metadatos de roles (icono, color, tema) ──────────────

const ROLE_META_KEY = "role_meta_assignments_v1";

export interface RoleMeta {
  icon?: string;
  color?: string;
  theme?: string;
}

function getRoleMetas(): Record<string, RoleMeta> {
  try {
    const raw = localStorage.getItem(ROLE_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getRoleMeta(roleId: string): RoleMeta {
  return getRoleMetas()[roleId] ?? {};
}

function setRoleMeta(roleId: string, meta: RoleMeta) {
  const metas = getRoleMetas();
  metas[roleId] = meta;
  localStorage.setItem(ROLE_META_KEY, JSON.stringify(metas));
}

export function getRoleIcon(iconName?: string) {
  const found = ROLE_ICONS.find((i) => i.name === iconName);
  return found?.icon ?? Shield;
}

// ─── Role Form ──────────────────────────────────────────────────────────────

const roleSchema = z.object({
  name: z.string().min(1, "Requerido"),
  description: z.string().optional(),
});

export type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RoleFormValues, meta: RoleMeta) => void;
  role?: RoleAdmin | null;
  isLoading?: boolean;
}

export function RoleDialog({ open, onOpenChange, onSubmit, role, isLoading }: RoleDialogProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
  });

  const [selectedIcon, setSelectedIcon] = useState("Shield");
  const [selectedColor, setSelectedColor] = useState(ROLE_COLORS[0]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    if (open && role) {
      reset({ name: role.name, description: role.description ?? "" });
      const meta = getRoleMeta(role.id);
      setSelectedIcon(meta.icon ?? "Shield");
      setSelectedColor(meta.color ?? ROLE_COLORS[0]);
      setSelectedTheme(meta.theme ?? null);
    } else if (open) {
      reset({ name: "", description: "" });
      setSelectedIcon("Shield");
      setSelectedColor(ROLE_COLORS[0]);
      setSelectedTheme(null);
    }
  }, [open, role, reset]);

  function handleFormSubmit(values: RoleFormValues) {
    const meta: RoleMeta = {
      icon: selectedIcon,
      color: selectedColor,
      theme: selectedTheme ?? undefined,
    };
    onSubmit(values, meta);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
          <DialogDescription>
            {role ? "Modifica las propiedades del rol." : "Define un nuevo rol con icono, color y tema opcional."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          {/* Nombre y descripcion */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea id="description" {...register("description")} rows={2} />
          </div>

          {/* Preview del rol */}
          <div className="flex items-center gap-3 rounded-xl border p-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: selectedColor + "20", color: selectedColor }}
            >
              {(() => {
                const Icon = getRoleIcon(selectedIcon);
                return <Icon className="h-5 w-5" />;
              })()}
            </div>
            <div className="text-sm">
              <p className="font-medium">Vista previa del rol</p>
              <p className="text-xs text-muted-foreground">Asi se vera en la lista de roles</p>
            </div>
          </div>

          {/* Selector de icono */}
          <div className="space-y-2">
            <Label>Icono</Label>
            <div className="grid grid-cols-7 gap-2">
              {ROLE_ICONS.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedIcon(name)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                    selectedIcon === name
                      ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/30"
                      : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Selector de color */}
          <div className="space-y-2">
            <Label>Color del icono</Label>
            <div className="flex flex-wrap gap-2">
              {ROLE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    selectedColor === color ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de tema */}
          <ThemeSelector
            value={selectedTheme}
            onChange={(sel: ThemeSelection | null) => setSelectedTheme(sel?.code ?? null)}
            label="Tema asociado"
          />

          <div className="flex justify-end gap-2 pt-2">
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

// ─── Permissions Dialog ─────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRolePermissions, assignPermission, listPermissions } from "@/lib/api/roles";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

// Exportar para uso desde roles-tab
export { setRoleMeta };
