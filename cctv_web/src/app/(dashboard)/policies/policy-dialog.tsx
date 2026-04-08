"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listClients } from "@/lib/api/clients";
import { getPolicy } from "@/lib/api/policies";
import { listSites } from "@/lib/api/sites";
import {
  assetScopeLabels,
  parsePolicyCoverage,
  serviceFamilyLabels,
  serviceWindowLabels,
} from "@/lib/contracts/contractual";
import { useSiteStore } from "@/stores/site-store";
import { matchSiteToClient } from "@/lib/site-context";
import type { Policy } from "@/types/api";

const policySchema = z.object({
  policy_number: z.string().min(1, "Numero de poliza requerido"),
  client_id: z.string().min(1, "Cliente requerido"),
  site_id: z.string().optional(),
  status: z.enum(["active", "expired", "suspended", "cancelled"]),
  start_date: z.string().min(1, "Fecha inicio requerida"),
  end_date: z.string().min(1, "Fecha fin requerida"),
  monthly_payment: z.number().min(0, "Debe ser >= 0"),
  payment_day: z.number().min(1).max(31).optional(),
  vendor: z.string().optional(),
  contract_type: z.string().optional(),
  annual_value: z.number().optional(),
  contract_url: z.string().optional(),
  notes: z.string().optional(),
  covered_services: z.array(z.enum(["cctv", "access_control", "networking", "other"])),
  asset_scope: z.enum(["listed_assets_only", "site_only", "client_scope"]),
  service_window: z.enum(["24x7", "business_hours", "custom"]),
  coverage_notes: z.string().optional(),
});

export type PolicyFormValues = z.infer<typeof policySchema>;

interface PolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PolicyFormValues) => void;
  policy?: Policy | null;
  isLoading?: boolean;
}

const serviceFamilies = Object.entries(serviceFamilyLabels) as Array<
  [PolicyFormValues["covered_services"][number], string]
>;

export function PolicyDialog({
  open,
  onOpenChange,
  onSubmit,
  policy,
  isLoading,
}: PolicyDialogProps) {
  const currentSite = useSiteStore((s) => s.currentSite);
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      policy_number: "",
      client_id: "",
      site_id: "",
      status: "active",
      start_date: "",
      end_date: "",
      monthly_payment: 0,
      payment_day: undefined,
      vendor: "",
      contract_type: "",
      annual_value: undefined,
      contract_url: "",
      notes: "",
      covered_services: ["cctv"],
      asset_scope: currentSite?.id ? "site_only" : "client_scope",
      service_window: "business_hours",
      coverage_notes: "",
    },
  });

  const { data: policyDetail, isLoading: isLoadingPolicyDetail } = useQuery({
    queryKey: ["policy-dialog", policy?.id],
    queryFn: () => getPolicy(policy!.id),
    enabled: open && Boolean(policy?.id),
    staleTime: 60 * 1000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", "policy-form"],
    queryFn: () => listClients(200, 0),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites", "policy-form"],
    queryFn: listSites,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const effectivePolicy = policyDetail ?? policy;
  const selectedClientId = form.watch("client_id");
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const selectedServices = form.watch("covered_services");

  const matchingSites = selectedClient
    ? sites.filter((site) => matchSiteToClient(site, selectedClient))
    : sites;
  const siteOptions = matchingSites.length > 0 ? matchingSites : sites;

  useEffect(() => {
    if (effectivePolicy) {
      const coverage = parsePolicyCoverage(effectivePolicy.coverage_json, effectivePolicy.site_id);
      form.reset({
        policy_number: effectivePolicy.policy_number,
        client_id: effectivePolicy.client_id,
        site_id: effectivePolicy.site_id ?? "",
        status: (effectivePolicy.status as PolicyFormValues["status"]) ?? "active",
        start_date: effectivePolicy.start_date,
        end_date: effectivePolicy.end_date,
        monthly_payment: effectivePolicy.monthly_payment,
        payment_day: effectivePolicy.payment_day ?? undefined,
        vendor: effectivePolicy.vendor ?? "",
        contract_type: effectivePolicy.contract_type ?? "",
        annual_value: effectivePolicy.annual_value ?? undefined,
        contract_url: effectivePolicy.contract_url ?? "",
        notes: effectivePolicy.notes ?? "",
        covered_services: coverage.covered_services.length > 0 ? coverage.covered_services : ["cctv"],
        asset_scope: coverage.asset_scope,
        service_window: coverage.service_window,
        coverage_notes: coverage.coverage_notes,
      });
      return;
    }

    form.reset({
      policy_number: "",
      client_id: "",
      site_id: currentSite?.id ?? "",
      status: "active",
      start_date: "",
      end_date: "",
      monthly_payment: 0,
      payment_day: undefined,
      vendor: "",
      contract_type: "",
      annual_value: undefined,
      contract_url: "",
      notes: "",
      covered_services: ["cctv"],
      asset_scope: currentSite?.id ? "site_only" : "client_scope",
      service_window: "business_hours",
      coverage_notes: "",
    });
  }, [currentSite?.id, effectivePolicy, form]);

  useEffect(() => {
    if (!open || policy || !currentSite) return;

    if (!form.getValues("site_id")) {
      form.setValue("site_id", currentSite.id);
    }

    if (!form.getValues("client_id")) {
      const inferredClient = clients.find((client) => matchSiteToClient(currentSite, client));
      if (inferredClient) {
        form.setValue("client_id", inferredClient.id);
      }
    }
  }, [clients, currentSite, form, open, policy]);

  useEffect(() => {
    const selectedSiteId = form.getValues("site_id");
    if (!selectedSiteId) return;
    if (siteOptions.some((site) => site.id === selectedSiteId)) return;

    form.setValue("site_id", "");
  }, [form, siteOptions]);

  const cannotClearSiteScope = Boolean(policy && effectivePolicy?.site_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy ? "Editar poliza" : "Nueva poliza"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg border border-dashed border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            La poliza define cobertura contractual. El SLA se resuelve despues por tipo y prioridad del ticket, no desde este formulario.
          </div>

          {isLoadingPolicyDetail ? (
            <div className="rounded-lg border px-3 py-3 text-sm text-muted-foreground">
              Cargando detalle contractual de la poliza...
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numero de poliza *</Label>
              <Input {...form.register("policy_number")} />
              {form.formState.errors.policy_number && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.policy_number.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={selectedClientId || undefined}
                onValueChange={(value) => {
                  form.setValue("client_id", value ?? "", { shouldValidate: true });
                  form.setValue("site_id", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.client_id && (
                <p className="text-sm text-destructive">{form.formState.errors.client_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sitio / sucursal</Label>
              <Select
                value={form.watch("site_id") || "__none__"}
                onValueChange={(value) =>
                  form.setValue("site_id", value && value !== "__none__" ? value : "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cobertura a nivel cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled={cannotClearSiteScope}>
                    Cobertura a nivel cliente
                  </SelectItem>
                  {siteOptions.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClient && matchingSites.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  El cruce cliente-sitio usa coincidencia por nombre comercial mientras la API de sitios no exponga `client_id`.
                </p>
              )}
              {cannotClearSiteScope && (
                <p className="text-xs text-amber-700">
                  La API actual permite mover la poliza a otro sitio, pero no limpiar `site_id` para volverla cobertura cliente. Si necesitas eso, crea una nueva poliza.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as PolicyFormValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                  <SelectItem value="suspended">Suspendida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha inicio *</Label>
              <Input type="date" {...form.register("start_date")} />
              {form.formState.errors.start_date && (
                <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fecha fin *</Label>
              <Input type="date" {...form.register("end_date")} />
              {form.formState.errors.end_date && (
                <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Pago mensual *</Label>
              <Input type="number" step="0.01" {...form.register("monthly_payment", { valueAsNumber: true })} />
              {form.formState.errors.monthly_payment && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.monthly_payment.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Dia de pago</Label>
              <Input type="number" min={1} max={31} {...form.register("payment_day", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label>Valor anual</Label>
              <Input type="number" step="0.01" {...form.register("annual_value", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Input {...form.register("vendor")} />
            </div>

            <div className="space-y-2">
              <Label>Tipo de contrato</Label>
              <Input {...form.register("contract_type")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL del contrato</Label>
            <Input {...form.register("contract_url")} placeholder="https://..." />
          </div>

          <div className="rounded-xl border p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">Cobertura operativa</h3>
              <p className="text-xs text-muted-foreground">
                Estos campos se guardan dentro de `coverage_json` para que tickets y detalle de poliza hablen el mismo lenguaje contractual.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Servicios cubiertos</Label>
              <p className="text-xs text-muted-foreground">
                Incluir "Control de Acceso" o "Redes" aqui documenta cobertura contractual. La visibilidad del modulo en runtime depende del servicio habilitado del tenant; su operacion completa sigue siendo WIP mientras no cierre backend y modelo del dominio.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {serviceFamilies.map(([serviceKey, label]) => (
                  <label key={serviceKey} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <Checkbox
                      checked={selectedServices.includes(serviceKey)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          form.setValue("covered_services", [...selectedServices, serviceKey]);
                          return;
                        }

                        form.setValue(
                          "covered_services",
                          selectedServices.filter((item) => item !== serviceKey),
                        );
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Alcance de activos</Label>
                <Select
                  value={form.watch("asset_scope")}
                  onValueChange={(value) => form.setValue("asset_scope", value as PolicyFormValues["asset_scope"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(assetScopeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ventana de servicio</Label>
                <Select
                  value={form.watch("service_window")}
                  onValueChange={(value) => form.setValue("service_window", value as PolicyFormValues["service_window"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceWindowLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label>Notas de cobertura</Label>
              <Textarea {...form.register("coverage_notes")} rows={3} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas internas</Label>
            <Textarea {...form.register("notes")} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingPolicyDetail}>
              {isLoading ? "Guardando..." : policy ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
