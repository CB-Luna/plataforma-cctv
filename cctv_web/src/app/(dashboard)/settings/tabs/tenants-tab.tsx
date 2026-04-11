"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { Company, Tenant } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        onLogoUpload={editingTenant ? async (file) => {
          await uploadLogoMutation.mutateAsync({ id: editingTenant.id, file });
        } : undefined}
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
        existingLogoUrl: tenant.logo_url,
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
      existingLogoUrl: tenant.logo_url,
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
        existingLogoUrl: baseTenant.logo_url,
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
    existingLogoUrl?: string | null;
  },
) {
  return {
    name: data.name,
    slug: data.slug,
    domain: data.domain?.trim() || undefined,
    logo_url: options?.existingLogoUrl || undefined,
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
