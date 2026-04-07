"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { ModelConfig } from "@/types/api";

const modelSchema = z.object({
  name: z.string().min(1, "Requerido"),
  provider: z.string().min(1, "Requerido"),
  model_name: z.string().min(1, "Requerido"),
  api_key_encrypted: z.string().optional(),
  api_endpoint: z.string().optional(),
  api_version: z.string().optional(),
  default_temperature: z.number().optional(),
  default_max_tokens: z.number().optional(),
  default_top_p: z.number().optional(),
  max_tokens_per_request: z.number().optional(),
  max_requests_per_day: z.number().optional(),
  max_requests_per_hour: z.number().optional(),
  monthly_budget_usd: z.number().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

export type ModelFormValues = z.infer<typeof modelSchema>;

interface ModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ModelFormValues) => void;
  model?: ModelConfig | null;
  isLoading?: boolean;
}

export function ModelDialog({ open, onOpenChange, onSubmit, model, isLoading }: ModelDialogProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
  });

  useEffect(() => {
    if (open && model) {
      reset({
        name: model.name,
        provider: model.provider,
        model_name: model.model_name,
        api_key_encrypted: "",
        api_endpoint: model.api_endpoint ?? "",
        api_version: model.api_version ?? "",
        default_temperature: model.default_temperature,
        default_max_tokens: model.default_max_tokens,
        default_top_p: model.default_top_p,
        max_tokens_per_request: model.max_tokens_per_request,
        max_requests_per_day: model.max_requests_per_day,
        max_requests_per_hour: model.max_requests_per_hour,
        monthly_budget_usd: model.monthly_budget_usd,
        description: model.description ?? "",
        is_active: model.is_active,
        is_default: model.is_default,
      });
    } else if (open) {
      reset({
        name: "",
        provider: "",
        model_name: "",
        is_active: true,
        is_default: false,
      });
    }
  }, [open, model, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{model ? "Editar Modelo" : "Nuevo Modelo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Proveedor</Label>
              <Input id="provider" {...register("provider")} placeholder="openai, anthropic..." />
              {errors.provider && <p className="text-sm text-destructive">{errors.provider.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model_name">Modelo</Label>
              <Input id="model_name" {...register("model_name")} placeholder="gpt-4, claude-3..." />
              {errors.model_name && <p className="text-sm text-destructive">{errors.model_name.message}</p>}
            </div>
          </div>

          {/* API Config */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api_key_encrypted">API Key</Label>
              <Input id="api_key_encrypted" type="password" {...register("api_key_encrypted")} placeholder={model ? "Dejar vacío para mantener" : ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_endpoint">Endpoint</Label>
              <Input id="api_endpoint" {...register("api_endpoint")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_version">Versión API</Label>
              <Input id="api_version" {...register("api_version")} />
            </div>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_temperature">Temperatura</Label>
              <Input id="default_temperature" type="number" step="0.1" {...register("default_temperature", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_max_tokens">Max Tokens</Label>
              <Input id="default_max_tokens" type="number" {...register("default_max_tokens", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_top_p">Top P</Label>
              <Input id="default_top_p" type="number" step="0.01" {...register("default_top_p", { valueAsNumber: true })} />
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_tokens_per_request">Tokens/Request</Label>
              <Input id="max_tokens_per_request" type="number" {...register("max_tokens_per_request", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_requests_per_day">Requests/Día</Label>
              <Input id="max_requests_per_day" type="number" {...register("max_requests_per_day", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_requests_per_hour">Requests/Hora</Label>
              <Input id="max_requests_per_hour" type="number" {...register("max_requests_per_hour", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_budget_usd">Presupuesto USD/mes</Label>
              <Input id="monthly_budget_usd" type="number" step="0.01" {...register("monthly_budget_usd", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={watch("is_active")}
                onCheckedChange={(v) => setValue("is_active", !!v)}
              />
              <Label htmlFor="is_active">Activo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_default"
                checked={watch("is_default")}
                onCheckedChange={(v) => setValue("is_default", !!v)}
              />
              <Label htmlFor="is_default">Predeterminado</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
