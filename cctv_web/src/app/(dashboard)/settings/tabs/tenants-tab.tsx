"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle,
  KeyRound,
  Palette,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { Company, Tenant } from "@/types/api";
import { ServiceBadges } from "@/components/product/service-badges";
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
  getTenantReadinessMeta,
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Empresas</h3>
          <p className="text-sm text-muted-foreground">
            Gestion de organizaciones, servicios habilitados y estado de onboarding.
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

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">
                  {selectedTenant?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedTenant.logo_url}
                      alt={selectedTenant.name}
                      className="h-14 w-14 rounded-2xl border object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
                      style={{ backgroundColor: selectedTenant?.primary_color ?? "#1976D2" }}
                    >
                      {selectedTenant?.name.slice(0, 1).toUpperCase() ?? "E"}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{selectedTenant?.name ?? "Sin seleccionar"}</h3>
                      <Badge variant={selectedTenant?.is_active ? "default" : "secondary"}>
                        {selectedTenant?.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                      <Badge variant={selectedReadiness.tone}>{selectedReadiness.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedTenant?.slug} · {selectedTenant?.domain || "Sin dominio"}
                    </p>
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
                      Editar
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-medium">Plan y servicios</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{selectedPackagePreset.label}</Badge>
                    <Badge variant="secondary">{selectedProfile.enabledServices.length} servicios</Badge>
                    <Badge variant="outline">
                      {selectedProfile.source === "explicit" ? "Asignacion explicita" : "Herencia legacy"}
                    </Badge>
                  </div>
                  <ServiceBadges services={selectedProfile.enabledServices} />
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Admin inicial</p>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{selectedProfile.onboarding.adminName ?? "Pendiente"}</p>
                    <p>{selectedProfile.onboarding.adminEmail ?? "Sin email"}</p>
                    <p>Rol: {selectedProfile.onboarding.roleName ?? "Pendiente"}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Branding</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[selectedTenant?.primary_color, selectedTenant?.secondary_color, selectedTenant?.tertiary_color]
                      .filter(Boolean)
                      .map((color, index) => (
                        <div
                          key={`color-${index}`}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: color }} />
                          {color}
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Logo: {selectedTenant?.logo_url ? "cargado" : "pendiente"}
                  </p>
                </div>
              </div>

              {selectedReadiness.issues.length ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
                  <p className="font-medium">Bloqueos activos</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {selectedReadiness.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
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
