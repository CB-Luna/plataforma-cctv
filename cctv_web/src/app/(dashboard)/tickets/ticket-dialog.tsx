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
import { listPolicies } from "@/lib/api/policies";
import { listSites } from "@/lib/api/sites";
import { useSiteStore } from "@/stores/site-store";
import { matchSiteToClient } from "@/lib/site-context";
import type { Ticket } from "@/types/api";

const ticketSchema = z.object({
  title: z.string().min(1, "Titulo requerido"),
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

export function TicketDialog({
  open,
  onOpenChange,
  onSubmit,
  ticket,
  isLoading,
}: TicketDialogProps) {
  const currentSite = useSiteStore((s) => s.currentSite);
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

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", "ticket-form"],
    queryFn: () => listClients(200, 0),
    staleTime: 5 * 60 * 1000,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites", "ticket-form"],
    queryFn: listSites,
    staleTime: 5 * 60 * 1000,
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["policies", "ticket-form"],
    queryFn: () => listPolicies({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
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
      return;
    }

    form.reset({
      title: "",
      description: "",
      client_id: "",
      site_id: currentSite?.id ?? "",
      type: "corrective",
      priority: "medium",
      policy_id: "",
      equipment_id: "",
      scheduled_date: "",
    });
  }, [currentSite?.id, form, ticket]);

  const selectedClientId = form.watch("client_id");
  const selectedSiteId = form.watch("site_id");
  const selectedClient = clients.find((client) => client.id === selectedClientId);

  const matchingSites = selectedClient
    ? sites.filter((site) => matchSiteToClient(site, selectedClient))
    : sites;
  const siteOptions = matchingSites.length > 0 ? matchingSites : sites;

  const policyOptions = policies.filter((policy) => {
    if (selectedClientId && policy.client_id !== selectedClientId) return false;
    if (selectedSiteId && policy.site_id && policy.site_id !== selectedSiteId) return false;
    return true;
  });

  useEffect(() => {
    if (!open || ticket || !currentSite) return;

    if (!form.getValues("site_id")) {
      form.setValue("site_id", currentSite.id, { shouldValidate: true });
    }

    if (!form.getValues("client_id")) {
      const inferredClient = clients.find((client) => matchSiteToClient(currentSite, client));
      if (inferredClient) {
        form.setValue("client_id", inferredClient.id, { shouldValidate: true });
      }
    }
  }, [clients, currentSite, form, open, ticket]);

  useEffect(() => {
    if (!selectedSiteId) return;
    if (siteOptions.some((site) => site.id === selectedSiteId)) return;

    form.setValue("site_id", "", { shouldValidate: true });
    form.setValue("policy_id", "");
  }, [form, selectedSiteId, siteOptions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket ? "Editar ticket" : "Crear ticket"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titulo</Label>
            <Input id="title" placeholder="Resumen del problema" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              placeholder="Descripcion detallada del problema"
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={selectedClientId || undefined}
                onValueChange={(value) => {
                  form.setValue("client_id", value ?? "", { shouldValidate: true });
                  form.setValue("site_id", "", { shouldValidate: true });
                  form.setValue("policy_id", "");
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

            <div className="space-y-2">
              <Label>Sitio / sucursal</Label>
              <Select
                value={selectedSiteId || undefined}
                onValueChange={(value) => {
                  form.setValue("site_id", value ?? "", { shouldValidate: true });
                  form.setValue("policy_id", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un sitio" />
                </SelectTrigger>
                <SelectContent>
                  {siteOptions.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.site_id && (
                <p className="text-sm text-destructive">{form.formState.errors.site_id.message}</p>
              )}
              {selectedClient && matchingSites.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  El cruce cliente-sitio usa coincidencia por nombre comercial porque la API de sitios no expone `client_id`.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Poliza / cobertura (opcional)</Label>
            <Select
              value={form.watch("policy_id") || "__none__"}
              onValueChange={(value) =>
                form.setValue("policy_id", value && value !== "__none__" ? value : "")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin poliza vinculada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin poliza vinculada</SelectItem>
                {policyOptions.map((policy) => (
                  <SelectItem key={policy.id} value={policy.id}>
                    {policy.policy_number} · {policy.client_name ?? "Cliente"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_id">Activo / equipo (opcional)</Label>
              <Input
                id="equipment_id"
                placeholder="ID tecnico opcional si existe referencia externa"
                {...form.register("equipment_id")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Fecha programada (opcional)</Label>
              <Input id="scheduled_date" type="date" {...form.register("scheduled_date")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => form.setValue("type", value as TicketFormValues["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrective">Correctivo</SelectItem>
                  <SelectItem value="preventive">Preventivo</SelectItem>
                  <SelectItem value="installation">Instalacion</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(value) => form.setValue("priority", value as TicketFormValues["priority"])}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : ticket ? "Actualizar" : "Crear ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
