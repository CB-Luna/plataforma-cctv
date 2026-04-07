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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SlaPolicy } from "@/types/api";

const slaSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  ticket_priority: z.string().optional(),
  ticket_type: z.string().optional(),
  response_time_hours: z.number().min(0),
  resolution_time_hours: z.number().min(0),
  is_default: z.boolean(),
  is_active: z.boolean(),
});

export type SlaFormValues = z.infer<typeof slaSchema>;

interface SlaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SlaFormValues) => void;
  sla?: SlaPolicy | null;
  isLoading?: boolean;
}

export function SlaDialog({ open, onOpenChange, onSubmit, sla, isLoading }: SlaDialogProps) {
  const form = useForm<SlaFormValues>({
    resolver: zodResolver(slaSchema),
    defaultValues: {
      name: "",
      ticket_priority: "",
      ticket_type: "",
      response_time_hours: 4,
      resolution_time_hours: 24,
      is_default: false,
      is_active: true,
    },
  });

  useEffect(() => {
    if (sla) {
      form.reset({
        name: sla.name,
        ticket_priority: sla.ticket_priority ?? "",
        ticket_type: sla.ticket_type ?? "",
        response_time_hours: sla.response_time_hours,
        resolution_time_hours: sla.resolution_time_hours,
        is_default: sla.is_default,
        is_active: sla.is_active,
      });
    } else {
      form.reset({
        name: "",
        ticket_priority: "",
        ticket_type: "",
        response_time_hours: 4,
        resolution_time_hours: 24,
        is_default: false,
        is_active: true,
      });
    }
  }, [sla, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{sla ? "Editar Política SLA" : "Nueva Política SLA"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad del ticket</Label>
              <Select
                value={form.watch("ticket_priority") ?? ""}
                onValueChange={(v) => form.setValue("ticket_priority", v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de ticket</Label>
              <Select
                value={form.watch("ticket_type") ?? ""}
                onValueChange={(v) => form.setValue("ticket_type", v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrective">Correctivo</SelectItem>
                  <SelectItem value="preventive">Preventivo</SelectItem>
                  <SelectItem value="installation">Instalación</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tiempo de respuesta (h) *</Label>
              <Input
                type="number"
                min={0}
                {...form.register("response_time_hours", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tiempo de resolución (h) *</Label>
              <Input
                type="number"
                min={0}
                {...form.register("resolution_time_hours", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...form.register("is_default")}
                className="h-4 w-4 rounded border-gray-300"
              />
              Política por defecto
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...form.register("is_active")}
                className="h-4 w-4 rounded border-gray-300"
              />
              Activa
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : sla ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
