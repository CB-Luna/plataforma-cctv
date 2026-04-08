"use client";

import { type ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Tenant } from "@/types/api";
import { Checkbox } from "@/components/ui/checkbox";
import { TenantPortalPreview } from "@/components/settings/tenant-portal-preview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ASSIGNABLE_SERVICE_CODES,
  COMMERCIAL_PLAN_PRESETS,
  PRODUCT_SERVICE_DEFINITIONS,
  buildTenantSettings,
  getSuggestedServicesForPlan,
  getServiceStatusMeta,
  parseTenantProductProfile,
  type AssignableServiceCode,
  type CommercialPlanCode,
} from "@/lib/product/service-catalog";

const tenantSchema = z
  .object({
    name: z.string().min(2, "Minimo 2 caracteres"),
    slug: z.string().min(2, "Minimo 2 caracteres").regex(/^[a-z0-9-]+$/, "Solo minusculas, numeros y guiones"),
    domain: z.string().optional(),
    primary_color: z.string().optional(),
    secondary_color: z.string().optional(),
    tertiary_color: z.string().optional(),
    subscription_plan: z.enum(["basic", "professional", "enterprise"]),
    enabled_services: z
      .array(z.enum(["cctv", "storage", "intelligence", "access_control", "networking"]))
      .min(1, "Selecciona al menos un servicio habilitado"),
    max_users: z.number().int().positive(),
    max_clients: z.number().int().positive(),
    create_initial_admin: z.boolean(),
    admin_first_name: z.string().optional(),
    admin_last_name: z.string().optional(),
    admin_email: z.string().optional(),
    admin_password: z.string().optional(),
    admin_phone: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.create_initial_admin) return;

    if (!values.admin_first_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["admin_first_name"],
        message: "Nombre requerido",
      });
    }

    if (!values.admin_last_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["admin_last_name"],
        message: "Apellido requerido",
      });
    }

    if (!values.admin_email?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["admin_email"],
        message: "Email requerido",
      });
    } else if (!z.string().email().safeParse(values.admin_email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["admin_email"],
        message: "Email invalido",
      });
    }

    if (!values.admin_password?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["admin_password"],
        message: "Contrasena requerida",
      });
    } else if (values.admin_password.trim().length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["admin_password"],
        message: "Minimo 8 caracteres",
      });
    }
  });

export type TenantFormValues = z.infer<typeof tenantSchema>;

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null;
  onSubmit: (data: TenantFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

const assignableServices = ASSIGNABLE_SERVICE_CODES.map((code) => PRODUCT_SERVICE_DEFINITIONS[code]);

export function TenantDialog({
  open,
  onOpenChange,
  tenant,
  onSubmit,
  isSubmitting,
}: TenantDialogProps) {
  const isEdit = !!tenant;
  const tenantProfile = parseTenantProductProfile(tenant);
  const canRecoverOnboarding = isEdit && tenantProfile.onboarding.status !== "ready";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: buildDefaultValues(tenant, tenantProfile.packageProfile),
  });

  const subscriptionPlan = watch("subscription_plan");
  const createInitialAdmin = watch("create_initial_admin");
  const enabledServices = watch("enabled_services");
  const previewName = watch("name");
  const previewSlug = watch("slug");
  const previewPrimary = watch("primary_color");
  const previewSecondary = watch("secondary_color");
  const previewTertiary = watch("tertiary_color");
  const previewAdminEmail = watch("admin_email");
  const previewAdminFirstName = watch("admin_first_name");
  const previewAdminLastName = watch("admin_last_name");

  useEffect(() => {
    reset(buildDefaultValues(tenant, tenantProfile.packageProfile));
  }, [tenant, tenantProfile.packageProfile, reset, open]);

  useEffect(() => {
    if (isEdit) return;
    setValue("enabled_services", getSuggestedServicesForPlan(subscriptionPlan) as AssignableServiceCode[], {
      shouldDirty: true,
    });
  }, [isEdit, setValue, subscriptionPlan]);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      reset(buildDefaultValues(tenant, tenantProfile.packageProfile));
    }
    onOpenChange(value);
  };

  const previewTenant = {
    id: tenant?.id ?? "tenant-preview",
    name: previewName || "Nueva empresa",
    slug: previewSlug || "empresa-preview",
    domain: tenant?.domain ?? undefined,
    logo_url: tenant?.logo_url ?? null,
    primary_color: previewPrimary || "#1976D2",
    secondary_color: previewSecondary || "#424242",
    tertiary_color: previewTertiary || "#757575",
    is_active: tenant?.is_active ?? true,
    settings: buildTenantSettings({
      existingSettings: tenant?.settings,
      packageProfile: subscriptionPlan,
      enabledServices: enabledServices as AssignableServiceCode[],
      onboarding: createInitialAdmin
        ? {
            status: "ready" as const,
            adminEmail: previewAdminEmail?.trim() || undefined,
            adminName: [previewAdminFirstName, previewAdminLastName].filter(Boolean).join(" ").trim() || undefined,
            roleName: "tenant_admin",
            notes: "Preview visual del onboarding listo.",
            updatedAt: new Date().toISOString(),
          }
        : {
            status: "tenant_created_only" as const,
            adminEmail: previewAdminEmail?.trim() || undefined,
            adminName: [previewAdminFirstName, previewAdminLastName].filter(Boolean).join(" ").trim() || undefined,
            notes: "Preview visual del tenant sin admin inicial confirmado.",
            updatedAt: new Date().toISOString(),
          },
    }),
    subscription_plan: subscriptionPlan,
    max_users: watch("max_users"),
    max_clients: watch("max_clients"),
    created_at: tenant?.created_at ?? new Date().toISOString(),
    updated_at: tenant?.updated_at ?? new Date().toISOString(),
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tenant" : "Nuevo tenant operable"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza la empresa operadora, sus servicios habilitados y su perfil comercial."
              : "Crea la empresa, define los servicios realmente visibles y, si aplica, bootstrapea el admin inicial para dejarla lista para iniciar sesion."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Identidad base</h3>
              <p className="text-sm text-muted-foreground">
                Datos corporativos y branding inicial del tenant.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre *" error={errors.name?.message}>
                <Input id="name" {...register("name")} />
              </Field>
              <Field label="Slug *" error={errors.slug?.message}>
                <Input id="slug" {...register("slug")} disabled={isEdit} />
              </Field>
            </div>

            <Field label="Dominio" error={errors.domain?.message}>
              <Input id="domain" placeholder="empresa.ejemplo.com" {...register("domain")} />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <ColorField label="Color primario" valueField="primary_color" register={register} />
              <ColorField label="Secundario" valueField="secondary_color" register={register} />
              <ColorField label="Terciario" valueField="tertiary_color" register={register} />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">C6.2 Servicios y paquetes</h3>
              <p className="text-sm text-muted-foreground">
                El plan comercial es una referencia. La habilitacion real del runtime se define con los servicios de abajo y su estado operativo, parcial o WIP.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Plan comercial" error={errors.subscription_plan?.message}>
                <Select
                  value={subscriptionPlan}
                  onValueChange={(value) => setValue("subscription_plan", value as CommercialPlanCode, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(COMMERCIAL_PLAN_PRESETS).map((plan) => (
                      <SelectItem key={plan.code} value={plan.code}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Max. usuarios" error={errors.max_users?.message}>
                <Input id="max_users" type="number" {...register("max_users", { valueAsNumber: true })} />
              </Field>
              <Field label="Max. clientes" error={errors.max_clients?.message}>
                <Input id="max_clients" type="number" {...register("max_clients", { valueAsNumber: true })} />
              </Field>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950/40">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Sugerencia para {COMMERCIAL_PLAN_PRESETS[subscriptionPlan].label}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                {COMMERCIAL_PLAN_PRESETS[subscriptionPlan].description}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Servicios sugeridos: {COMMERCIAL_PLAN_PRESETS[subscriptionPlan].suggestedServices.map((service) => PRODUCT_SERVICE_DEFINITIONS[service].label).join(", ")}
              </p>
            </div>

            <div className="space-y-3">
              <Label>Servicios habilitados para este tenant *</Label>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {assignableServices.map((service) => {
                  const serviceCode = service.code as AssignableServiceCode;
                  const selected = enabledServices.includes(serviceCode);
                  const statusMeta = getServiceStatusMeta(service.status);

                  return (
                    <label
                      key={service.code}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${
                        selected
                          ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900/60"
                      }`}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() =>
                          setValue(
                            "enabled_services",
                            selected
                              ? enabledServices.filter((value) => value !== serviceCode)
                              : [...enabledServices, serviceCode],
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{service.label}</p>
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white dark:bg-slate-100 dark:text-slate-900">
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{service.description}</p>
                        {service.modules.length ? (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Superficie: {service.modules.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.enabled_services ? <p className="text-xs text-destructive">{errors.enabled_services.message}</p> : null}
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/70 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/50">
              <p className="font-medium text-slate-900 dark:text-slate-100">Regla vigente del producto</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Un modulo puede existir en estado operativo, parcial o WIP. Si el servicio queda habilitado para este tenant, el runtime puede mostrarlo aunque todavia este en construccion, siempre que ya exista su scaffold real en la web.
              </p>
            </div>
          </section>

          {!isEdit || canRecoverOnboarding ? (
            <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">C6.1 Onboarding tenant</h3>
                <p className="text-sm text-muted-foreground">
                  {isEdit
                    ? "Completa o recupera el bootstrap del admin inicial. Si lo ejecutas aqui, dejamos al tenant listo para iniciar sesion con rol `tenant_admin`."
                    : "Bootstrap opcional del admin inicial. Si lo completas ahora, dejamos al tenant listo para iniciar sesion con rol `tenant_admin`."}
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 dark:border-emerald-900/40 dark:bg-slate-950/50">
                <Checkbox
                  checked={createInitialAdmin}
                  onCheckedChange={(checked) => setValue("create_initial_admin", checked === true, { shouldDirty: true })}
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Crear admin inicial ahora</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Recomendado para dejar el tenant operable al terminar este flujo.
                  </p>
                </div>
              </label>

              {createInitialAdmin ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nombre admin *" error={errors.admin_first_name?.message}>
                    <Input {...register("admin_first_name")} />
                  </Field>
                  <Field label="Apellido admin *" error={errors.admin_last_name?.message}>
                    <Input {...register("admin_last_name")} />
                  </Field>
                  <Field label="Email admin *" error={errors.admin_email?.message}>
                    <Input type="email" {...register("admin_email")} />
                  </Field>
                  <Field label="Contrasena inicial *" error={errors.admin_password?.message}>
                    <Input type="password" {...register("admin_password")} />
                  </Field>
                  <Field label="Telefono" error={errors.admin_phone?.message}>
                    <Input {...register("admin_phone")} />
                  </Field>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
                  {isEdit
                    ? "No se ejecutara bootstrap adicional en esta actualizacion. El tenant mantendra el estado actual de onboarding."
                    : "El tenant se creara sin admin inicial. Eso dejara el onboarding en estado parcial hasta completar el usuario y su rol."}
                </div>
              )}
            </section>
          ) : isEdit ? (
            <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Onboarding tenant</p>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                  Listo para operar
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Este tenant ya tiene snapshot de onboarding listo. Si necesitas usuarios adicionales o roles internos, se administran desde el portal tenant.
              </p>
              {tenantProfile.onboarding.adminEmail ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Admin bootstrap detectado: {tenantProfile.onboarding.adminEmail}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Vista previa del producto visible</h3>
              <p className="text-sm text-muted-foreground">
                Antes de guardar, aqui ya puedes ver que modulo, branding y flujo de entrada tendra la empresa cuando entre a su portal.
              </p>
            </div>

            <TenantPortalPreview
              tenant={previewTenant}
              loginEmail={previewAdminEmail?.trim() || undefined}
              roleLabel="tenant_admin"
              compact
            />
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Actualizar" : "Crear tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function buildDefaultValues(
  tenant: Tenant | null | undefined,
  packageProfile: CommercialPlanCode,
): TenantFormValues {
  const profile = parseTenantProductProfile(tenant);
  const enabledServices = profile.enabledServices.filter((service): service is AssignableServiceCode =>
    ASSIGNABLE_SERVICE_CODES.includes(service as AssignableServiceCode),
  );

  return tenant
    ? {
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain ?? "",
        primary_color: tenant.primary_color ?? "#1976D2",
        secondary_color: tenant.secondary_color ?? "#424242",
        tertiary_color: tenant.tertiary_color ?? "#757575",
        subscription_plan: packageProfile,
        enabled_services: enabledServices.length ? enabledServices : getSuggestedServicesForPlan(packageProfile),
        max_users: tenant.max_users ?? 10,
        max_clients: tenant.max_clients ?? 50,
        create_initial_admin: false,
        admin_first_name: "",
        admin_last_name: "",
        admin_email: profile.onboarding.adminEmail ?? "",
        admin_password: "",
        admin_phone: "",
      }
    : {
        name: "",
        slug: "",
        domain: "",
        primary_color: "#1976D2",
        secondary_color: "#424242",
        tertiary_color: "#757575",
        subscription_plan: "basic",
        enabled_services: getSuggestedServicesForPlan("basic"),
        max_users: 10,
        max_clients: 50,
        create_initial_admin: true,
        admin_first_name: "",
        admin_last_name: "",
        admin_email: "",
        admin_password: "",
        admin_phone: "",
      };
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ColorField({
  label,
  valueField,
  register,
}: {
  label: string;
  valueField: "primary_color" | "secondary_color" | "tertiary_color";
  register: ReturnType<typeof useForm<TenantFormValues>>["register"];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input type="color" className="h-9 w-12 p-1" {...register(valueField)} />
        <Input className="flex-1" {...register(valueField)} />
      </div>
    </div>
  );
}
