"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, Palette, Save, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ServiceBadges } from "@/components/product/service-badges";
import { TenantPortalPreview } from "@/components/settings/tenant-portal-preview";
import { ScopeCallout } from "@/components/settings/scope-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/use-permissions";
import { getSettings, updateTheme } from "@/lib/api/settings";
import { getOnboardingStatusMeta, parseTenantProductProfile } from "@/lib/product/service-catalog";
import { useTenantStore } from "@/stores/tenant-store";

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
  const onboardingMeta = getOnboardingStatusMeta(tenantProductProfile.onboarding.status);

  const [primary, setPrimary] = useState("#000000");
  const [secondary, setSecondary] = useState("#000000");
  const [tertiary, setTertiary] = useState("#000000");
  const [templateName, setTemplateName] = useState("");
  const [localTemplates, setLocalTemplates] = useState<ThemeTemplate[]>([]);

  const availableTemplates = useMemo(
    () => [...BUILT_IN_TEMPLATES, ...localTemplates],
    [localTemplates],
  );
  const previewTenant = useMemo(() => {
    const baseTenant = settings ?? currentCompany;
    if (!baseTenant) return null;

    return {
      ...baseTenant,
      primary_color: primary,
      secondary_color: secondary,
      tertiary_color: tertiary,
    };
  }, [currentCompany, primary, secondary, settings, tertiary]);

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
      if (!rawValue) {
        setLocalTemplates([]);
        return;
      }

      const parsedValue = JSON.parse(rawValue) as ThemeTemplate[];
      if (Array.isArray(parsedValue)) {
        setLocalTemplates(parsedValue);
      }
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
    if (!cleanName) {
      toast.error("Asigna un nombre a la plantilla");
      return;
    }

    const nextTemplates = [
      ...localTemplates,
      {
        id: `local-${Date.now()}`,
        name: cleanName,
        primary,
        secondary,
        tertiary,
        source: "local" as const,
      },
    ];
    persistLocalTemplates(nextTemplates);
    setTemplateName("");
    toast.success("Plantilla local guardada");
  }

  function deleteTemplate(templateId: string) {
    const nextTemplates = localTemplates.filter((template) => template.id !== templateId);
    persistLocalTemplates(nextTemplates);
    toast.success("Plantilla local eliminada");
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando configuracion...</div>;
  }

  return (
    <div className="space-y-6">
      <ScopeCallout
        badge="Tenant activo"
        accent="tenant"
        title="Branding y configuracion visual del tenant"
        description="Esta tab solo modifica la identidad del tenant activo. La alta de empresas operadoras y la carga de logo corporativo viven en la seccion global de Empresas."
        footer={
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Badge variant="outline">Tenant: {settings?.slug ?? "N/D"}</Badge>
            <Badge variant="outline">Plan: {settings?.subscription_plan || "N/D"}</Badge>
            {currentCompany?.logo_url ? <Badge variant="secondary">Logo en snapshot activo</Badge> : null}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Informacion del tenant
          </CardTitle>
          <CardDescription>Datos operativos visibles para el tenant activo dentro de la plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow label="Nombre" value={settings?.name} />
            <InfoRow label="Slug" value={settings?.slug} />
            <InfoRow
              label="Plan"
              value={<Badge variant="secondary">{settings?.subscription_plan || "N/D"}</Badge>}
            />
            <InfoRow
              label="Servicios habilitados"
              value={<ServiceBadges services={tenantProductProfile.enabledServices} compact />}
            />
            <InfoRow
              label="Onboarding"
              value={<Badge variant={onboardingMeta.tone}>{onboardingMeta.label}</Badge>}
            />
            <InfoRow
              label="Estado"
              value={
                <Badge variant={settings?.is_active ? "default" : "destructive"}>
                  {settings?.is_active ? "Activo" : "Inactivo"}
                </Badge>
              }
            />
            <InfoRow label="Max. usuarios" value={settings?.max_users ?? "-"} />
            <InfoRow label="Max. clientes" value={settings?.max_clients ?? "-"} />
            <InfoRow label="Admin bootstrap" value={tenantProductProfile.onboarding.adminEmail ?? "-"} />
            <InfoRow
              label="Creado"
              value={settings ? new Date(settings.created_at).toLocaleDateString("es-MX") : "-"}
            />
            <InfoRow
              label="Actualizado"
              value={settings ? new Date(settings.updated_at).toLocaleDateString("es-MX") : "-"}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contexto operativo del tenant</CardTitle>
          <CardDescription>
            Resumen de servicios y estado de onboarding que hoy gobiernan la experiencia visible del tenant activo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Servicios visibles
            </p>
            <div className="mt-2">
              <ServiceBadges services={tenantProductProfile.enabledServices} />
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={onboardingMeta.tone}>{onboardingMeta.label}</Badge>
              <Badge variant="outline">Origen: {tenantProductProfile.source === "explicit" ? "explicito" : "legacy"}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {tenantProductProfile.onboarding.notes || "Sin notas de onboarding registradas en el snapshot actual."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookmarkPlus className="h-5 w-5" />
              Plantillas visuales reutilizables
            </CardTitle>
            <CardDescription>
              Biblioteca visible para aplicar rapidamente branding a la empresa actual. Las plantillas guardadas por ahora viven en este navegador mientras se define un CRUD global.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {availableTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{template.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {template.source === "built_in" ? "Preset base" : "Plantilla local"}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {[template.primary, template.secondary, template.tertiary].map((color, index) => (
                        <div
                          key={`${template.id}-swatch-${index}`}
                          className="h-6 w-6 rounded-xl border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => applyTemplate(template)}>
                      Aplicar
                    </Button>
                    {template.source === "local" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTemplate(template.id)}
                        aria-label={`Eliminar ${template.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Guardar plantilla local</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Guarda la combinacion actual para reutilizarla en otras empresas mientras definimos la capa global de temas.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  placeholder="Ej. Calimax corporativo"
                />
                <Button type="button" onClick={saveCurrentTemplate}>
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                  Guardar plantilla
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <TenantPortalPreview
          tenant={previewTenant}
          title="Preview del portal con este branding"
          description="Antes de guardar puedes ver como cambian sidebar, identidad y menu del tenant con la paleta seleccionada."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema visual
          </CardTitle>
          <CardDescription>Estos colores alimentan el branding activo del tenant en header, selector de empresa y tema aplicado por snapshot local.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ColorField id="primary" label="Color primario" value={primary} onChange={setPrimary} />
            <ColorField id="secondary" label="Color secundario" value={secondary} onChange={setSecondary} />
            <ColorField id="tertiary" label="Color terciario" value={tertiary} onChange={setTertiary} />
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Vista previa de paleta</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Swatch color={primary} label="Primario" />
              <Swatch color={secondary} label="Secundario" />
              <Swatch color={tertiary} label="Terciario" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => themeMutation.mutate()} disabled={themeMutation.isPending || !canUpdateTheme}>
              <Save className="mr-2 h-4 w-4" />
              {themeMutation.isPending ? "Guardando..." : "Guardar tema"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-14 cursor-pointer p-1"
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="flex-1" />
      </div>
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="space-y-2">
      <div className="h-14 w-14 rounded-2xl border" style={{ backgroundColor: color }} />
      <div>
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-xs text-muted-foreground">{color}</p>
      </div>
    </div>
  );
}
