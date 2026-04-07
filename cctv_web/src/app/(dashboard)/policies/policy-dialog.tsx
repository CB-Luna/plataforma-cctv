"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import type { Policy } from "@/types/api";

const policySchema = z.object({
  policy_number: z.string().min(1, "Número de póliza requerido"),
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

export function PolicyDialog({ open, onOpenChange, onSubmit, policy, isLoading }: PolicyDialogProps) {
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
    } else {
      form.reset({
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
      });
    }
  }, [policy, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy ? "Editar Póliza" : "Nueva Póliza"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de póliza *</Label>
              <Input {...form.register("policy_number")} />
              {form.formState.errors.policy_number && (
                <p className="text-sm text-destructive">{form.formState.errors.policy_number.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Cliente ID *</Label>
              <Input {...form.register("client_id")} placeholder="UUID del cliente" />
              {form.formState.errors.client_id && (
                <p className="text-sm text-destructive">{form.formState.errors.client_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sitio ID</Label>
              <Input {...form.register("site_id")} placeholder="UUID del sitio (opcional)" />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as PolicyFormValues["status"])}
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
                <p className="text-sm text-destructive">{form.formState.errors.monthly_payment.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Día de pago</Label>
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
