"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { NvrServer } from "@/types/api";
import { listSites } from "@/lib/api/sites";
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

const optionalNumber = () =>
  z.preprocess((value) => {
    if (value === "" || value == null || Number.isNaN(value)) return undefined;
    return value;
  }, z.number().int().min(0).optional());

const nvrSchema = z.object({
  site_id: z.string().min(1, "Selecciona un sitio"),
  name: z.string().min(2, "Minimo 2 caracteres"),
  code: optionalString(),
  vms_server_id: optionalString(),
  edition: optionalString(),
  vms_version: optionalString(),
  camera_channels: optionalNumber(),
  tpv_channels: optionalNumber(),
  lpr_channels: optionalNumber(),
  integration_connections: optionalNumber(),
  model: optionalString(),
  service_tag: optionalString(),
  service_code: optionalString(),
  processor: optionalString(),
  ram_gb: optionalNumber(),
  os_name: optionalString(),
  system_type: optionalString(),
  notes: optionalString(),
});

type NvrFormValues = z.output<typeof nvrSchema>;
type NvrFormInput = z.input<typeof nvrSchema>;

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
  const currentSite = useSiteStore((state) => state.currentSite);
  const isEdit = Boolean(nvr);

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: listSites,
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NvrFormInput, unknown, NvrFormValues>({
    resolver: zodResolver(nvrSchema),
    defaultValues: {
      site_id: currentSite?.id ?? "",
    },
  });

  useEffect(() => {
    if (nvr) {
      reset({
        site_id: nvr.site_id ?? currentSite?.id ?? "",
        name: nvr.name,
        code: nvr.code ?? "",
        vms_server_id: nvr.vms_server_id ?? "",
        edition: nvr.edition ?? "",
        vms_version: nvr.vms_version ?? "",
        camera_channels: nvr.camera_channels ?? undefined,
        tpv_channels: nvr.tpv_channels ?? undefined,
        lpr_channels: nvr.lpr_channels ?? undefined,
        integration_connections: nvr.integration_connections ?? undefined,
        model: nvr.model ?? "",
        service_tag: nvr.service_tag ?? "",
        service_code: nvr.service_code ?? "",
        processor: nvr.processor ?? "",
        ram_gb: nvr.ram_gb ?? undefined,
        os_name: nvr.os_name ?? "",
        system_type: nvr.system_type ?? "",
        notes: nvr.notes ?? "",
      });
      return;
    }

    reset({
      site_id: currentSite?.id ?? "",
      name: "",
      code: "",
      vms_server_id: "",
      edition: "",
      vms_version: "",
      camera_channels: undefined,
      tpv_channels: undefined,
      lpr_channels: undefined,
      integration_connections: undefined,
      model: "",
      service_tag: "",
      service_code: "",
      processor: "",
      ram_gb: undefined,
      os_name: "",
      system_type: "",
      notes: "",
    });
  }, [currentSite?.id, nvr, reset]);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      reset({ site_id: currentSite?.id ?? "" });
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar NVR base" : "Nuevo NVR"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "La edicion manual solo cubre los campos que el backend realmente actualiza. Red, almacenamiento, fechas y estado avanzado siguen dependiendo de importacion o procesos especializados."
              : "La alta manual registra el contexto del servidor y su configuracion base. Los campos tecnicos avanzados se mantienen honestamente acotados al contrato actual."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <Card className="border-amber-200 bg-amber-50/80">
            <CardContent className="flex gap-3 py-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div className="text-sm text-amber-950">
                <p className="font-medium">Contrato manual parcial</p>
                <p className="mt-1 text-xs text-amber-800">
                  La UI no promete captura manual de IP, MAC, almacenamiento, dias de grabacion ni
                  fechas operativas porque el backend actual no las persiste desde este formulario.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-sky-200 bg-sky-50/80">
            <CardContent className="flex gap-3 py-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
              <div className="text-sm text-sky-950">
                <p className="font-medium">Contexto recomendado</p>
                <p className="mt-1 text-xs text-sky-800">
                  Vincula cada NVR a un sitio. Ese contexto es el que consumen inventario, floor plans y
                  topologia cuando la operacion se filtra por sucursal.
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
                <Select
                  value={watch("site_id") ?? ""}
                  onValueChange={(value) => setValue("site_id", value ?? "", { shouldValidate: true })}
                  disabled={isEdit}
                >
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
                {isEdit && (
                  <p className="text-xs text-muted-foreground">
                    El cambio de sitio no se expone en edicion manual con el contrato actual.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vms_server_id">ID / referencia VMS</Label>
                <Input
                  id="vms_server_id"
                  {...register("vms_server_id")}
                  disabled={isEdit}
                />
                {isEdit && (
                  <p className="text-xs text-muted-foreground">
                    La referencia VMS permanece visible, pero hoy no se actualiza desde UI.
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Identificacion</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Codigo</Label>
                <Input id="code" placeholder="NVR-001" {...register("code")} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" {...register("model")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edition">Edicion</Label>
                <Input id="edition" {...register("edition")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vms_version">Version VMS</Label>
                <Input id="vms_version" {...register("vms_version")} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Capacidad manual disponible</legend>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="camera_channels">Canales camara</Label>
                <Input
                  id="camera_channels"
                  type="number"
                  {...register("camera_channels", { valueAsNumber: true })}
                  disabled={isEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpv_channels">Canales TPV</Label>
                <Input
                  id="tpv_channels"
                  type="number"
                  {...register("tpv_channels", { valueAsNumber: true })}
                  disabled={isEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lpr_channels">Canales LPR</Label>
                <Input
                  id="lpr_channels"
                  type="number"
                  {...register("lpr_channels", { valueAsNumber: true })}
                  disabled={isEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="integration_connections">Integraciones</Label>
                <Input
                  id="integration_connections"
                  type="number"
                  {...register("integration_connections", { valueAsNumber: true })}
                  disabled={isEdit}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="service_tag">Service Tag</Label>
                <Input id="service_tag" {...register("service_tag")} disabled={isEdit} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_code">Service Code</Label>
                <Input id="service_code" {...register("service_code")} disabled={isEdit} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="processor">Procesador</Label>
                <Input id="processor" {...register("processor")} disabled={isEdit} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ram_gb">RAM (GB)</Label>
                <Input
                  id="ram_gb"
                  type="number"
                  {...register("ram_gb", { valueAsNumber: true })}
                  disabled={isEdit}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="os_name">Sistema operativo</Label>
                <Input id="os_name" {...register("os_name")} disabled={isEdit} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="system_type">Tipo de sistema</Label>
                <Input id="system_type" {...register("system_type")} disabled={isEdit} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground">Notas</legend>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas operativas</Label>
              <Textarea id="notes" {...register("notes")} />
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cerrar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Actualizar base" : "Crear NVR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
