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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { StorageConfiguration, StorageProvider } from "@/types/api";

const configSchema = z.object({
  provider_id: z.number(),
  config_name: z.string().min(1, "Requerido"),
  is_default: z.boolean().optional(),
  host: z.string().optional(),
  port: z.number().optional(),
  database_name: z.string().optional(),
  username: z.string().optional(),
  password_text: z.string().optional(),
  api_key: z.string().optional(),
  secret_key: z.string().optional(),
  base_url: z.string().optional(),
  bucket_name: z.string().optional(),
  region: z.string().optional(),
  project_id: z.string().optional(),
});

export type ConfigFormValues = z.infer<typeof configSchema>;

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ConfigFormValues) => void;
  config?: StorageConfiguration | null;
  providers: StorageProvider[];
  isLoading?: boolean;
}

export function ConfigDialog({ open, onOpenChange, onSubmit, config, providers, isLoading }: ConfigDialogProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: { provider_id: 0 },
  });

  const providerId = watch("provider_id");

  useEffect(() => {
    if (open && config) {
      reset({
        provider_id: config.provider_id,
        config_name: config.config_name,
        is_default: config.is_default,
        host: config.host ?? "",
        port: config.port,
        database_name: config.database_name ?? "",
        username: config.username ?? "",
        password_text: "",
        api_key: "",
        secret_key: "",
        base_url: config.base_url ?? "",
        bucket_name: config.bucket_name ?? "",
        region: config.region ?? "",
        project_id: config.project_id ?? "",
      });
    } else if (open) {
      reset({
        provider_id: providers[0]?.id ?? 0,
        config_name: "",
        is_default: false,
      });
    }
  }, [open, config, providers, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config ? "Editar Configuración" : "Nueva Configuración"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <Select
              value={String(providerId || "")}
              onValueChange={(v) => { if (v) setValue("provider_id", Number(v)); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="config_name">Nombre de Configuración</Label>
            <Input id="config_name" {...register("config_name")} />
            {errors.config_name && <p className="text-sm text-destructive">{errors.config_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input id="host" {...register("host")} placeholder="localhost" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Puerto</Label>
              <Input id="port" type="number" {...register("port", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bucket_name">Bucket / Contenedor</Label>
            <Input id="bucket_name" {...register("bucket_name")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Región</Label>
              <Input id="region" {...register("region")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_url">URL Base</Label>
              <Input id="base_url" {...register("base_url")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input id="username" {...register("username")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_text">Contraseña</Label>
              <Input id="password_text" type="password" {...register("password_text")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input id="api_key" type="password" {...register("api_key")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Key</Label>
              <Input id="secret_key" type="password" {...register("secret_key")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_default"
              checked={watch("is_default")}
              onCheckedChange={(v) => setValue("is_default", !!v)}
            />
            <Label htmlFor="is_default">Configuración predeterminada</Label>
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
