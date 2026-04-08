"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Building2, CheckCircle, Palette, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Company, Tenant } from "@/types/api";
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
  getOnboardingStatusMeta,
  parseTenantProductProfile,
  type AssignableServiceCode,
  type CommercialPlanCode,
  type TenantOnboardingSnapshot,
} from "@/lib/product/service-catalog";
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
  const selectedOnboardingMeta = getOnboardingStatusMeta(selectedProfile.onboarding.status);

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
              const tenantOnboardingMeta = getOnboardingStatusMeta(tenantProfile.onboarding.status);
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
                        <Badge variant={tenantOnboardingMeta.tone}>{tenantOnboardingMeta.label}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tenant.slug}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">Plan {tenantProfile.packageProfile}</Badge>
                        <Badge variant="secondary">{tenantProfile.enabledServices.length} servicios</Badge>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/70 dark:from-slate-900 dark:to-blue-950/20">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-slate-900 text-white hover:bg-slate-900">Checkpoint visible</Badge>
                    <Badge variant="outline">Empresa operable</Badge>
                    {selectedTenant ? <Badge variant="secondary">{selectedTenant.name}</Badge> : null}
                  </div>
                  <CardTitle className="mt-3 text-xl">Configuracion visible de tenant operable</CardTitle>
                  <CardDescription className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                    Esta vista responde de forma directa a la pregunta de producto: que se le asigno a la empresa, con que admin inicial entrara, que branding tendra y que menu vera cuando inicie sesion.
                  </CardDescription>
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
                      Editar configuracion
                    </Button>
                  ) : null}
                  {canUploadBranding && selectedTenant ? (
                    <Button
                      onClick={() => {
                        setBrandingTenant(selectedTenant);
                        setBrandingDialogOpen(true);
                      }}
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      Logo y branding
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 lg:grid-cols-3">
              <HighlightCard
                icon={Sparkles}
                title="Paquete y modulos"
                description="Definicion visible del producto contratado por esta empresa."
                lines={[
                  `Plan comercial: ${selectedProfile.packageProfile}`,
                  `Servicios habilitados: ${selectedProfile.enabledServices.length}`,
                  `Modulos runtime: ${selectedProfile.enabledServices.filter((serviceCode) => ["cctv", "access_control", "networking"].includes(serviceCode)).length}`,
                ]}
                badges={selectedProfile.enabledServices.map((serviceCode) => serviceCode.replace("_", " "))}
              />
              <HighlightCard
                icon={ShieldCheck}
                title="Admin inicial"
                description="Usuario con el que la empresa queda lista para iniciar sesion."
                lines={[
                  `Email: ${selectedProfile.onboarding.adminEmail ?? "pendiente de definir"}`,
                  `Rol: ${selectedProfile.onboarding.roleName ?? "tenant_admin pendiente"}`,
                  `Estado: ${selectedOnboardingMeta.label}`,
                ]}
                badges={[selectedOnboardingMeta.label]}
              />
              <HighlightCard
                icon={BadgeCheck}
                title="Resultado visible"
                description="Lo que debe sentir la empresa al entrar al producto."
                lines={[
                  "Logo y colores propios",
                  "Sidebar segun modulos habilitados",
                  "Roles internos solo del tenant activo",
                ]}
                badges={["Portal tenant", "Menu por empresa"]}
              />
            </CardContent>
          </Card>

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
                  Secuencia visible que conecta backoffice global con portal tenant para esta empresa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProductStep
                  step="1"
                  title="Alta y branding"
                  description={`La empresa ${selectedTenant?.name ?? "seleccionada"} se crea en esta misma seccion y aqui mismo se le puede cargar logo, cupos y colores.`}
                />
                <ProductStep
                  step="2"
                  title="Servicios y modulos"
                  description="La asignacion real del runtime depende del paquete comercial y de los servicios habilitados visibles para ese tenant."
                />
                <ProductStep
                  step="3"
                  title="Bootstrap del admin inicial"
                  description={`El snapshot actual registra como admin inicial a ${selectedProfile.onboarding.adminEmail ?? "un usuario aun pendiente"} y su estado de onboarding.`}
                />
                <ProductStep
                  step="4"
                  title="Login del tenant"
                  description="Ese usuario entra por /login y, si pertenece a multiples empresas, selecciona explicitamente la empresa antes de caer en su portal."
                />
                <ProductStep
                  step="5"
                  title="Portal y roles internos"
                  description="Al entrar, la empresa ya ve logo, colores, sidebar y modulos segun su configuracion; sus roles internos se administran en las tabs tenant."
                  last
                />
                {selectedTenant ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Empresa seleccionada</p>
                    <p className="mt-2">
                      {selectedTenant.name} ya queda narrada como producto visible, no como fila decorativa de tabla.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">{selectedTenant.slug}</Badge>
                      <Badge variant="secondary">{selectedOnboardingMeta.label}</Badge>
                    </div>
                  </div>
                ) : null}
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
    result: {
      tenantName: updatedTenant.name,
      tenantSlug: updatedTenant.slug,
      packageProfile,
      enabledServices,
      adminEmail: onboardingSnapshot.adminEmail,
      roleName: onboardingSnapshot.roleName,
      status: onboardingSnapshot.status,
      warnings,
    },
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
      result: {
        tenantName: baseTenant.name,
        tenantSlug: baseTenant.slug,
        packageProfile: data.subscription_plan as CommercialPlanCode,
        enabledServices: data.enabled_services as AssignableServiceCode[],
        adminEmail: tenantProfile.onboarding.adminEmail,
        roleName: tenantProfile.onboarding.roleName,
        status: tenantProfile.onboarding.status,
        warnings: ["El tenant ya tenia onboarding listo. No se ejecuto un bootstrap adicional de admin."],
      },
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
    result: {
      tenantName: updatedTenant.name,
      tenantSlug: updatedTenant.slug,
      packageProfile: data.subscription_plan as CommercialPlanCode,
      enabledServices: data.enabled_services as AssignableServiceCode[],
      adminEmail: snapshot.adminEmail,
      roleName: snapshot.roleName,
      status: snapshot.status,
      warnings,
    },
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
            notes: "El usuario inicial se creo, pero no se encontro el rol tenant_admin en el contexto actual.",
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
          roleName: tenantAdminRole.name,
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
    notes,
    updatedAt: new Date().toISOString(),
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
