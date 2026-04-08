"use client";

import { useEffect, useMemo } from "react";
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
import { listSlaPolicies } from "@/lib/api/sla";
import { getTicket } from "@/lib/api/tickets";
import {
  describeResolvedPolicySource,
  describeResolvedSlaSource,
  describeSlaScope,
  isPolicyCurrentlyActive,
  resolveSlaCandidate,
  resolveTicketPolicyCandidate,
  toDateInputValue,
} from "@/lib/contracts/contractual";
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

const typeLabels: Record<TicketFormValues["type"], string> = {
  corrective: "Correctivo",
  preventive: "Preventivo",
  installation: "Instalacion",
  other: "Otro",
};

const priorityLabels: Record<TicketFormValues["priority"], string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export function TicketDialog({
  open,
  onOpenChange,
  onSubmit,
  ticket,
  isLoading,
}: TicketDialogProps) {
  const currentSite = useSiteStore((s) => s.currentSite);
  const isEditMode = Boolean(ticket);
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

  const { data: ticketDetail, isLoading: isLoadingTicketDetail } = useQuery({
    queryKey: ["ticket-dialog", ticket?.id],
    queryFn: () => getTicket(ticket!.id),
    enabled: open && Boolean(ticket?.id),
    staleTime: 60 * 1000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", "ticket-form"],
    queryFn: () => listClients(200, 0),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites", "ticket-form"],
    queryFn: listSites,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["policies", "ticket-form"],
    queryFn: () => listPolicies({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const { data: slaPolicies = [] } = useQuery({
    queryKey: ["sla-policies", "ticket-form"],
    queryFn: listSlaPolicies,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const effectiveTicket = ticketDetail ?? ticket;
  const selectedClientId = form.watch("client_id");
  const selectedSiteId = form.watch("site_id");
  const selectedType = form.watch("type");
  const selectedPriority = form.watch("priority");
  const selectedPolicyId = form.watch("policy_id");
  const selectedClient = clients.find((client) => client.id === selectedClientId);

  const matchingSites = selectedClient
    ? sites.filter((site) => matchSiteToClient(site, selectedClient))
    : sites;
  const siteOptions = matchingSites.length > 0 ? matchingSites : sites;

  const policyOptions = useMemo(
    () =>
      policies.filter((policy) => {
        if (!isPolicyCurrentlyActive(policy)) return false;
        if (selectedClientId && policy.client_id !== selectedClientId) return false;
        if (selectedSiteId && policy.site_id && policy.site_id !== selectedSiteId) return false;
        return true;
      }),
    [policies, selectedClientId, selectedSiteId],
  );

  const candidatePolicy = useMemo(
    () =>
      resolveTicketPolicyCandidate({
        policies: policyOptions,
        clientId: selectedClientId,
        siteId: selectedSiteId,
        selectedPolicyId,
      }),
    [policyOptions, selectedClientId, selectedPolicyId, selectedSiteId],
  );

  const candidateSla = useMemo(
    () =>
      resolveSlaCandidate({
        policies: slaPolicies,
        priority: selectedPriority,
        type: selectedType,
      }),
    [selectedPriority, selectedType, slaPolicies],
  );

  useEffect(() => {
    if (effectiveTicket) {
      form.reset({
        title: effectiveTicket.title,
        description: effectiveTicket.description ?? "",
        client_id: effectiveTicket.client_id ?? "",
        site_id: effectiveTicket.site_id ?? "",
        type: (effectiveTicket.type as TicketFormValues["type"]) ?? "corrective",
        priority: (effectiveTicket.priority as TicketFormValues["priority"]) ?? "medium",
        policy_id: effectiveTicket.policy_id ?? ticketDetail?.policy?.policy_id ?? "",
        equipment_id: effectiveTicket.equipment_id ?? "",
        scheduled_date: toDateInputValue(ticketDetail?.scheduled_date),
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
  }, [currentSite?.id, effectiveTicket, form, ticketDetail?.scheduled_date]);

  useEffect(() => {
    if (!open || isEditMode || !currentSite) return;

    if (!form.getValues("site_id")) {
      form.setValue("site_id", currentSite.id, { shouldValidate: true });
    }

    if (!form.getValues("client_id")) {
      const inferredClient = clients.find((client) => matchSiteToClient(currentSite, client));
      if (inferredClient) {
        form.setValue("client_id", inferredClient.id, { shouldValidate: true });
      }
    }
  }, [clients, currentSite, form, isEditMode, open]);

  useEffect(() => {
    if (isEditMode) return;
    if (!selectedSiteId) return;
    if (siteOptions.some((site) => site.id === selectedSiteId)) return;

    form.setValue("site_id", "", { shouldValidate: true });
    form.setValue("policy_id", "");
  }, [form, isEditMode, selectedSiteId, siteOptions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar ticket" : "Crear ticket"}</DialogTitle>
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

          {isEditMode ? (
            <>
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                El backend actual no recompone poliza ni snapshot SLA en `PUT /tickets/:id`. Por eso el contexto contractual queda bloqueado despues de crear el ticket.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border px-3 py-3">
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="text-sm font-medium">{effectiveTicket?.client_name ?? "Sin cliente"}</p>
                </div>
                <div className="rounded-lg border px-3 py-3">
                  <p className="text-xs text-muted-foreground">Sitio</p>
                  <p className="text-sm font-medium">{effectiveTicket?.site_name ?? "Sin sitio"}</p>
                </div>
                <div className="rounded-lg border px-3 py-3">
                  <p className="text-xs text-muted-foreground">Poliza ligada</p>
                  <p className="text-sm font-medium">{effectiveTicket?.policy_number ?? "Auto-resuelta al crear o sin cobertura"}</p>
                </div>
                <div className="rounded-lg border px-3 py-3">
                  <p className="text-xs text-muted-foreground">Tipo y prioridad</p>
                  <p className="text-sm font-medium">
                    {typeLabels[(effectiveTicket?.type as TicketFormValues["type"]) ?? "corrective"]} · {priorityLabels[(effectiveTicket?.priority as TicketFormValues["priority"]) ?? "medium"]}
                  </p>
                </div>
              </div>

              {isLoadingTicketDetail ? (
                <div className="rounded-lg border px-3 py-3 text-sm text-muted-foreground">
                  Cargando detalle contractual del ticket...
                </div>
              ) : null}

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
                  <Label htmlFor="scheduled_date">Fecha programada</Label>
                  <Input id="scheduled_date" type="date" {...form.register("scheduled_date")} />
                </div>
              </div>
            </>
          ) : (
            <>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={selectedType}
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
                    value={selectedPriority}
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

              <div className="space-y-2">
                <Label>Poliza / cobertura (opcional)</Label>
                <Select
                  value={selectedPolicyId || "__none__"}
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
                        {policy.policy_number} · {policy.site_name ?? "Cobertura cliente"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Solo se muestran polizas activas y vigentes. Si no eliges una, el backend intentara resolver cobertura activa por cliente/sitio.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Cobertura contractual estimada
                  </p>
                  {candidatePolicy ? (
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="font-medium">{candidatePolicy.policy.policy_number}</p>
                      <p className="text-muted-foreground">
                        {describeResolvedPolicySource(candidatePolicy.source)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No hay poliza activa vigente para este cliente/sitio. El ticket podria quedar sin cobertura validada.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Regla SLA estimada
                  </p>
                  {candidateSla ? (
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="font-medium">{candidateSla.policy.name}</p>
                      <p className="text-muted-foreground">
                        {describeSlaScope(candidateSla.policy)} · {describeResolvedSlaSource(candidateSla.source)}
                      </p>
                      <p className="text-muted-foreground">
                        {candidateSla.policy.response_time_hours}h respuesta · {candidateSla.policy.resolution_time_hours}h resolucion
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No hay una regla SLA activa que coincida. El backend permite tickets sin SLA.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-sky-300 bg-sky-50 px-4 py-3 text-xs text-sky-800">
                La estimacion replica el orden real del backend: prioridad exacta, luego tipo exacto, luego regla default. El calculo usa horas corridas.
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_id">Activo / equipo (opcional)</Label>
                <Input
                  id="equipment_id"
                  placeholder="ID tecnico opcional si existe referencia externa"
                  {...form.register("equipment_id")}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || (isEditMode && isLoadingTicketDetail)}>
              {isLoading ? "Guardando..." : isEditMode ? "Actualizar" : "Crear ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
