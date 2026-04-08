"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle,
  KeyRound,
  LayoutPanelLeft,
  LogIn,
  Palette,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { Company, Tenant } from "@/types/api";
import { ServiceBadges } from "@/components/product/service-badges";
import { TenantPortalPreview } from "@/components/settings/tenant-portal-preview";
import { ScopeCallout } from "@/components/settings/scope-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsCard } from "@/components/ui/stats-card";
import { usePermissions } from "@/hooks/use-permissions";
import { getApiErrorMessage } from "@/lib/api/errors";
import { registerTenantUser } from "@/lib/api/auth";
import { listRoles } from "@/lib/api/roles";
import {
  activateTenant,
  createTenant,
  deactivateTenant,
  getTenantStats,
  listTenants,
  updateTenant,
  uploadTenantLogo,
} from "@/lib/api/tenants";
import { assignRole } from "@/lib/api/users";
import {
  buildTenantSettings,
  COMMERCIAL_PLAN_PRESETS,
  getOnboardingStatusMeta,
  getServiceStatusMeta,
  getTenantReadinessMeta,
  parseTenantProductProfile,
  PRODUCT_SERVICE_DEFINITIONS,
  RUNTIME_VISIBLE_SERVICE_CODES,
  type AssignableServiceCode,
  type CommercialPlanCode,
  type TenantOnboardingSnapshot,
} from "@/lib/product/service-catalog";
import { getVisibleRuntimeMenu } from "@/lib/product/runtime-navigation";
import { useTenantStore } from "@/stores/tenant-store";
import { getTenantColumns } from "../../tenants/columns";
import { TenantDialog, type TenantFormValues } from "../../tenants/tenant-dialog";
import {
  TenantOnboardingResultDialog,
  type TenantOnboardingResult,
} from "../../tenants/tenant-onboarding-result-dialog";
import { TenantLogoDialog } from "./tenant-logo-dialog";

export function TenantsTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const setCompany = useTenantStore((state) => state.setCompany);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [brandingTenant, setBrandingTenant] = useState<Tenant | null>(null);
  const [brandingDialogOpen, setBrandingDialogOpen] = useState(false);
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<TenantOnboardingResult | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(currentCompany?.id ?? null);

  const canCreateTenant = canAny("tenants.create", "tenants:create:all");
  const canEditTenant = canAny("tenants.update", "tenants:update:all");
  const canToggleTenant = canEditTenant;
  const canUploadBranding = canEditTenant;

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => listTenants(),
  });

  const { data: stats } = useQuery({
    queryKey: ["tenants", "stats"],
    queryFn: getTenantStats,
  });

  const createMutation = useMutation({
    mutationFn: (data: TenantFormValues) => createTenantOperationally(data),
    onSuccess: ({ tenant, result }) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenants", "stats"] });
      setDialogOpen(false);
      setSelectedTenantId(tenant.id);
      setOnboardingResult(result);
      setOnboardingDialogOpen(true);
      const onboardingMeta = getOnboardingStatusMeta(result.status);
      toast.success(`Empresa creada: ${onboardingMeta.label}`);
      if (currentCompany && currentCompany.id === tenant.id) {
        syncActiveCompany(currentCompany, tenant, setCompany);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ tenant, data }: { tenant: Tenant; data: TenantFormValues }) =>
      updateTenantOperationally(tenant, data),
    onSuccess: ({ tenant, result }) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenants", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      syncActiveCompany(currentCompany, tenant, setCompany);
      setDialogOpen(false);
      setEditingTenant(null);
      setSelectedTenantId(tenant.id);
      if (result) {
        setOnboardingResult(result);
        setOnboardingDialogOpen(true);
        const onboardingMeta = getOnboardingStatusMeta(result.status);
        toast.success(`Empresa actualizada: ${onboardingMeta.label}`);
        return;
      }

      toast.success("Empresa actualizada");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (tenant: Tenant) =>
      tenant.is_active ? deactivateTenant(tenant.id) : activateTenant(tenant.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenants", "stats"] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al cambiar estado"),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadTenantLogo(id, file),
    onSuccess: (tenant) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      syncActiveCompany(currentCompany, tenant, setCompany);
      setBrandingDialogOpen(false);
      setBrandingTenant(null);
      toast.success("Logo actualizado");
    },
    onError: () => toast.error("Error al subir logo"),
  });

  const columns = useMemo(
    () =>
      getTenantColumns(
        {
          onEdit: (tenant) => {
            setEditingTenant(tenant);
            setDialogOpen(true);
          },
          onToggleActive: (tenant) => toggleActiveMutation.mutate(tenant),
          onUploadLogo: (tenant) => {
            setBrandingTenant(tenant);
            setBrandingDialogOpen(true);
          },
        },
        {
          canEdit: canEditTenant,
          canToggleActive: canToggleTenant,
          canUploadLogo: canUploadBranding,
        },
      ),
    [canEditTenant, canToggleTenant, canUploadBranding, toggleActiveMutation],
  );
  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? tenants[0] ?? null,
    [selectedTenantId, tenants],
  );
  const selectedProfile = parseTenantProductProfile(selectedTenant);
  const selectedReadiness = getTenantReadinessMeta({
    companyId: selectedTenant?.id,
    productProfile: selectedProfile,
  });
  const selectedPackagePreset = COMMERCIAL_PLAN_PRESETS[selectedProfile.packageProfile];
  const selectedRuntimeMenu = getVisibleRuntimeMenu({
    enabledServices: selectedProfile.enabledServices,
    hasRoleContext: true,
    ignorePermissions: true,
  });
  const selectedRuntimeLinks = selectedRuntimeMenu.reduce((total, section) => total + section.items.length, 0);
  const selectedRuntimeServices = selectedProfile.enabledServices.filter((serviceCode) =>
    RUNTIME_VISIBLE_SERVICE_CODES.includes(serviceCode),
  );
  const selectedNextStepCta = selectedReadiness.isReady
    ? "Validar login tenant en /login"
    : selectedProfile.onboarding.adminEmail
      ? "Corregir bootstrap del admin"
      : "Completar admin inicial";

  useEffect(() => {
    if (!tenants.length) return;

    if (selectedTenantId && tenants.some((tenant) => tenant.id === selectedTenantId)) {
      return;
    }

    setSelectedTenantId(currentCompany?.id ?? tenants[0].id);
  }, [currentCompany?.id, selectedTenantId, tenants]);

  async function handleSubmit(data: TenantFormValues) {
    if (editingTenant) {
      await updateMutation.mutateAsync({ tenant: editingTenant, data });
      return;
    }

    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      toast.error(await getApiErrorMessage(error, "Error al crear empresa"));
    }
  }

  return (
    <div className="space-y-6">
      <ScopeCallout
        badge="Plataforma"
        accent="platform"
        title="Empresas operadoras, onboarding y branding"
        description="Aqui se administra el plano global multi-tenant: altas, cupos, branding corporativo, servicios habilitados y el bootstrap del admin inicial cuando se quiere dejar al tenant operable desde el alta."
        footer={
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Badge variant="outline">{tenants.length} empresas detectadas</Badge>
            {currentCompany ? <Badge variant="secondary">Tenant activo actual: {currentCompany.name}</Badge> : null}
            <Badge variant="outline">C6.1 + C6.2 activos</Badge>
          </div>
        }
      />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Empresas del sistema</h3>
          <p className="text-sm text-muted-foreground">
            Gestion global de organizaciones operadoras, sus servicios reales y su estado de onboarding.
          </p>
        </div>
        {canCreateTenant ? (
          <Button
            onClick={() => {
              setEditingTenant(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva empresa
          </Button>
        ) : null}
      </div>

      {stats ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard title="Total empresas" value={stats.total_tenants} icon={Building2} color="blue" />
          <StatsCard title="Activas" value={stats.active_tenants} icon={CheckCircle} color="green" />
          <StatsCard
            title="Inactivas"
            value={stats.total_tenants - stats.active_tenants}
            icon={Building2}
            color="red"
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Empresas operadoras</CardTitle>
            <CardDescription>
              Selecciona una empresa para ver de forma visible su paquete, su admin inicial y el portal que recibira.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenants.map((tenant) => {
              const tenantProfile = parseTenantProductProfile(tenant);
              const tenantReadiness = getTenantReadinessMeta({
                companyId: tenant.id,
                productProfile: tenantProfile,
              });
              const isSelected = tenant.id === selectedTenant?.id;

              return (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => setSelectedTenantId(tenant.id)}
                  className={`w-full rounded-3xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-blue-300 bg-blue-50 shadow-sm dark:border-blue-800 dark:bg-blue-950/20"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {tenant.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tenant.logo_url}
                        alt={tenant.name}
                        className="h-12 w-12 rounded-2xl border object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold text-white"
                        style={{ backgroundColor: tenant.primary_color ?? "#1976D2" }}
                      >
                        {tenant.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{tenant.name}</p>
                        <Badge variant={tenantReadiness.tone}>{tenantReadiness.label}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tenant.slug}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">Plan {tenantProfile.packageProfile}</Badge>
                        <Badge variant="secondary">{tenantProfile.enabledServices.length} servicios</Badge>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{tenantReadiness.evidenceLabel}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
            <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-blue-50/80 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950/20">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-slate-900 text-white hover:bg-slate-900">Workspace visible</Badge>
                    <Badge variant="outline">Empresa operable</Badge>
                    {selectedTenant ? <Badge variant="secondary">{selectedTenant.name}</Badge> : null}
                    <Badge variant={selectedReadiness.tone}>{selectedReadiness.label}</Badge>
                  </div>
                  <div>
                    <CardTitle className="text-xl">Consola de onboarding visible de empresa</CardTitle>
                    <CardDescription className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                      Esta vista ya no trata a la empresa como una fila. La empresa seleccionada se prepara aqui con branding, paquete, modulos habilitados, admin inicial, evidencia de login y siguiente paso operativo.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canEditTenant && selectedTenant ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingTenant(selectedTenant);
                        setDialogOpen(true);
                      }}
                    >
                      Editar empresa
                    </Button>
                  ) : null}
                  {canUploadBranding && selectedTenant ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBrandingTenant(selectedTenant);
                        setBrandingDialogOpen(true);
                      }}
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      Branding
                    </Button>
                  ) : null}
                  {selectedTenant ? (
                    <Button
                      onClick={() => window.open("/login", "_blank", "noopener,noreferrer")}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      {selectedNextStepCta}
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-5">
              <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="flex items-start gap-4">
                    {selectedTenant?.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedTenant.logo_url}
                        alt={selectedTenant.name}
                        className="h-20 w-20 rounded-3xl border border-slate-200 object-cover shadow-sm dark:border-slate-700"
                      />
                    ) : (
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-3xl text-2xl font-bold text-white shadow-sm"
                        style={{ backgroundColor: selectedTenant?.primary_color ?? "#1976D2" }}
                      >
                        {selectedTenant?.name.slice(0, 1).toUpperCase() ?? "E"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-xl font-semibold text-slate-900 dark:text-slate-100">
                          {selectedTenant?.name ?? "Empresa sin seleccionar"}
                        </h3>
                        <Badge variant={selectedTenant?.is_active ? "default" : "secondary"}>
                          {selectedTenant?.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                        {currentCompany?.id === selectedTenant?.id ? (
                          <Badge variant="outline">Tenant activo actual</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {selectedTenant?.domain || "Sin dominio corporativo definido"}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="outline">{selectedTenant?.slug ?? "sin-slug"}</Badge>
                        <Badge variant="secondary">{selectedPackagePreset.label}</Badge>
                        <Badge variant="secondary">{selectedRuntimeLinks} items visibles en sidebar</Badge>
                        <Badge variant="outline">
                          {selectedProfile.source === "explicit" ? "Asignacion explicita" : "Visibilidad legacy heredada"}
                        </Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[selectedTenant?.primary_color, selectedTenant?.secondary_color, selectedTenant?.tertiary_color]
                          .filter(Boolean)
                          .map((color, index) => (
                            <div
                              key={`${selectedTenant?.id ?? "tenant"}-hero-color-${index}`}
                              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                            >
                              <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: color }} />
                              {color}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Admin inicial</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Bootstrap real del tenant</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <p>Nombre: <span className="font-medium text-slate-900 dark:text-slate-100">{selectedProfile.onboarding.adminName ?? "Pendiente"}</span></p>
                      <p>Email: <span className="font-medium text-slate-900 dark:text-slate-100">{selectedProfile.onboarding.adminEmail ?? "Pendiente"}</span></p>
                      <p>Rol esperado: <span className="font-medium text-slate-900 dark:text-slate-100">{selectedProfile.onboarding.roleName ?? "tenant_admin pendiente"}</span></p>
                      <p>Estado bootstrap: <span className="font-medium text-slate-900 dark:text-slate-100">{selectedReadiness.label}</span></p>
                      <p>Evidencia: <span className="font-medium text-slate-900 dark:text-slate-100">{selectedReadiness.evidenceLabel}</span></p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                        <BadgeCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Readiness de login</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Estado brutalmente honesto</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <Badge variant={selectedReadiness.tone}>{selectedReadiness.label}</Badge>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{selectedReadiness.description}</p>
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                        <p className="font-medium text-slate-900 dark:text-slate-100">Siguiente CTA</p>
                        <p className="mt-1">{selectedNextStepCta}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <HighlightCard
                  icon={Sparkles}
                  title="Paquete y modulos"
                  description="No es adorno comercial: aqui se ve exactamente que esta habilitado."
                  lines={[
                    `Paquete activo: ${selectedPackagePreset.label}`,
                    `Servicios asignados: ${selectedProfile.enabledServices.length}`,
                    `Dominios runtime visibles: ${selectedRuntimeServices.length}`,
                  ]}
                  badges={[
                    selectedPackagePreset.label,
                    ...selectedProfile.enabledServices.map((serviceCode) => PRODUCT_SERVICE_DEFINITIONS[serviceCode].label),
                  ]}
                />
                <HighlightCard
                  icon={Palette}
                  title="Branding basico"
                  description="La empresa ya muestra identidad visual propia dentro del producto."
                  lines={[
                    `Dominio: ${selectedTenant?.domain ?? "sin dominio"}`,
                    `Logo: ${selectedTenant?.logo_url ? "cargado" : "pendiente"}`,
                    `Tema base: ${selectedTenant?.primary_color ? "colores definidos" : "colores por defecto"}`,
                  ]}
                  badges={[
                    selectedTenant?.primary_color ?? "Sin primario",
                    selectedTenant?.secondary_color ?? "Sin secundario",
                    selectedTenant?.tertiary_color ?? "Sin terciario",
                  ]}
                />
                <HighlightCard
                  icon={LayoutPanelLeft}
                  title="Preview del menu real"
                  description="Este preview responde al runtime verdadero del sidebar, no a una maqueta separada."
                  lines={[
                    `${selectedRuntimeMenu.length} secciones visibles en sidebar`,
                    `${selectedRuntimeLinks} entradas reales para esta empresa`,
                    selectedProfile.source === "explicit"
                      ? "Los modulos quedaron guardados explicitamente en settings del tenant."
                      : "La empresa sigue heredando visibilidad legacy; hace falta guardar la asignacion explicita.",
                  ]}
                  badges={selectedRuntimeMenu.map((section) => `${section.label} (${section.items.length})`)}
                />
              </div>

              {selectedReadiness.issues.length ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
                  <p className="font-semibold">Bloqueos o degradaciones activas</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5">
                    {selectedReadiness.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Paquetes, servicios y modulos visibles</CardTitle>
                <CardDescription>
                  La empresa seleccionada muestra exactamente que paquete tiene, que servicios estan habilitados y en que estado se encuentra cada modulo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedPackagePreset.label}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedPackagePreset.description}</p>
                  <div className="mt-3">
                    <ServiceBadges services={selectedProfile.enabledServices} />
                  </div>
                </div>

                <div className="grid gap-3">
                  {selectedProfile.enabledServices.map((serviceCode) => {
                    const service = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
                    const statusMeta = getServiceStatusMeta(service.status);
                    const runtimeSection = selectedRuntimeMenu.find((section) => section.service === service.code);

                    return (
                      <div
                        key={`${selectedTenant?.id ?? "tenant"}-${service.code}`}
                        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{service.label}</p>
                              <Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>
                              {selectedPackagePreset.suggestedServices.includes(serviceCode as AssignableServiceCode) ? (
                                <Badge variant="outline">Incluido por {selectedPackagePreset.label}</Badge>
                              ) : (
                                <Badge variant="secondary">Agregado manualmente</Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{service.description}</p>
                          </div>
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                            {runtimeSection ? `${runtimeSection.items.length} entradas reales en sidebar` : "Sin seccion lateral propia"}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {service.modules.map((moduleName) => (
                            <Badge key={`${service.code}-${moduleName}`} variant="secondary">
                              {moduleName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Runtime y siguiente paso</CardTitle>
                <CardDescription>
                  Esta columna enlaza la empresa operable con el menu real y con el siguiente checkpoint hacia sucursales e infraestructura.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Menu que vera la empresa</p>
                  <div className="mt-3 space-y-3">
                    {selectedRuntimeMenu.map((section) => (
                      <div
                        key={`${selectedTenant?.id ?? "tenant"}-${section.id}`}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{section.label}</p>
                          <Badge variant="outline">{section.items.length} items</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {section.items.map((item) => (
                            <Badge key={`${section.id}-${item.id}`} variant="secondary">
                              {item.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Transicion al siguiente checkpoint</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Una vez que esta empresa quede realmente lista para iniciar sesion, el siguiente paso visible sera llevarla a <strong>Clientes / Sucursales</strong> para luego entrar a <strong>Acceder a infraestructura</strong>.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open("/login", "_blank", "noopener,noreferrer")}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Probar login real
                    </Button>
                    <Button variant="outline" disabled>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Sucursales e infraestructura (siguiente)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <TenantPortalPreview
              tenant={selectedTenant}
              title="Lo que vera la empresa al iniciar sesion"
              description="Preview visible del branding, del menu y del recorrido de login para el tenant seleccionado."
            />

            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Flujo exacto y verificable</CardTitle>
                <CardDescription>
                  Secuencia visible que conecta el alta de empresa con el portal tenant real.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProductStep
                  step="1"
                  title="Alta y branding"
                  description={`La empresa ${selectedTenant?.name ?? "seleccionada"} se crea aqui mismo, con identidad visual, cupos y dominio visibles.`}
                />
                <ProductStep
                  step="2"
                  title="Paquete y servicios habilitados"
                  description={`Hoy la empresa tiene ${selectedProfile.enabledServices.length} servicios visibles y ${selectedRuntimeLinks} entradas reales de menu.`}
                />
                <ProductStep
                  step="3"
                  title="Admin inicial"
                  description={`El bootstrap actual apunta a ${selectedProfile.onboarding.adminEmail ?? "un admin aun pendiente"} con evidencia ${selectedReadiness.evidenceLabel.toLowerCase()}.`}
                />
                <ProductStep
                  step="4"
                  title="Readiness de login"
                  description={selectedReadiness.description}
                />
                <ProductStep
                  step="5"
                  title="Siguiente paso del producto"
                  description="Despues de este checkpoint, la empresa pasara a Clientes / Sucursales para entrar a infraestructura por sitio activo."
                  last
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tenants}
        searchKey="name"
        searchPlaceholder="Buscar empresa..."
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Building2}
            title="No hay empresas registradas"
            description="Registra la primera empresa operadora para comenzar."
            action={
              canCreateTenant
                ? {
                    label: "Nueva empresa",
                    onClick: () => {
                      setEditingTenant(null);
                      setDialogOpen(true);
                    },
                  }
                : undefined
            }
          />
        }
      />

      <TenantDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTenant(null);
        }}
        tenant={editingTenant}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <TenantLogoDialog
        open={brandingDialogOpen}
        onOpenChange={(open) => {
          setBrandingDialogOpen(open);
          if (!open) setBrandingTenant(null);
        }}
        tenant={brandingTenant}
        onSubmit={async (file) => {
          if (!brandingTenant) return;
          await uploadLogoMutation.mutateAsync({ id: brandingTenant.id, file });
        }}
        isSubmitting={uploadLogoMutation.isPending}
      />

      <TenantOnboardingResultDialog
        open={onboardingDialogOpen}
        onOpenChange={setOnboardingDialogOpen}
        result={onboardingResult}
      />
    </div>
  );
}

function HighlightCard({
  icon: Icon,
  title,
  description,
  lines,
  badges,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  lines: string[];
  badges: string[];
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-950">
          <Icon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {lines.map((line) => (
          <li key={`${title}-${line}`} className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {badges.filter(Boolean).slice(0, 5).map((badge) => (
          <Badge key={`${title}-${badge}`} variant="secondary">
            {badge}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ProductStep({
  step,
  title,
  description,
  last = false,
}: {
  step: string;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
          {step}
        </div>
        {!last ? <div className="mt-2 h-full w-px bg-slate-200 dark:bg-slate-800" /> : null}
      </div>
      <div className="pb-4">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      </div>
    </div>
  );
}

async function createTenantOperationally(data: TenantFormValues): Promise<{
  tenant: Tenant;
  result: TenantOnboardingResult;
}> {
  const packageProfile = data.subscription_plan as CommercialPlanCode;
  const enabledServices = data.enabled_services as AssignableServiceCode[];
  const initialSnapshot = buildPendingOnboardingSnapshot(
    data,
    data.create_initial_admin
      ? "Tenant creado. Pendiente confirmar bootstrap final del admin."
      : "Tenant creado sin bootstrap de admin inicial.",
  );

  const tenant = await createTenant(
    mapTenantFormToPayload(data, {
      onboarding: initialSnapshot,
    }),
  );

  const { snapshot: onboardingSnapshot, warnings } = data.create_initial_admin
    ? await bootstrapTenantAdmin(tenant.id, data)
    : {
        snapshot: initialSnapshot,
        warnings: ["El tenant se creo sin admin inicial. Para dejarlo operable hace falta bootstrapear un usuario con rol."],
      };

  let updatedTenant = tenant;
  try {
    updatedTenant = await updateTenant(
      tenant.id,
      mapTenantFormToPayload(data, {
        existingSettings: tenant.settings,
        onboarding: onboardingSnapshot,
      }),
    );
  } catch (error) {
    warnings.push(await getApiErrorMessage(error, "No se pudo persistir el snapshot final de onboarding en settings del tenant."));
  }

  return {
    tenant: updatedTenant,
    result: buildTenantOnboardingResult(updatedTenant, data, onboardingSnapshot, warnings),
  };
}

async function updateTenantOperationally(
  tenant: Tenant,
  data: TenantFormValues,
): Promise<{
  tenant: Tenant;
  result?: TenantOnboardingResult;
}> {
  const tenantProfile = parseTenantProductProfile(tenant);
  const baseTenant = await updateTenant(
    tenant.id,
    mapTenantFormToPayload(data, {
      existingSettings: tenant.settings,
    }),
  );

  if (!data.create_initial_admin) {
    return { tenant: baseTenant };
  }

  if (tenantProfile.onboarding.status === "ready") {
    return {
      tenant: baseTenant,
      result: buildTenantOnboardingResult(baseTenant, data, tenantProfile.onboarding, [
        "El tenant ya tenia onboarding listo. No se ejecuto un bootstrap adicional de admin.",
      ]),
    };
  }

  const { snapshot, warnings } = await bootstrapTenantAdmin(baseTenant.id, data);

  let updatedTenant = baseTenant;
  try {
    updatedTenant = await updateTenant(
      baseTenant.id,
      mapTenantFormToPayload(data, {
        existingSettings: baseTenant.settings,
        onboarding: snapshot,
      }),
    );
  } catch (error) {
    warnings.push(await getApiErrorMessage(error, "No se pudo persistir el snapshot final de onboarding en settings del tenant."));
  }

  return {
    tenant: updatedTenant,
    result: buildTenantOnboardingResult(updatedTenant, data, snapshot, warnings),
  };
}

async function bootstrapTenantAdmin(
  tenantId: string,
  data: TenantFormValues,
): Promise<{
  snapshot: TenantOnboardingSnapshot;
  warnings: string[];
}> {
  const warnings: string[] = [];

  try {
    const createdUser = await registerTenantUser({
      tenant_id: tenantId,
      email: data.admin_email?.trim() ?? "",
      password: data.admin_password?.trim() ?? "",
      first_name: data.admin_first_name?.trim() ?? "",
      last_name: data.admin_last_name?.trim() ?? "",
      phone: data.admin_phone?.trim() || undefined,
    });
    const createdUserTenantId = createdUser.tenant_id?.trim() || undefined;

    if (createdUserTenantId && createdUserTenantId !== tenantId) {
      warnings.push("El backend devolvio un tenant_id distinto al esperado para el admin inicial. No se marcara el tenant como listo.");
    }

    try {
      const roles = await listRoles();
      const tenantAdminRole = roles.find((role) => role.name === "tenant_admin");

      if (!tenantAdminRole) {
        warnings.push("Se creo el admin inicial, pero no se encontro el rol `tenant_admin` para asignarlo automaticamente.");
        return {
          snapshot: {
            status: "admin_created_pending_role",
            adminEmail: createdUser.email,
            adminName: `${createdUser.first_name} ${createdUser.last_name}`.trim(),
            adminUserId: createdUser.id,
            tenantId: createdUserTenantId,
            notes: "El usuario inicial se creo, pero no se encontro el rol tenant_admin en el contexto actual.",
            verificationSource: "bootstrap",
            verifiedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          warnings,
        };
      }

      await assignRole(createdUser.id, tenantAdminRole.id);
      return {
        snapshot: {
          status: "ready",
          adminEmail: createdUser.email,
          adminName: `${createdUser.first_name} ${createdUser.last_name}`.trim(),
          adminUserId: createdUser.id,
          tenantId: createdUserTenantId,
          roleId: tenantAdminRole.id,
          roleName: tenantAdminRole.name,
          verificationSource: "bootstrap",
          verifiedAt: new Date().toISOString(),
          notes: "Tenant listo para iniciar sesion con admin inicial y servicios habilitados.",
          updatedAt: new Date().toISOString(),
        },
        warnings,
      };
    } catch (error) {
      warnings.push(await getApiErrorMessage(error, "El admin inicial se creo, pero no se pudo asignar el rol `tenant_admin`."));
      return {
        snapshot: {
          status: "admin_created_pending_role",
          adminEmail: createdUser.email,
          adminName: `${createdUser.first_name} ${createdUser.last_name}`.trim(),
          adminUserId: createdUser.id,
          tenantId: createdUserTenantId,
          verificationSource: "bootstrap",
          verifiedAt: new Date().toISOString(),
          notes: "El usuario inicial se creo, pero la asignacion de rol quedo pendiente.",
          updatedAt: new Date().toISOString(),
        },
        warnings,
      };
    }
  } catch (error) {
    warnings.push(await getApiErrorMessage(error, "El tenant se creo, pero no se pudo registrar el admin inicial."));
      return {
        snapshot: {
          status: "admin_creation_failed",
          adminEmail: data.admin_email?.trim() || undefined,
          adminName: [data.admin_first_name, data.admin_last_name].filter(Boolean).join(" ").trim() || undefined,
          tenantId,
          verificationSource: "bootstrap",
          notes: "El tenant se creo, pero el admin inicial no pudo registrarse.",
          updatedAt: new Date().toISOString(),
        },
        warnings,
      };
  }
}

function buildPendingOnboardingSnapshot(
  data: TenantFormValues,
  notes: string,
): TenantOnboardingSnapshot {
  return {
    status: "tenant_created_only",
    adminEmail: data.admin_email?.trim() || undefined,
    adminName: [data.admin_first_name, data.admin_last_name].filter(Boolean).join(" ").trim() || undefined,
    roleName: data.create_initial_admin ? "tenant_admin" : undefined,
    notes,
    updatedAt: new Date().toISOString(),
  };
}

function buildTenantOnboardingResult(
  tenant: Tenant,
  data: TenantFormValues,
  onboarding: TenantOnboardingSnapshot,
  warnings: string[],
): TenantOnboardingResult {
  const productProfile = parseTenantProductProfile({
    ...tenant,
    subscription_plan: data.subscription_plan,
    settings: buildTenantSettings({
      existingSettings: tenant.settings,
      packageProfile: data.subscription_plan as CommercialPlanCode,
      enabledServices: data.enabled_services as AssignableServiceCode[],
      onboarding,
    }),
  });
  const readiness = getTenantReadinessMeta({
    companyId: tenant.id,
    productProfile,
  });

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    packageProfile: data.subscription_plan as CommercialPlanCode,
    enabledServices: data.enabled_services as AssignableServiceCode[],
    adminName: onboarding.adminName,
    adminEmail: onboarding.adminEmail,
    adminUserId: onboarding.adminUserId,
    roleId: onboarding.roleId,
    roleName: onboarding.roleName,
    tenantBindingId: onboarding.tenantId,
    verificationSource: onboarding.verificationSource,
    verifiedAt: onboarding.verifiedAt,
    status: onboarding.status,
    readinessLabel: readiness.label,
    readinessTone: readiness.tone,
    evidenceLabel: readiness.evidenceLabel,
    warnings: [...new Set([...warnings, ...readiness.issues])],
  };
}

function mapTenantFormToPayload(
  data: TenantFormValues,
  options?: {
    existingSettings?: Record<string, unknown> | null;
    onboarding?: TenantOnboardingSnapshot;
  },
) {
  return {
    name: data.name,
    slug: data.slug,
    domain: data.domain?.trim() || undefined,
    primary_color: data.primary_color?.trim() || undefined,
    secondary_color: data.secondary_color?.trim() || undefined,
    tertiary_color: data.tertiary_color?.trim() || undefined,
    subscription_plan: data.subscription_plan,
    max_users: data.max_users,
    max_clients: data.max_clients,
    settings: buildTenantSettings({
      existingSettings: options?.existingSettings,
      packageProfile: data.subscription_plan as CommercialPlanCode,
      enabledServices: data.enabled_services as AssignableServiceCode[],
      onboarding: options?.onboarding,
    }),
  };
}

function syncActiveCompany(
  currentCompany: Company | null,
  tenant: Tenant,
  setCompany: (company: Company) => void,
) {
  if (!currentCompany || currentCompany.id !== tenant.id) return;

  setCompany({
    ...currentCompany,
    name: tenant.name,
    slug: tenant.slug,
    domain: tenant.domain,
    logo_url: tenant.logo_url ?? currentCompany.logo_url,
    primary_color: tenant.primary_color ?? currentCompany.primary_color,
    secondary_color: tenant.secondary_color ?? currentCompany.secondary_color,
    tertiary_color: tenant.tertiary_color ?? currentCompany.tertiary_color,
    is_active: tenant.is_active,
    settings: tenant.settings,
    subscription_plan: tenant.subscription_plan,
    max_users: tenant.max_users,
    max_clients: tenant.max_clients,
  });
}
