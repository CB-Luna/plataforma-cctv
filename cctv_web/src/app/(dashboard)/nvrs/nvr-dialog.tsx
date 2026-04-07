"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import type { NvrServer } from "@/types/api";
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

const nvrSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  code: z.string().optional(),
  model: z.string().optional(),
  ip_address: z.string().optional(),
  subnet_mask: z.string().optional(),
  gateway: z.string().optional(),
  mac_address: z.string().optional(),
  camera_channels: z.number().int().min(0).optional(),
  tpv_channels: z.number().int().min(0).optional(),
  lpr_channels: z.number().int().min(0).optional(),
  total_storage_tb: z.number().min(0).optional(),
  recording_days: z.number().int().min(0).optional(),
  processor: z.string().optional(),
  ram_gb: z.number().int().min(0).optional(),
  os_name: z.string().optional(),
  edition: z.string().optional(),
  vms_version: z.string().optional(),
  service_tag: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type NvrFormValues = z.infer<typeof nvrSchema>;

export type { NvrFormValues };

interface NvrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nvr?: NvrServer | null;
  onSubmit: (data: NvrFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function NvrDialog({
  open,
  onOpenChange,
  nvr,
  onSubmit,
  isSubmitting,
}: NvrDialogProps) {
  const isEdit = !!nvr;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NvrFormValues>({
    resolver: zodResolver(nvrSchema),
    defaultValues: {
      status: "active",
    },
  });

  useEffect(() => {
    if (nvr) {
      reset({
        name: nvr.name,
        code: nvr.code ?? "",
        model: nvr.model ?? "",
        ip_address: nvr.ip_address ?? "",
        subnet_mask: nvr.subnet_mask ?? "",
        gateway: nvr.gateway ?? "",
        mac_address: nvr.mac_address ?? "",
        camera_channels: nvr.camera_channels ?? undefined,
        tpv_channels: nvr.tpv_channels ?? undefined,
        lpr_channels: nvr.lpr_channels ?? undefined,
        total_storage_tb: nvr.total_storage_tb ?? undefined,
        recording_days: nvr.recording_days ?? undefined,
        processor: nvr.processor ?? "",
        ram_gb: nvr.ram_gb ?? undefined,
        os_name: nvr.os_name ?? "",
        edition: nvr.edition ?? "",
        vms_version: nvr.vms_version ?? "",
        service_tag: nvr.service_tag ?? "",
        status: nvr.status ?? "active",
        notes: nvr.notes ?? "",
      });
    } else {
      reset({ status: "active" });
    }
  }, [nvr, reset]);

  const handleOpenChange = (val: boolean) => {
    if (!val) reset({ status: "active" });
    onOpenChange(val);
  };

  const statusVal = watch("status");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar NVR" : "Nuevo NVR"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza la información del servidor NVR."
              : "Completa los datos del servidor NVR."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* General */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">General</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input id="code" placeholder="NVR-001" {...register("code")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" placeholder="Dell PowerEdge R640" {...register("model")} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={statusVal}
                  onValueChange={(val) => { if (val) setValue("status", val); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>

          {/* Red */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Red</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ip_address">IP</Label>
                <Input id="ip_address" placeholder="192.168.1.100" {...register("ip_address")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mac_address">MAC</Label>
                <Input id="mac_address" placeholder="00:1A:2B:3C:4D:5E" {...register("mac_address")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subnet_mask">Máscara de subred</Label>
                <Input id="subnet_mask" placeholder="255.255.255.0" {...register("subnet_mask")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gateway">Gateway</Label>
                <Input id="gateway" placeholder="192.168.1.1" {...register("gateway")} />
              </div>
            </div>
          </fieldset>

          {/* Canales y Almacenamiento */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Canales y Almacenamiento</legend>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="camera_channels">Canales cámara</Label>
                <Input id="camera_channels" type="number" {...register("camera_channels", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpv_channels">Canales TPV</Label>
                <Input id="tpv_channels" type="number" {...register("tpv_channels", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lpr_channels">Canales LPR</Label>
                <Input id="lpr_channels" type="number" {...register("lpr_channels", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_storage_tb">Almacenamiento (TB)</Label>
                <Input id="total_storage_tb" type="number" step="0.1" {...register("total_storage_tb", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recording_days">Días de grabación</Label>
                <Input id="recording_days" type="number" {...register("recording_days", { valueAsNumber: true })} />
              </div>
            </div>
          </fieldset>

          {/* Hardware */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Hardware y Software</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="processor">Procesador</Label>
                <Input id="processor" {...register("processor")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ram_gb">RAM (GB)</Label>
                <Input id="ram_gb" type="number" {...register("ram_gb", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="os_name">Sistema operativo</Label>
                <Input id="os_name" {...register("os_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edition">Edición VMS</Label>
                <Input id="edition" {...register("edition")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vms_version">Versión VMS</Label>
                <Input id="vms_version" {...register("vms_version")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_tag">Service Tag</Label>
              <Input id="service_tag" {...register("service_tag")} />
            </div>
          </fieldset>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
