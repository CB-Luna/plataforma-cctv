"use client";

import { ArrowRight, CheckCircle2, LogIn, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceBadges } from "@/components/product/service-badges";
import { getOnboardingStatusMeta, type AssignableServiceCode, type CommercialPlanCode } from "@/lib/product/service-catalog";

export interface TenantOnboardingResult {
  tenantName: string;
  tenantSlug: string;
  packageProfile: CommercialPlanCode;
  enabledServices: AssignableServiceCode[];
  adminEmail?: string;
  roleName?: string;
  status: "ready" | "tenant_created_only" | "admin_created_pending_role" | "admin_creation_failed";
  warnings: string[];
}

export function TenantOnboardingResultDialog({
  open,
  onOpenChange,
  result,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: TenantOnboardingResult | null;
}) {
  if (!result) return null;

  const onboardingMeta = getOnboardingStatusMeta(result.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resultado del onboarding tenant</DialogTitle>
          <DialogDescription>
            Este resumen separa claramente lo que quedo listo, lo que quedo parcial y cualquier bloqueo residual del contrato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={onboardingMeta.tone === "default" ? "default" : onboardingMeta.tone}>
                {onboardingMeta.label}
              </Badge>
              <Badge variant="outline">Plan comercial: {result.packageProfile}</Badge>
              <Badge variant="secondary">{result.tenantName}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Tenant creado con slug <code className="rounded bg-background px-1.5 py-0.5 text-xs">{result.tenantSlug}</code>.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ResultCard
              icon={CheckCircle2}
              title="Paquete y modulos"
              description="Producto visible que recibira la empresa"
              lines={[
                `Plan: ${result.packageProfile}`,
                `${result.enabledServices.length} servicios habilitados`,
              ]}
            />
            <ResultCard
              icon={ShieldCheck}
              title="Admin inicial"
              description="Usuario que dejaste listo para operar"
              lines={[
                result.adminEmail ?? "No se creo admin inicial",
                result.roleName ?? "Sin rol confirmado",
              ]}
            />
            <ResultCard
              icon={LogIn}
              title="Siguiente paso"
              description="Como validarlo desde producto"
              lines={[
                "Entrar por /login",
                "Seleccionar empresa si aplica",
              ]}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Servicios habilitados</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Estos servicios ya participan en la visibilidad real del producto segun el estado de cada modulo: operativo, parcial o WIP.
              </p>
              <div className="mt-3">
                <ServiceBadges services={result.enabledServices} />
              </div>
            </section>

            <section className="rounded-2xl border p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin inicial</h3>
              <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p>Email: {result.adminEmail ?? "No se creo admin inicial"}</p>
                <p>Rol asignado: {result.roleName ?? "Sin rol confirmado"}</p>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Flujo visible para verificar</h3>
            <ol className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>Inicia sesion con <strong>{result.adminEmail ?? "el admin definido"}</strong>.</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>Si ese usuario pertenece a varias empresas, pasa por seleccion explicita de empresa.</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>Al entrar, el portal debe respetar branding, modulos habilitados y roles internos de ese tenant.</span>
              </li>
            </ol>
          </section>

          {result.warnings.length ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
              <h3 className="font-semibold">Pendientes o degradaciones</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultCard({
  icon: Icon,
  title,
  description,
  lines,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-950">
          <Icon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {lines.map((line) => (
          <p key={`${title}-${line}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}
