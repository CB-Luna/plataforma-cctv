"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Camera } from "@/types/api";
import { listSites } from "@/lib/api/sites";
import { listNvrs } from "@/lib/api/nvrs";
import { useSiteStore } from "@/stores/site-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { AlertTriangle, Info } from "lucide-react";

const optionalString = () =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().optional(),
  );

const optionalNumber = (options?: { integer?: boolean }) =>
  z.preprocess((value) => {
    if (value === "" || value == null || Number.isNaN(value)) return undefined;
    return value;
  }, options?.integer ? z.number().int().min(0).optional() : z.number().min(0).optional());

const cameraSchema = z.object({
  site_id: z.string().min(1, "Selecciona un sitio"),
  nvr_server_id: optionalString(),
  name: z.string().min(2, "Minimo 2 caracteres"),
  code: optionalString(),
  camera_model_name: optionalString(),
  resolution: optionalString(),
  ips: optionalNumber({ integer: true }),
  bitrate_kbps: optionalNumber({ integer: true }),
  firmware_version: optionalString(),
  serial_number: optionalString(),
  area: optionalString(),
  zone: optionalString(),
  location_description: optionalString(),
  project: optionalString(),
  has_counting: z.boolean().optional(),
  counting_enabled: z.boolean().optional(),
  notes: optionalString(),
  comments: optionalString(),
});

type CameraFormValues = z.output<typeof cameraSchema>;
type CameraFormInput = z.input<typeof cameraSchema>;

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
  const currentSite = useSiteStore((state) => state.currentSite);
  const isEdit = Boolean(camera);

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: listSites,
    enabled: open,
  });

  const { data: nvrs = [] } = useQuery({
    queryKey: ["nvrs"],
    queryFn: listNvrs,
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CameraFormInput, unknown, CameraFormValues>({
    resolver: zodResolver(cameraSchema),
    defaultValues: {
      site_id: currentSite?.id ?? "",
      nvr_server_id: "",
      has_counting: false,
      counting_enabled: false,
    },
  });

  useEffect(() => {
    if (camera) {
      reset({
        site_id: camera.site_id ?? currentSite?.id ?? "",
        nvr_server_id: camera.nvr_server_id ?? "",
        name: camera.name,
        code: camera.code ?? "",
        camera_model_name: camera.camera_model_name ?? "",
        resolution: camera.resolution ?? "",
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
        notes: camera.notes ?? "",
        comments: camera.comments ?? "",
      });
      return;
    }

    reset({
      site_id: currentSite?.id ?? "",
      nvr_server_id: "",
      name: "",
      code: "",
      camera_model_name: "",
      resolution: "",
      ips: undefined,
      bitrate_kbps: undefined,
      firmware_version: "",
      serial_number: "",
      area: "",
      zone: "",
      location_description: "",
      project: "",
      has_counting: false,
      counting_enabled: false,
      notes: "",
      comments: "",
    });
  }, [camera, currentSite?.id, reset]);

  const selectedSiteId = watch("site_id") ?? "";
  const availableNvrs = useMemo(() => {
    if (!selectedSiteId) return nvrs;
    return nvrs.filter((nvr) => nvr.site_id === selectedSiteId);
  }, [nvrs, selectedSiteId]);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      reset({
        site_id: currentSite?.id ?? "",
        nvr_server_id: "",
        has_counting: false,
        counting_enabled: false,
      });
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edicion manual no disponible" : "Nueva camara"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "El backend actual no expone PUT para camaras. Esta vista deja visible el contexto guardado, pero la edicion se difiere para no prometer una capacidad inexistente."
              : "La alta manual guarda contexto operativo y especificaciones base. Red, tipo y megapixeles avanzados se capturan hoy por importacion."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Card className="border-amber-200 bg-amber-50/80">
            <CardContent className="flex gap-3 py-3 px-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div className="text-sm text-amber-900">
                <p className="font-medium">Capacidad manual acotada al contrato actual</p>
                <p className="mt-1 text-xs text-amber-800">
                  El alta manual no persiste `camera_type`, `ip_address`, `mac_address`, `megapixels`
                  ni estado operativo avanzado.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-sky-200 bg-sky-50/80">
            <CardContent className="flex gap-3 py-3 px-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
              <div className="text-sm text-sky-950">
                <p className="font-medium">Contexto recomendado</p>
                <p className="mt-1 text-xs text-sky-800">
                  Asigna siempre sitio y, si existe, NVR. Eso mantiene coherente inventario, tickets,
                  topologia y floor plans por sucursal.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Contexto operativo</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sitio / sucursal *</Label>
                <Select value={selectedSiteId} onValueChange={(value) => {
                  setValue("site_id", value ?? "", { shouldValidate: true });
                  setValue("nvr_server_id", "");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un sitio" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.site_id && <p className="text-xs text-destructive">{errors.site_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>NVR asociado</Label>
                <Select
                  value={watch("nvr_server_id") ?? ""}
                  onValueChange={(value) => setValue("nvr_server_id", value === "__none__" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin NVR asociado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin NVR asociado</SelectItem>
                    {availableNvrs.map((nvr) => (
                      <SelectItem key={nvr.id} value={nvr.id}>
                        {nvr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Solo se listan NVR del sitio seleccionado cuando existe relacion operativa.
                </p>
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Identificacion y hardware base</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Codigo</Label>
                <Input id="code" placeholder="CAM-001" {...register("code")} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="camera_model_name">Modelo / referencia</Label>
                <Input id="camera_model_name" {...register("camera_model_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial_number">Numero de serie</Label>
                <Input id="serial_number" {...register("serial_number")} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolucion</Label>
                <Input id="resolution" placeholder="4MP / 1080p" {...register("resolution")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ips">IPS</Label>
                <Input id="ips" type="number" {...register("ips", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bitrate_kbps">Bitrate (kbps)</Label>
                <Input
                  id="bitrate_kbps"
                  type="number"
                  {...register("bitrate_kbps", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="firmware_version">Firmware</Label>
              <Input id="firmware_version" {...register("firmware_version")} />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Ubicacion en sitio</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input id="area" placeholder="Acceso principal" {...register("area")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone">Zona</Label>
                <Input id="zone" placeholder="Zona A" {...register("zone")} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location_description">Descripcion de ubicacion</Label>
                <Input id="location_description" {...register("location_description")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Proyecto</Label>
                <Input id="project" {...register("project")} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Operacion</legend>
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("has_counting")} className="rounded" />
                Tiene conteo
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("counting_enabled")} className="rounded" />
                Conteo habilitado
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Observaciones</legend>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" {...register("notes")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comentarios</Label>
              <Textarea id="comments" {...register("comments")} />
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cerrar
            </Button>
            <Button type="submit" disabled={isSubmitting || isEdit}>
              {isEdit ? "Edicion no disponible" : isSubmitting ? "Guardando..." : "Crear camara"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
