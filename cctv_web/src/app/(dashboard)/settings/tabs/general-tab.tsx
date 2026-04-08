"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Palette, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { ScopeCallout } from "@/components/settings/scope-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/use-permissions";
import { getSettings, updateTheme } from "@/lib/api/settings";
import { useTenantStore } from "@/stores/tenant-store";

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

  const [primary, setPrimary] = useState("#000000");
  const [secondary, setSecondary] = useState("#000000");
  const [tertiary, setTertiary] = useState("#000000");

  useEffect(() => {
    if (!settings) return;
    setPrimary(settings.primary_color || "#000000");
    setSecondary(settings.secondary_color || "#000000");
    setTertiary(settings.tertiary_color || "#000000");
  }, [settings]);

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
              label="Estado"
              value={
                <Badge variant={settings?.is_active ? "default" : "destructive"}>
                  {settings?.is_active ? "Activo" : "Inactivo"}
                </Badge>
              }
            />
            <InfoRow label="Max. usuarios" value={settings?.max_users ?? "-"} />
            <InfoRow label="Max. clientes" value={settings?.max_clients ?? "-"} />
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
