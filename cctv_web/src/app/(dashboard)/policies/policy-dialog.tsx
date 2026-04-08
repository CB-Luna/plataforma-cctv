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
import { listSites } from "@/lib/api/sites";
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
});

export type PolicyFormValues = z.infer<typeof policySchema>;

interface PolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PolicyFormValues) => void;
  policy?: Policy | null;
  isLoading?: boolean;
}

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
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", "policy-form"],
    queryFn: () => listClients(200, 0),
    staleTime: 5 * 60 * 1000,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites", "policy-form"],
    queryFn: listSites,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (policy) {
      form.reset({
        policy_number: policy.policy_number,
        client_id: policy.client_id,
        site_id: policy.site_id ?? "",
        status: (policy.status as PolicyFormValues["status"]) ?? "active",
        start_date: policy.start_date,
        end_date: policy.end_date,
        monthly_payment: policy.monthly_payment,
        payment_day: policy.payment_day ?? undefined,
        vendor: policy.vendor ?? "",
        contract_type: policy.contract_type ?? "",
        annual_value: policy.annual_value ?? undefined,
        contract_url: policy.contract_url ?? "",
        notes: policy.notes ?? "",
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
    });
  }, [currentSite?.id, form, policy]);

  const selectedClientId = form.watch("client_id");
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const matchingSites = selectedClient
    ? sites.filter((site) => matchSiteToClient(site, selectedClient))
    : sites;
  const siteOptions = matchingSites.length > 0 ? matchingSites : sites;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy ? "Editar poliza" : "Nueva poliza"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <SelectItem value="__none__">Cobertura a nivel cliente</SelectItem>
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

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea {...form.register("notes")} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : policy ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
