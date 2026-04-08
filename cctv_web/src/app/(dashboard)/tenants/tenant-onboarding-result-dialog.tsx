"use client";

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

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Servicios habilitados</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Estos servicios si participan desde hoy en la visibilidad real del shell donde existe modulo o configuracion.
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
