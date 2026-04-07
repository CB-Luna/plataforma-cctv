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
import type { Ticket } from "@/types/api";

const ticketSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  client_id: z.string().min(1, "Cliente requerido"),
  site_id: z.string().min(1, "Sitio requerido"),
  type: z.enum(["corrective", "preventive", "installation", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  policy_id: z.string().optional(),
  equipment_id: z.string().optional(),
  scheduled_date: z.string().optional(),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;

interface TicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TicketFormValues) => void;
  ticket?: Ticket | null;
  isLoading?: boolean;
}

export function TicketDialog({ open, onOpenChange, onSubmit, ticket, isLoading }: TicketDialogProps) {
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      client_id: "",
      site_id: "",
      type: "corrective",
      priority: "medium",
      policy_id: "",
      equipment_id: "",
      scheduled_date: "",
    },
  });

  useEffect(() => {
    if (ticket) {
      form.reset({
        title: ticket.title,
        description: ticket.description ?? "",
        client_id: ticket.client_id ?? "",
        site_id: ticket.site_id ?? "",
        type: (ticket.type as TicketFormValues["type"]) ?? "corrective",
        priority: (ticket.priority as TicketFormValues["priority"]) ?? "medium",
        policy_id: ticket.policy_id ?? "",
        equipment_id: ticket.equipment_id ?? "",
        scheduled_date: "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        client_id: "",
        site_id: "",
        type: "corrective",
        priority: "medium",
        policy_id: "",
        equipment_id: "",
        scheduled_date: "",
      });
    }
  }, [ticket, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket ? "Editar ticket" : "Crear ticket"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" placeholder="Resumen del problema" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción detallada del problema"
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">ID Cliente</Label>
              <Input id="client_id" placeholder="UUID del cliente" {...form.register("client_id")} />
              {form.formState.errors.client_id && (
                <p className="text-sm text-destructive">{form.formState.errors.client_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_id">ID Sitio</Label>
              <Input id="site_id" placeholder="UUID del sitio" {...form.register("site_id")} />
              {form.formState.errors.site_id && (
                <p className="text-sm text-destructive">{form.formState.errors.site_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as TicketFormValues["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrective">Correctivo</SelectItem>
                  <SelectItem value="preventive">Preventivo</SelectItem>
                  <SelectItem value="installation">Instalación</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => form.setValue("priority", v as TicketFormValues["priority"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_id">ID Equipo (opcional)</Label>
              <Input id="equipment_id" placeholder="UUID del equipo" {...form.register("equipment_id")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Fecha programada (opcional)</Label>
              <Input id="scheduled_date" type="date" {...form.register("scheduled_date")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando…" : ticket ? "Actualizar" : "Crear ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
