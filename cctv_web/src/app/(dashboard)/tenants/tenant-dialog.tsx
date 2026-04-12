"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Tenant } from "@/types/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ThemeSelector, type ThemeSelection, findPresetByColors } from "@/components/theme-selector";
import { Eye, EyeOff, Upload } from "lucide-react";
import {
  ASSIGNABLE_SERVICE_CODES,
  COMMERCIAL_PLAN_PRESETS,
  PRODUCT_SERVICE_DEFINITIONS,
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
    subscription_plan: z.enum(["basic", "professional", "enterprise", "custom"]),
    enabled_services: z
      .array(z.enum(["cctv", "operations", "storage", "intelligence", "access_control", "networking"]))
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
  onLogoUpload?: (file: File) => Promise<void>;
  isSubmitting?: boolean;
}

const assignableServices = ASSIGNABLE_SERVICE_CODES.map((code) => PRODUCT_SERVICE_DEFINITIONS[code]);

export function TenantDialog({
  open,
  onOpenChange,
  tenant,
  onSubmit,
  onLogoUpload,
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
  const primaryColor = watch("primary_color");
  const secondaryColor = watch("secondary_color");
  const tertiaryColor = watch("tertiary_color");

  // Estado para logo file upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const logoPreviewUrl = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile);
    return tenant?.logo_url ?? null;
  }, [logoFile, tenant?.logo_url]);

  // Limpiar object URL al desmontar
  useEffect(() => {
    return () => {
      if (logoFile && logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoFile, logoPreviewUrl]);

  // Detectar preset activo basado en los colores actuales del form
  const activeThemeCode = useMemo(() => {
    return findPresetByColors(primaryColor, secondaryColor, tertiaryColor);
  }, [primaryColor, secondaryColor, tertiaryColor]);

  useEffect(() => {
    reset(buildDefaultValues(tenant, tenantProfile.packageProfile));
    setLogoFile(null);
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
      setLogoFile(null);
    }
    onOpenChange(value);
  };

  // Al enviar el form, tambien subir logo si se selecciono archivo
  const handleFormSubmit = async (data: TenantFormValues) => {
    await onSubmit(data);
    if (logoFile && onLogoUpload && tenant) {
      setIsUploadingLogo(true);
      try {
        await onLogoUpload(logoFile);
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  // Cuando el usuario selecciona un preset, aplicar sus colores al form
  const handleThemeChange = (selection: ThemeSelection | null) => {
    if (selection) {
      setValue("primary_color", selection.colors[0], { shouldDirty: true });
      setValue("secondary_color", selection.colors[1], { shouldDirty: true });
      setValue("tertiary_color", selection.colors[2], { shouldDirty: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar empresa" : "Nueva empresa"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos, servicios y configuracion de la empresa."
              : "Crea una empresa, define sus servicios y opcionalmente crea el admin inicial."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Tabs defaultValue="identidad">
            <TabsList className="w-full">
              <TabsTrigger value="identidad">Identidad</TabsTrigger>
              <TabsTrigger value="servicios">Servicios</TabsTrigger>
              <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            </TabsList>

            {/* === Tab: Identidad === */}
            <TabsContent value="identidad" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre *" error={errors.name?.message}>
                  <Input id="name" {...register("name")} />
                </Field>
                <Field label="Slug *" error={errors.slug?.message}>
                  <Input id="slug" {...register("slug")} disabled={isEdit} />
                </Field>
              </div>

              <Field label="Dominio personalizado" error={errors.domain?.message}>
                <Input id="domain" placeholder="empresa.ejemplo.com" {...register("domain")} />
              </Field>

              {/* Logo de empresa */}
              {isEdit && onLogoUpload ? (
                <div className="space-y-2">
                  <Label>Logo de empresa</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
                      {logoPreviewUrl ? (
                        <img
                          src={logoPreviewUrl}
                          alt={`Logo de ${tenant?.name ?? "empresa"}`}
                          className="h-12 max-w-full rounded-lg object-contain"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin logo</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors hover:bg-muted/50 dark:border-slate-700">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span>{logoFile ? logoFile.name : "Cambiar logo"}</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP o SVG</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <Label className="mb-2 block">Branding</Label>
                <div className="grid grid-cols-3 gap-4">
                  <ColorField label="Primario" valueField="primary_color" register={register} />
                  <ColorField label="Secundario" valueField="secondary_color" register={register} />
                  <ColorField label="Terciario" valueField="tertiary_color" register={register} />
                </div>
              </div>

              <ThemeSelector
                value={activeThemeCode}
                onChange={handleThemeChange}
                label="Tema visual (referencia)"
              />
            </TabsContent>

            {/* === Tab: Servicios === */}
            <TabsContent value="servicios" className="space-y-4 pt-4">
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

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                <span className="font-medium">{COMMERCIAL_PLAN_PRESETS[subscriptionPlan].label}:</span>{" "}
                <span className="text-muted-foreground">{COMMERCIAL_PLAN_PRESETS[subscriptionPlan].description}</span>
              </div>

              <div className="space-y-3">
                <Label>Servicios habilitados *</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {assignableServices.map((service) => {
                    const serviceCode = service.code as AssignableServiceCode;
                    const selected = enabledServices.includes(serviceCode);
                    const statusMeta = getServiceStatusMeta(service.status);

                    return (
                      <label
                        key={service.code}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
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
                                ? enabledServices.filter((v) => v !== serviceCode)
                                : [...enabledServices, serviceCode],
                              { shouldDirty: true, shouldValidate: true },
                            )
                          }
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{service.label}</span>
                            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase dark:bg-slate-700">
                              {statusMeta.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{service.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.enabled_services ? <p className="text-xs text-destructive">{errors.enabled_services.message}</p> : null}
              </div>
            </TabsContent>

            {/* === Tab: Onboarding === */}
            <TabsContent value="onboarding" className="space-y-4 pt-4">
              {!isEdit || canRecoverOnboarding ? (
                <>
                  <label className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <Checkbox
                      checked={createInitialAdmin}
                      onCheckedChange={(checked) => setValue("create_initial_admin", checked === true, { shouldDirty: true })}
                    />
                    <div>
                      <p className="text-sm font-medium">Crear admin inicial ahora</p>
                      <p className="text-xs text-muted-foreground">
                        Deja la empresa lista para iniciar sesion con rol tenant_admin.
                      </p>
                    </div>
                  </label>

                  {createInitialAdmin ? (
                    <div className="space-y-4 rounded-xl border border-emerald-200 bg-white p-4 dark:border-emerald-900/40 dark:bg-slate-950/50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Datos del admin inicial</p>
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                          tenant_admin
                        </span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nombre *" error={errors.admin_first_name?.message}>
                          <Input {...register("admin_first_name")} />
                        </Field>
                        <Field label="Apellido *" error={errors.admin_last_name?.message}>
                          <Input {...register("admin_last_name")} />
                        </Field>
                        <Field label="Email *" error={errors.admin_email?.message}>
                          <Input type="email" {...register("admin_email")} />
                        </Field>
                        <PasswordFieldInline
                          label="Contrasena *"
                          error={errors.admin_password?.message}
                          register={register("admin_password")}
                        />
                        <Field label="Telefono" error={errors.admin_phone?.message}>
                          <Input {...register("admin_phone")} />
                        </Field>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
                      {isEdit
                        ? "No se ejecutara bootstrap adicional."
                        : "Se creara sin admin inicial. El onboarding quedara pendiente."}
                    </p>
                  )}
                </>
              ) : isEdit ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">Listo</span>
                  <div>
                    <p className="text-sm font-medium">Onboarding completado</p>
                    {tenantProfile.onboarding.adminEmail ? (
                      <p className="text-xs text-muted-foreground">Admin: {tenantProfile.onboarding.adminEmail}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingLogo}>
              {isUploadingLogo ? "Subiendo logo..." : isSubmitting ? "Guardando..." : isEdit ? "Actualizar" : "Crear empresa"}
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

function PasswordFieldInline({
  label,
  error,
  register: reg,
}: {
  label: string;
  error?: string;
  register: ReturnType<ReturnType<typeof useForm<TenantFormValues>>["register"]>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          className="pr-9"
          {...reg}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setShow(!show)}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
