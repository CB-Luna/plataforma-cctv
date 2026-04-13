"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Construction,
  Monitor,
  Package2,
  Save,
  TableProperties,
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { ServiceBadges } from "@/components/product/service-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
      // PUT reemplaza todo — preservar campos existentes del tenant (logo, colores, etc.)
      return updateTenant(selectedTenant.id, {
        name: selectedTenant.name,
        logo_url: selectedTenant.logo_url ?? undefined,
        primary_color: selectedTenant.primary_color ?? undefined,
        secondary_color: selectedTenant.secondary_color ?? undefined,
        tertiary_color: selectedTenant.tertiary_color ?? undefined,
        domain: selectedTenant.domain ?? undefined,
        subscription_plan: selectedTenant.subscription_plan ?? undefined,
        max_users: selectedTenant.max_users ?? undefined,
        max_clients: selectedTenant.max_clients ?? undefined,
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

  // Estado para colapsar la matriz de referencia
  const [showMatrix, setShowMatrix] = useState(false);

  return (
    <div className="space-y-4">
      {/* Stats compactos inline */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{stats.total}</span>
          <span className="text-muted-foreground">tenants</span>
        </div>
        <span className="text-muted-foreground">·</span>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-teal-600">{stats.basic}</span>
          <span className="text-muted-foreground">Basic</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-amber-600">{stats.professional}</span>
          <span className="text-muted-foreground">Professional</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-purple-600">{stats.enterprise}</span>
          <span className="text-muted-foreground">Enterprise</span>
        </div>
        {stats.custom > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium text-blue-600">{stats.custom}</span>
            <span className="text-muted-foreground">Custom</span>
          </div>
        )}
        <span className="text-muted-foreground">·</span>
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span className="font-medium">{stats.operational}</span>
          <span className="text-muted-foreground">operativos</span>
        </div>
      </div>

      {/* Layout principal: selector de tenant + editor */}
      <div className="grid gap-4 2xl:grid-cols-[320px,1fr]">
        {/* Panel izquierdo: lista de tenants */}
        <Card className="h-fit">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm">Tenants</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="max-h-[calc(100vh-280px)] space-y-1.5 overflow-y-auto pr-1">
              {tenants.map((tenant) => {
                const isSelected = tenant.id === effectiveTenantId;
                const profile = parseTenantProductProfile(tenant);
                const planPreset = COMMERCIAL_PLAN_PRESETS[profile.packageProfile];

                return (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => setSelectedTenantId(tenant.id)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-left transition-all",
                      isSelected
                        ? "border-amber-500 bg-amber-50 shadow-sm dark:border-amber-500 dark:bg-amber-950/20"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-900/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {tenant.name}
                      </p>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {planPreset?.label ?? profile.packageProfile}
                      </Badge>
                    </div>
                    <div className="mt-1">
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
          <div className="space-y-4">
            {/* Encabezado + plan selector en una sola card */}
            <Card>
              <CardHeader className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">{selectedTenant.name}</CardTitle>
                    <CardDescription className="mt-0.5 text-xs">
                      Plan y servicios habilitados
                      {isDirty && (
                        <span className="ml-2 font-medium text-amber-600">
                          — Cambios sin guardar
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <Button
                      size="sm"
                      onClick={() => saveMutation.mutate()}
                      disabled={!isDirty || saveMutation.isPending}
                    >
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      {saveMutation.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {/* Plan comercial como pills horizontales */}
                <div className="flex flex-wrap gap-2">
                  {Object.values(COMMERCIAL_PLAN_PRESETS).map((plan) => {
                    const isActive = editedPlan === plan.code;
                    return (
                      <button
                        key={plan.code}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => applyPlan(plan.code)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                          isActive
                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-400"
                            : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600",
                          !canEdit && "cursor-default opacity-70",
                        )}
                        title={plan.description}
                      >
                        {isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {plan.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Servicios – grid compacto 2 columnas */}
            <Card>
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-sm">
                  Servicios ({editedServices.length}/{ASSIGNABLE_SERVICE_CODES.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="grid gap-2 sm:grid-cols-2">
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
                    const isExpanded = expandedServices.has(serviceCode);

                    return (
                      <div
                        key={serviceCode}
                        className={cn(
                          "rounded-lg border p-3 transition-all",
                          isEnabled
                            ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
                            : "border-slate-200 dark:border-slate-800",
                        )}
                      >
                        <label className={cn("flex cursor-pointer items-center gap-2.5", !canEdit && "pointer-events-none opacity-70")}>
                          <Checkbox
                            checked={isEnabled}
                            onCheckedChange={() => toggleService(serviceCode)}
                            disabled={!canEdit}
                            className="h-4 w-4"
                          />
                          <div className="flex flex-1 items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {def.label}
                            </span>
                            <StatusIcon className={cn("h-3 w-3 shrink-0", meta.tone === "default" ? "text-green-500" : meta.tone === "secondary" ? "text-amber-500" : "text-slate-400")} />
                            <Badge variant={meta.tone} className="ml-auto text-[10px] shrink-0">
                              {meta.label}
                            </Badge>
                          </div>
                        </label>
                        <p className="mt-1 pl-6.5 text-[11px] leading-tight text-muted-foreground">
                          {def.description}
                        </p>

                        {/* Pantallas individuales */}
                        {isEnabled && def.screens.length > 0 && (
                          <div className="mt-2 pl-6.5">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 dark:text-blue-400"
                              onClick={() => toggleServiceExpanded(serviceCode)}
                            >
                              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              <Monitor className="h-3 w-3" />
                              <span>{def.screens.length} pantallas</span>
                            </button>
                            {isExpanded && (
                              <div className="mt-1.5 space-y-0.5 border-l-2 border-blue-200 pl-2.5 dark:border-blue-800">
                                {def.screens.map((screen) => {
                                  const screenDisabled = editedDisabledScreens[serviceCode]?.includes(screen.key) ?? false;
                                  return (
                                    <label
                                      key={screen.key}
                                      className="flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                      <Checkbox
                                        checked={!screenDisabled}
                                        onCheckedChange={() => toggleScreen(serviceCode, screen.key)}
                                        disabled={!canEdit}
                                        className="h-3 w-3"
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
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Matriz colapsable */}
            <div>
              <button
                type="button"
                onClick={() => setShowMatrix((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showMatrix ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <TableProperties className="h-4 w-4" />
                Matriz de servicios por plan
              </button>
              {showMatrix && (
                <Card className="mt-2">
                  <CardContent className="overflow-x-auto p-0">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="px-3 py-2 font-semibold">Dominio</th>
                          <th className="px-3 py-2 font-semibold">Estado</th>
                          <th className="px-3 py-2 font-semibold">Basic</th>
                          <th className="px-3 py-2 font-semibold">Pro</th>
                          <th className="px-3 py-2 font-semibold">Enterprise</th>
                          <th className="px-3 py-2 font-semibold">Custom</th>
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
                              <td className="px-3 py-1.5 font-medium">{def.label}</td>
                              <td className="px-3 py-1.5">
                                <Badge variant={meta.tone} className="text-[10px]">{meta.label}</Badge>
                              </td>
                              <td className="px-3 py-1.5">
                                {inBasic ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-3 py-1.5">
                                {inPro ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-3 py-1.5">
                                {inEnt ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-3 py-1.5">
                                <span className="text-muted-foreground italic">Manual</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
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
