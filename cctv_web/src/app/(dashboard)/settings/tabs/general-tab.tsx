"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, Check, Palette, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/use-permissions";
import { getSettings, updateTheme } from "@/lib/api/settings";
import { parseTenantProductProfile } from "@/lib/product/service-catalog";
import { getVisibleRuntimeMenu } from "@/lib/product/runtime-navigation";
import { useTenantStore } from "@/stores/tenant-store";
import { cn } from "@/lib/utils";

interface ThemeTemplate {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  source: "built_in" | "local";
}

const THEME_TEMPLATE_STORAGE_KEY = "tenant_theme_templates_v1";
const BUILT_IN_TEMPLATES: ThemeTemplate[] = [
  {
    id: "corporativo-azul",
    name: "Corporativo Azul",
    primary: "#2563EB",
    secondary: "#0F172A",
    tertiary: "#94A3B8",
    source: "built_in",
  },
  {
    id: "industrial-verde",
    name: "Industrial Verde",
    primary: "#15803D",
    secondary: "#14532D",
    tertiary: "#A3E635",
    source: "built_in",
  },
  {
    id: "retail-rojo",
    name: "Retail Rojo",
    primary: "#DC2626",
    secondary: "#7F1D1D",
    tertiary: "#FDBA74",
    source: "built_in",
  },
];

export function GeneralTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const setCompany = useTenantStore((state) => state.setCompany);
  const canUpdateTheme = canAny(
    "settings.update",
    "configuration.update",
    "configuration:update:own",
    "configuration:update:all",
    "themes:update:own",
    "themes:update:all",
  );

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });
  const tenantProductProfile = parseTenantProductProfile(settings ?? currentCompany);

  const [primary, setPrimary] = useState("#000000");
  const [secondary, setSecondary] = useState("#000000");
  const [tertiary, setTertiary] = useState("#000000");
  const [templateName, setTemplateName] = useState("");
  const [localTemplates, setLocalTemplates] = useState<ThemeTemplate[]>([]);

  const availableTemplates = useMemo(
    () => [...BUILT_IN_TEMPLATES, ...localTemplates],
    [localTemplates],
  );

  // Menu del preview en tiempo real
  const runtimeMenuSections = useMemo(
    () =>
      getVisibleRuntimeMenu({
        enabledServices: tenantProductProfile.enabledServices,
        hasRoleContext: true,
        ignorePermissions: true,
      }),
    [tenantProductProfile.enabledServices],
  );

  useEffect(() => {
    if (!settings) return;
    setPrimary(settings.primary_color || "#000000");
    setSecondary(settings.secondary_color || "#000000");
    setTertiary(settings.tertiary_color || "#000000");
  }, [settings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawValue = localStorage.getItem(THEME_TEMPLATE_STORAGE_KEY);
      if (!rawValue) { setLocalTemplates([]); return; }
      const parsedValue = JSON.parse(rawValue) as ThemeTemplate[];
      if (Array.isArray(parsedValue)) setLocalTemplates(parsedValue);
    } catch {
      setLocalTemplates([]);
    }
  }, []);

  const themeMutation = useMutation({
    mutationFn: () =>
      updateTheme({
        primary_color: primary,
        secondary_color: secondary,
        tertiary_color: tertiary,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      if (currentCompany) {
        setCompany({
          ...currentCompany,
          primary_color: primary,
          secondary_color: secondary,
          tertiary_color: tertiary,
        });
      }
      toast.success("Tema del tenant actualizado");
    },
    onError: () => toast.error("Error al actualizar tema"),
  });

  function persistLocalTemplates(nextTemplates: ThemeTemplate[]) {
    setLocalTemplates(nextTemplates);
    if (typeof window === "undefined") return;
    localStorage.setItem(THEME_TEMPLATE_STORAGE_KEY, JSON.stringify(nextTemplates));
  }

  function applyTemplate(template: ThemeTemplate) {
    setPrimary(template.primary);
    setSecondary(template.secondary);
    setTertiary(template.tertiary);
    toast.success(`Plantilla aplicada: ${template.name}`);
  }

  function saveCurrentTemplate() {
    const cleanName = templateName.trim();
    if (!cleanName) { toast.error("Asigna un nombre a la plantilla"); return; }
    persistLocalTemplates([
      ...localTemplates,
      { id: `local-${Date.now()}`, name: cleanName, primary, secondary, tertiary, source: "local" },
    ]);
    setTemplateName("");
    toast.success("Plantilla local guardada");
  }

  function deleteTemplate(templateId: string) {
    persistLocalTemplates(localTemplates.filter((t) => t.id !== templateId));
    toast.success("Plantilla local eliminada");
  }

  // Detectar si los colores actuales coinciden con alguna plantilla
  const activeTemplateId = availableTemplates.find(
    (t) => t.primary === primary && t.secondary === secondary && t.tertiary === tertiary,
  )?.id ?? null;

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando configuracion...</div>;
  }

  const tenantName = settings?.name ?? currentCompany?.name ?? "Empresa";

  return (
    <div className="grid h-[calc(100vh-280px)] min-h-[520px] grid-cols-1 gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 xl:grid-cols-[260px,1fr,300px]">
      {/* ── Panel izquierdo: Lista de temas ──────────────────────── */}
      <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 xl:border-b-0 xl:border-r">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-teal-500" />
            <span className="text-sm font-semibold">Temas</span>
            <Badge variant="outline" className="text-[10px]">{availableTemplates.length}</Badge>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* Presets */}
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Presets
          </p>
          {BUILT_IN_TEMPLATES.map((t) => (
            <ThemeListItem
              key={t.id}
              template={t}
              isActive={activeTemplateId === t.id}
              onApply={() => applyTemplate(t)}
            />
          ))}

          {/* Personalizados */}
          {localTemplates.length > 0 && (
            <>
              <p className="mt-3 flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Personalizados
                <Badge variant="secondary" className="text-[9px]">local</Badge>
              </p>
              {localTemplates.map((t) => (
                <ThemeListItem
                  key={t.id}
                  template={t}
                  isActive={activeTemplateId === t.id}
                  onApply={() => applyTemplate(t)}
                  onDelete={() => deleteTemplate(t.id)}
                />
              ))}
            </>
          )}

          {/* Guardar nueva plantilla */}
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nombre de plantilla"
              className="mb-2 h-8 text-xs"
            />
            <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={saveCurrentTemplate}>
              <BookmarkPlus className="mr-1.5 h-3 w-3" />
              Guardar plantilla
            </Button>
          </div>
        </div>
      </div>

      {/* ── Panel central: Vista previa en vivo ──────────────────── */}
      <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 xl:border-b-0 xl:border-r">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-sm text-gray-500">
            Vista previa <span className="text-gray-400">— Asi se vera tu sistema</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => themeMutation.mutate()} disabled={themeMutation.isPending || !canUpdateTheme}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {themeMutation.isPending ? "Guardando..." : "Guardar tema"}
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-950">
          {/* Preview del dashboard con los colores actuales */}
          <div className="mx-auto flex max-w-3xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            {/* Mini sidebar del preview */}
            <div className="hidden w-48 flex-col sm:flex" style={{ backgroundColor: secondary }}>
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: primary }}
                >
                  {tenantName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{tenantName}</p>
                  <p className="truncate text-[10px] text-white/50">Portal de empresa</p>
                </div>
              </div>
              <nav className="flex-1 space-y-0.5 p-2">
                {/* Item activo */}
                <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5" style={{ backgroundColor: `${primary}30` }}>
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primary }} />
                  <span className="text-[11px] font-medium text-white">Dashboard</span>
                </div>
                {runtimeMenuSections.slice(0, 4).map((section) => (
                  <div key={section.id} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors hover:bg-white/5">
                    <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                    <span className="text-[11px] text-white/60">{section.label}</span>
                  </div>
                ))}
              </nav>
            </div>

            {/* Area principal del preview */}
            <div className="flex-1">
              {/* Header del preview */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Dashboard</span>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full" style={{ backgroundColor: primary }} />
                </div>
              </div>

              {/* Contenido del preview — KPI cards */}
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-3 gap-2">
                  {["Asociados", "Activos", "Alertas"].map((label, i) => (
                    <div key={label} className="rounded-lg border border-gray-100 p-2.5 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400">{label}</p>
                      <p className="text-lg font-bold" style={{ color: i === 2 ? "#EF4444" : i === 1 ? primary : "inherit" }}>
                        {i === 0 ? "1,234" : i === 1 ? "987" : "12"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Barra simulada de actividad */}
                <div>
                  <p className="mb-2 text-[10px] font-medium text-gray-400">Actividad reciente</p>
                  <div className="flex gap-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-8 flex-1 rounded"
                        style={{
                          backgroundColor: primary,
                          opacity: 0.15 + (i / 8) * 0.85,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Indicadores con colores de paleta */}
                <div className="flex items-center gap-4 pt-2">
                  {[
                    { label: "Primario", color: primary },
                    { label: "Secundario", color: secondary },
                    { label: "Acento", color: tertiary },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[10px] text-gray-500">{label}</span>
                      <span className="text-[10px] font-mono text-gray-400">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel derecho: Editor de colores ─────────────────────── */}
      <div className="flex flex-col">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-sm font-semibold">Editor de Colores</p>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Colores principales */}
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Colores principales
            </p>
            <div className="space-y-3">
              <ColorEditorRow
                color={primary}
                onChange={setPrimary}
                label="Primario"
                description="Sidebar, botones principales, enlaces y acentos"
              />
              <ColorEditorRow
                color={secondary}
                onChange={setSecondary}
                label="Secundario"
                description="Fondo de sidebar, encabezados oscuros"
              />
              <ColorEditorRow
                color={tertiary}
                onChange={setTertiary}
                label="Acento"
                description="Notificaciones, alertas de atencion y destacados"
              />
            </div>
          </div>

          {/* Info del tenant */}
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Tenant activo
            </p>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Nombre</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span>Plan</span>
                <Badge variant="secondary" className="text-[10px]">{tenantProductProfile.packageProfile}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Slug</span>
                <span className="font-mono font-medium text-gray-900 dark:text-gray-100">{settings?.slug ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componentes auxiliares ──────────────────────────────────────────────

function ThemeListItem({
  template,
  isActive,
  onApply,
  onDelete,
}: {
  template: ThemeTemplate;
  isActive: boolean;
  onApply: () => void;
  onDelete?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onApply}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
        isActive
          ? "bg-teal-50 ring-1 ring-teal-200 dark:bg-teal-950/30 dark:ring-teal-800"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
      )}
    >
      <div className="flex gap-1">
        {[template.primary, template.secondary, template.tertiary].map((c, i) => (
          <div key={i} className="h-5 w-5 rounded-full border border-gray-200 dark:border-gray-600" style={{ backgroundColor: c }} />
        ))}
      </div>
      <span className="flex-1 truncate text-xs font-medium text-gray-700 dark:text-gray-300">{template.name}</span>
      {isActive && <Check className="h-3.5 w-3.5 text-teal-500" />}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="hidden rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:block"
          aria-label={`Eliminar ${template.name}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </button>
  );
}

function ColorEditorRow({
  color,
  onChange,
  label,
  description,
}: {
  color: string;
  onChange: (v: string) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <label className="relative mt-0.5 cursor-pointer">
        <div className="h-9 w-9 rounded-lg border-2 border-gray-200 shadow-sm dark:border-gray-600" style={{ backgroundColor: color }} />
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-[10px] leading-tight text-gray-400">{description}</p>
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 h-7 font-mono text-[11px]"
        />
      </div>
    </div>
  );
}
