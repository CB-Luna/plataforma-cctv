"use client";

import type { ReactNode } from "react";
import { Building2, CheckCircle2, LogIn, Palette, ShieldCheck } from "lucide-react";
import type { Company, Tenant } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PRODUCT_SERVICE_DEFINITIONS,
  getTenantReadinessMeta,
  getServiceStatusMeta,
  isServiceRuntimeVisible,
  parseTenantProductProfile,
} from "@/lib/product/service-catalog";
import { getVisibleRuntimeMenu } from "@/lib/product/runtime-navigation";

type TenantLikeEntity = Company | Tenant | null | undefined;

export function TenantPortalPreview({
  tenant,
  title = "Vista previa del portal tenant",
  description = "Asi se vera el portal de la empresa cuando inicie sesion con sus modulos habilitados.",
  loginEmail,
  roleLabel,
  compact = false,
}: {
  tenant: TenantLikeEntity;
  title?: string;
  description?: string;
  loginEmail?: string;
  roleLabel?: string;
  compact?: boolean;
}) {
  if (!tenant) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selecciona una empresa para previsualizar su branding, sus modulos visibles y el flujo de entrada al portal.
          </p>
        </CardContent>
      </Card>
    );
  }

  const tenantProfile = parseTenantProductProfile(tenant);
  const readiness = getTenantReadinessMeta({
    companyId: tenant.id,
    productProfile: tenantProfile,
  });
  const runtimeServices = tenantProfile.enabledServices.filter((serviceCode) =>
    isServiceRuntimeVisible(serviceCode, { hasRoleContext: true }),
  );
  const runtimeMenuSections = getVisibleRuntimeMenu({
    enabledServices: tenantProfile.enabledServices,
    hasRoleContext: true,
    ignorePermissions: true,
  });
  const previewEmail = loginEmail ?? tenantProfile.onboarding.adminEmail ?? "Definir admin inicial";
  const previewRole = roleLabel ?? tenantProfile.onboarding.roleName ?? "tenant_admin";

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/40">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Plan: {tenantProfile.packageProfile}</Badge>
            <Badge variant={readiness.tone}>{readiness.label}</Badge>
            <Badge variant="secondary">{runtimeServices.length} dominios visibles</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="grid gap-4 xl:grid-cols-[280px,1fr]">
          <div
            className="overflow-hidden rounded-3xl border border-slate-900/10 bg-slate-950 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.8)]"
            style={{
              backgroundImage:
                "radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))",
            }}
          >
            <div className="border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                {tenant.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name}
                    className="h-10 w-10 rounded-2xl border border-white/10 object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white"
                    style={{ backgroundColor: tenant.primary_color ?? "#1976D2" }}
                  >
                    {tenant.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{tenant.name}</p>
                  <p className="truncate text-xs text-white/60">Portal de empresa</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-4 py-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
                  Menu visible
                </p>
                <nav className="space-y-2">
                  {runtimeMenuSections.map((section) => {
                    const serviceMeta = section.service
                      ? getServiceStatusMeta(PRODUCT_SERVICE_DEFINITIONS[section.service].status)
                      : null;

                    return (
                      <div key={section.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{section.label}</p>
                          {serviceMeta ? (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                              {serviceMeta.label}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {section.items.slice(0, compact ? 3 : 5).map((item) => (
                            <span
                              key={`${section.id}-${item.id}`}
                              className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/70"
                            >
                              {item.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </nav>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
                  Branding activo
                </p>
                <div className="mt-3 flex gap-2">
                  {[tenant.primary_color, tenant.secondary_color, tenant.tertiary_color].map((color, index) => (
                    <div
                      key={`${tenant.id}-swatch-${index}`}
                      className="h-8 w-8 rounded-xl border border-white/10"
                      style={{ backgroundColor: color ?? "#64748B" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <PreviewInfoCard
                icon={Building2}
                title="Empresa lista para operar"
                description="Branding, cupos y plan comercial visibles para la empresa seleccionada."
              >
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>Slug: <span className="font-medium text-slate-900 dark:text-slate-100">{tenant.slug}</span></p>
                  <p>Max. usuarios: <span className="font-medium text-slate-900 dark:text-slate-100">{tenant.max_users ?? "N/D"}</span></p>
                  <p>Max. clientes: <span className="font-medium text-slate-900 dark:text-slate-100">{tenant.max_clients ?? "N/D"}</span></p>
                  <p>Servicios: <span className="font-medium text-slate-900 dark:text-slate-100">{tenantProfile.enabledServices.length}</span></p>
                </div>
              </PreviewInfoCard>

              <PreviewInfoCard
                icon={ShieldCheck}
                title="Admin inicial"
                description="Cuenta con la que esta empresa queda preparada para entrar al sistema."
              >
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>Email: <span className="font-medium text-slate-900 dark:text-slate-100">{previewEmail}</span></p>
                  <p>Rol: <span className="font-medium text-slate-900 dark:text-slate-100">{previewRole}</span></p>
                  <p>Estado: <span className="font-medium text-slate-900 dark:text-slate-100">{readiness.label}</span></p>
                  <p>Evidencia: <span className="font-medium text-slate-900 dark:text-slate-100">{readiness.evidenceLabel}</span></p>
                </div>
              </PreviewInfoCard>
            </div>

            <PreviewInfoCard
              icon={Palette}
              title="Modulos y tema que vera la empresa"
              description="La visibilidad final del menu ya responde a servicios habilitados y al estado del modulo."
            >
              <div className="flex flex-wrap gap-2">
                {runtimeServices.map((serviceCode) => {
                  const service = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
                  return (
                    <Badge key={`${tenant.id}-${service.code}`} variant="secondary">
                      {service.label}
                    </Badge>
                  );
                })}
              </div>
              {!runtimeServices.length ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Este tenant aun no tiene dominios runtime visibles. Debes habilitar al menos un servicio operativo o WIP.
                </p>
              ) : null}
            </PreviewInfoCard>

            <PreviewInfoCard
              icon={LogIn}
              title="Flujo visible de entrada"
              description="Resumen del recorrido que seguira la empresa al iniciar sesion."
            >
              <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">1</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Login con credenciales del tenant</p>
                    <p>Se entra con el admin inicial o con un usuario interno ya creado para esta empresa.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">2</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Contexto de empresa</p>
                    <p>Si el usuario tiene varias empresas, pasa por seleccion explicita. Si solo tiene una, entra directo.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">3</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Portal con branding y menu propios</p>
                    <p>Header, sidebar y modulos visibles se alinean al tenant, sus roles internos y sus servicios habilitados.</p>
                  </div>
                </li>
              </ol>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
                Este preview reutiliza la misma estructura de dominios del sidebar runtime. La visibilidad fina por permisos puede variar segun el rol interno que termine operando la empresa.
              </div>
            </PreviewInfoCard>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewInfoCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-950">
          <Icon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
