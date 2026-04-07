"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import type { Camera } from "@/types/api";
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

const cameraSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  code: z.string().optional(),
  camera_type: z.string().optional(),
  camera_model_name: z.string().optional(),
  ip_address: z.string().optional(),
  mac_address: z.string().optional(),
  resolution: z.string().optional(),
  megapixels: z.number().min(0).optional(),
  ips: z.number().int().min(0).optional(),
  bitrate_kbps: z.number().int().min(0).optional(),
  firmware_version: z.string().optional(),
  serial_number: z.string().optional(),
  area: z.string().optional(),
  zone: z.string().optional(),
  location_description: z.string().optional(),
  project: z.string().optional(),
  has_counting: z.boolean().optional(),
  counting_enabled: z.boolean().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type CameraFormValues = z.infer<typeof cameraSchema>;

export type { CameraFormValues };

interface CameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camera?: Camera | null;
  onSubmit: (data: CameraFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function CameraDialog({
  open,
  onOpenChange,
  camera,
  onSubmit,
  isSubmitting,
}: CameraDialogProps) {
  const isEdit = !!camera;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CameraFormValues>({
    resolver: zodResolver(cameraSchema),
    defaultValues: { status: "active" },
  });

  useEffect(() => {
    if (camera) {
      reset({
        name: camera.name,
        code: camera.code ?? "",
        camera_type: camera.camera_type ?? "",
        camera_model_name: camera.camera_model_name ?? "",
        ip_address: camera.ip_address ?? "",
        mac_address: camera.mac_address ?? "",
        resolution: camera.resolution ?? "",
        megapixels: camera.megapixels ?? undefined,
        ips: camera.ips ?? undefined,
        bitrate_kbps: camera.bitrate_kbps ?? undefined,
        firmware_version: camera.firmware_version ?? "",
        serial_number: camera.serial_number ?? "",
        area: camera.area ?? "",
        zone: camera.zone ?? "",
        location_description: camera.location_description ?? "",
        project: camera.project ?? "",
        has_counting: camera.has_counting ?? false,
        counting_enabled: camera.counting_enabled ?? false,
        status: camera.status ?? "active",
        notes: camera.notes ?? "",
      });
    } else {
      reset({ status: "active" });
    }
  }, [camera, reset]);

  const handleOpenChange = (val: boolean) => {
    if (!val) reset({ status: "active" });
    onOpenChange(val);
  };

  const cameraType = watch("camera_type");
  const statusVal = watch("status");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cámara" : "Nueva Cámara"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza la información de la cámara."
              : "Completa los datos de la cámara."}
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
                <Input id="code" placeholder="CAM-001" {...register("code")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={cameraType}
                  onValueChange={(val) => { if (val) setValue("camera_type", val); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dome">Domo</SelectItem>
                    <SelectItem value="bullet">Bullet</SelectItem>
                    <SelectItem value="ptz">PTZ</SelectItem>
                    <SelectItem value="fisheye">Fisheye</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="camera_model_name">Modelo</Label>
                <Input id="camera_model_name" {...register("camera_model_name")} />
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
                <Input id="ip_address" placeholder="192.168.1.101" {...register("ip_address")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mac_address">MAC</Label>
                <Input id="mac_address" {...register("mac_address")} />
              </div>
            </div>
          </fieldset>

          {/* Técnico */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Especificaciones</legend>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolución</Label>
                <Input id="resolution" placeholder="4MP" {...register("resolution")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="megapixels">Megapíxeles</Label>
                <Input id="megapixels" type="number" step="0.1" {...register("megapixels", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ips">IPS</Label>
                <Input id="ips" type="number" {...register("ips", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bitrate_kbps">Bitrate (kbps)</Label>
                <Input id="bitrate_kbps" type="number" {...register("bitrate_kbps", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firmware_version">Firmware</Label>
                <Input id="firmware_version" {...register("firmware_version")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial_number">Serie</Label>
                <Input id="serial_number" {...register("serial_number")} />
              </div>
            </div>
          </fieldset>

          {/* Ubicación */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Ubicación</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Área</Label>
                <Input id="area" placeholder="Entrada principal" {...register("area")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone">Zona</Label>
                <Input id="zone" placeholder="Zona A" {...register("zone")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_description">Descripción de ubicación</Label>
              <Input id="location_description" {...register("location_description")} />
            </div>
          </fieldset>

          {/* Conteo */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Conteo de personas</legend>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("has_counting")} className="rounded" />
                Tiene conteo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("counting_enabled")} className="rounded" />
                Conteo habilitado
              </label>
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
