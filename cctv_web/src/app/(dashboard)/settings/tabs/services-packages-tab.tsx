"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  CircleDot,
  Construction,
  Package2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { ServiceBadges } from "@/components/product/service-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { StatsCard } from "@/components/ui/stats-card";
import { listTenants, updateTenant } from "@/lib/api/tenants";
import { isPlatformTenant } from "@/lib/platform";
import {
  type CommercialPlanCode,
  type ProductServiceCode,
  ASSIGNABLE_SERVICE_CODES,
  COMMERCIAL_PLAN_PRESETS,
  PRODUCT_SERVICE_DEFINITIONS,
  buildTenantSettings,
  getServiceStatusMeta,
  parseTenantProductProfile,
} from "@/lib/product/service-catalog";
import { ChevronDown, ChevronRight, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function ServicesPackagesTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const canEdit = canAny("tenants:update:all", "tenants.update");

  const { data: rawTenants = [] } = useQuery({
    queryKey: ["tenants", "services-packages"],
    queryFn: () => listTenants(),
  });

  // Filtrar tenant plataforma
  const tenants = rawTenants.filter((t: { id: string }) => !isPlatformTenant(t.id));

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  // Overrides locales del usuario: solo se guardan cuando hay edicion pendiente
  const [editOverrides, setEditOverrides] = useState<Record<string, { services: ProductServiceCode[]; plan: CommercialPlanCode; disabledScreens: Partial<Record<ProductServiceCode, string[]>> }>>({});
  // Servicios expandidos en la UI para mostrar pantallas individuales
  const [expandedServices, setExpandedServices] = useState<Set<ProductServiceCode>>(new Set());

  // Auto-seleccion: usar el primer tenant disponible si no hay seleccion explicita
  const effectiveTenantId = selectedTenantId ?? (tenants[0]?.id ?? null);
  const selectedTenant = tenants.find((t) => t.id === effectiveTenantId) ?? null;

  // Estado de edicion derivado: override del usuario o perfil actual del tenant
  const currentProfile = selectedTenant ? parseTenantProductProfile(selectedTenant) : null;
  const currentOverride = effectiveTenantId ? editOverrides[effectiveTenantId] : null;
  const editedServices: ProductServiceCode[] = currentOverride?.services ?? currentProfile?.enabledServices ?? [];
  const editedPlan: CommercialPlanCode = currentOverride?.plan ?? currentProfile?.packageProfile ?? "basic";
  const editedDisabledScreens: Partial<Record<ProductServiceCode, string[]>> = currentOverride?.disabledScreens ?? currentProfile?.disabledScreens ?? {};
  const isDirty = !!currentOverride;

  const stats = useMemo(() => {
    const profiles = tenants.map((t) => parseTenantProductProfile(t));
    return {
      total: tenants.length,
      basic: profiles.filter((p) => p.packageProfile === "basic").length,
      professional: profiles.filter((p) => p.packageProfile === "professional").length,
      enterprise: profiles.filter((p) => p.packageProfile === "enterprise").length,
      custom: profiles.filter((p) => p.packageProfile === "custom").length,
      operational: ASSIGNABLE_SERVICE_CODES.filter(
        (c) => PRODUCT_SERVICE_DEFINITIONS[c]?.status === "operational",
      ).length,
    };
  }, [tenants]);

  function toggleService(code: ProductServiceCode) {
    if (!effectiveTenantId) return;
    const newServices = editedServices.includes(code)
      ? editedServices.filter((s) => s !== code)
      : [...editedServices, code];
    // Al deshabilitar un servicio, limpiar sus pantallas deshabilitadas
    const newDisabled = { ...editedDisabledScreens };
    if (!newServices.includes(code)) {
      delete newDisabled[code];
    }
    setEditOverrides((prev) => ({
      ...prev,
      [effectiveTenantId]: { services: newServices, plan: editedPlan, disabledScreens: newDisabled },
    }));
  }

  function toggleScreen(serviceCode: ProductServiceCode, screenKey: string) {
    if (!effectiveTenantId) return;
    const current = editedDisabledScreens[serviceCode] ?? [];
    const isDisabled = current.includes(screenKey);
    const newScreens = isDisabled
      ? current.filter((k) => k !== screenKey)
      : [...current, screenKey];
    const newDisabled = { ...editedDisabledScreens };
    if (newScreens.length > 0) {
      newDisabled[serviceCode] = newScreens;
    } else {
      delete newDisabled[serviceCode];
    }
    setEditOverrides((prev) => ({
      ...prev,
      [effectiveTenantId]: { services: editedServices, plan: editedPlan, disabledScreens: newDisabled },
    }));
  }

  function toggleServiceExpanded(code: ProductServiceCode) {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function applyPlan(planCode: CommercialPlanCode) {
    if (!effectiveTenantId) return;
    const plan = COMMERCIAL_PLAN_PRESETS[planCode];
    if (!plan) return;
    // Plan personalizado: no cambiar servicios, solo permitir edicion manual
    const newServices = planCode === "custom" ? editedServices : [...plan.suggestedServices];
    setEditOverrides((prev) => ({
      ...prev,
      [effectiveTenantId]: { services: newServices, plan: planCode, disabledScreens: editedDisabledScreens },
    }));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTenant) throw new Error("Sin tenant seleccionado");
      const profile = parseTenantProductProfile(selectedTenant);
      const newSettings = buildTenantSettings({
        existingSettings: selectedTenant.settings as Record<string, unknown> | null,
        packageProfile: editedPlan,
        enabledServices: editedServices,
        disabledScreens: editedDisabledScreens,
        onboarding: profile.onboarding,
      });
      return updateTenant(selectedTenant.id, {
        name: selectedTenant.name,
        settings: newSettings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      if (effectiveTenantId) {
        setEditOverrides((prev) => {
          const copy = { ...prev };
          delete copy[effectiveTenantId];
          return copy;
        });
      }
      toast.success("Servicios actualizados correctamente");
    },
    onError: () => toast.error("Error al actualizar servicios del tenant"),
  });

  return (
    <div className="space-y-6">
      {/* Stats resumen */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total tenants" value={stats.total} icon={Building2} color="blue" />
        <StatsCard title="Plan Basic" value={stats.basic} icon={Package2} color="teal" />
        <StatsCard title="Plan Professional" value={stats.professional} icon={Package2} color="amber" />
        <StatsCard title="Plan Enterprise" value={stats.enterprise} icon={Package2} color="purple" />
      </div>

      {/* Layout principal: selector de tenant + editor */}
      <div className="grid gap-6 2xl:grid-cols-[340px,1fr]">
        {/* Panel izquierdo: lista de tenants */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tenants registrados</CardTitle>
            <CardDescription>
              Selecciona un tenant para configurar su plan y servicios habilitados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="max-h-128 space-y-2 overflow-y-auto pr-1">
              {tenants.map((tenant) => {
                const isSelected = tenant.id === selectedTenantId;
                const profile = parseTenantProductProfile(tenant);
                const planPreset = COMMERCIAL_PLAN_PRESETS[profile.packageProfile];

                return (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => setSelectedTenantId(tenant.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-amber-500 bg-amber-50 shadow-sm dark:border-amber-500 dark:bg-amber-950/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900/60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                          {tenant.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{tenant.slug}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {planPreset?.label ?? profile.packageProfile}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <ServiceBadges services={profile.enabledServices} compact />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Panel derecho: editor de servicios */}
        {selectedTenant ? (
          <div className="space-y-6">
            {/* Encabezado del tenant seleccionado */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{selectedTenant.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Configura el plan comercial y los servicios habilitados para este tenant.
                      {isDirty && (
                        <span className="ml-2 font-medium text-amber-600">
                          — Cambios sin guardar
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <Button
                      onClick={() => saveMutation.mutate()}
                      disabled={!isDirty || saveMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saveMutation.isPending ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Selector de plan comercial */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Plan comercial
              </h3>
              <div className="grid gap-4 xl:grid-cols-4">
                {Object.values(COMMERCIAL_PLAN_PRESETS).map((plan) => {
                  const isActive = editedPlan === plan.code;
                  return (
                    <button
                      key={plan.code}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => applyPlan(plan.code)}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition-all",
                        isActive
                          ? "border-amber-500 bg-amber-50 shadow-sm dark:border-amber-500 dark:bg-amber-950/20"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600",
                        !canEdit && "cursor-default opacity-70",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {plan.label}
                        </span>
                        {isActive && (
                          <CheckCircle2 className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                      <div className="mt-3">
                        <ServiceBadges services={plan.suggestedServices} compact />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Servicios individuales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Servicios habilitados ({editedServices.length}/{ASSIGNABLE_SERVICE_CODES.length})
                </CardTitle>
                <CardDescription>
                  Activa o desactiva servicios individualmente. Al cambiar de plan, los servicios se ajustan automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {ASSIGNABLE_SERVICE_CODES.map((serviceCode) => {
                    const def = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
                    if (!def) return null;
                    const meta = getServiceStatusMeta(def.status);
                    const isEnabled = editedServices.includes(serviceCode);
                    const StatusIcon =
                      def.status === "operational"
                        ? CheckCircle2
                        : def.status === "partial"
                          ? CircleDot
                          : Construction;

                    return (
                      <label
                        key={serviceCode}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all",
                          isEnabled
                            ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
                            : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60",
                          !canEdit && "pointer-events-none opacity-70",
                        )}
                      >
                        <Checkbox
                          checked={isEnabled}
                          onCheckedChange={() => toggleService(serviceCode)}
                          disabled={!canEdit}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              {def.label}
                            </span>
                            <StatusIcon className={cn("h-3.5 w-3.5", meta.tone === "default" ? "text-green-500" : meta.tone === "secondary" ? "text-amber-500" : "text-slate-400")} />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
                          <Badge variant={meta.tone} className="mt-2 text-[10px]">
                            {meta.label}
                          </Badge>
                          {isEnabled && def.screens.length > 0 && (
                            <div className="mt-2">
                              <button
                                type="button"
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleServiceExpanded(serviceCode); }}
                              >
                                {expandedServices.has(serviceCode) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                <Monitor className="h-3 w-3" />
                                <span>{def.screens.length} pantallas</span>
                              </button>
                              {expandedServices.has(serviceCode) && (
                                <div className="mt-2 space-y-1 border-l-2 border-blue-200 pl-3 dark:border-blue-800">
                                  {def.screens.map((screen) => {
                                    const screenDisabled = editedDisabledScreens[serviceCode]?.includes(screen.key) ?? false;
                                    return (
                                      <label
                                        key={screen.key}
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Checkbox
                                          checked={!screenDisabled}
                                          onCheckedChange={() => toggleScreen(serviceCode, screen.key)}
                                          disabled={!canEdit}
                                          className="h-3.5 w-3.5"
                                        />
                                        <span className={cn(screenDisabled && "text-muted-foreground line-through")}>
                                          {screen.label}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Matriz de servicios por plan (referencia) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Matriz de servicios por plan</CardTitle>
                <CardDescription>
                  Referencia rapida de que servicios incluye cada plan comercial.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500 dark:text-slate-400">
                      <th className="px-3 py-3 font-semibold">Dominio</th>
                      <th className="px-3 py-3 font-semibold">Estado</th>
                      <th className="px-3 py-3 font-semibold">Basic</th>
                      <th className="px-3 py-3 font-semibold">Professional</th>
                      <th className="px-3 py-3 font-semibold">Enterprise</th>
                      <th className="px-3 py-3 font-semibold">Personalizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ASSIGNABLE_SERVICE_CODES.map((serviceCode) => {
                      const def = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
                      if (!def) return null;
                      const meta = getServiceStatusMeta(def.status);
                      const inBasic = COMMERCIAL_PLAN_PRESETS.basic.suggestedServices.includes(serviceCode);
                      const inPro = COMMERCIAL_PLAN_PRESETS.professional.suggestedServices.includes(serviceCode);
                      const inEnt = COMMERCIAL_PLAN_PRESETS.enterprise.suggestedServices.includes(serviceCode);

                      return (
                        <tr key={serviceCode} className="border-b last:border-0">
                          <td className="px-3 py-2 font-medium">{def.label}</td>
                          <td className="px-3 py-2">
                            <Badge variant={meta.tone} className="text-xs">{meta.label}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            {inBasic ? (
                              <Badge variant="default" className="text-xs">Incluido</Badge>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {inPro ? (
                              <Badge variant="default" className="text-xs">Incluido</Badge>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {inEnt ? (
                              <Badge variant="default" className="text-xs">Incluido</Badge>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-xs text-muted-foreground italic">Manual</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="flex items-center justify-center p-12">
            <div className="text-center text-muted-foreground">
              <Package2 className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="font-medium">Selecciona un tenant</p>
              <p className="mt-1 text-sm">
                Para configurar su plan y servicios habilitados.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
