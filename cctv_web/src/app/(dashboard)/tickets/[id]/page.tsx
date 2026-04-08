"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addTicketComment, getTicket, getTicketTimeline, listTicketComments } from "@/lib/api/tickets";
import { getPolicy } from "@/lib/api/policies";
import { PolicyCoverageSummary } from "@/components/contracts/policy-coverage-summary";
import { CoverageStatusBadge, SlaStatusBadge } from "@/components/contracts/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building2,
  Clock,
  MapPin,
  MessageSquare,
  Send,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  open: "Abierto",
  assigned: "Asignado",
  in_progress: "En progreso",
  pending_parts: "Esperando piezas",
  pending_client: "Esperando cliente",
  completed: "Completado",
  closed: "Cerrado",
  cancelled: "Cancelado",
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const typeLabels: Record<string, string> = {
  corrective: "Correctivo",
  preventive: "Preventivo",
  installation: "Instalacion",
  other: "Otro",
};

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">
        {typeof value === "boolean" ? (value ? "Si" : "No") : String(value)}
      </dd>
    </div>
  );
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicket(id),
  });

  const { data: linkedPolicy } = useQuery({
    queryKey: ["ticket-policy-detail", ticket?.policy?.policy_id],
    queryFn: () => getPolicy(ticket!.policy!.policy_id!),
    enabled: Boolean(ticket?.policy?.policy_id),
  });

  const { data: timeline } = useQuery({
    queryKey: ["ticket-timeline", id],
    queryFn: () => getTicketTimeline(id),
  });

  const { data: comments } = useQuery({
    queryKey: ["ticket-comments", id],
    queryFn: () => listTicketComments(id),
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => addTicketComment(id, { comment: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", id] });
      queryClient.invalidateQueries({ queryKey: ["ticket-timeline", id] });
      setComment("");
      toast.success("Comentario agregado");
    },
    onError: () => toast.error("Error al agregar comentario"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p>Ticket no encontrado</p>
        <Link href="/tickets" className="mt-2 text-sm text-primary underline">
          Volver al listado
        </Link>
      </div>
    );
  }

  const coverageStatus = ticket.policy?.coverage_status ?? ticket.coverage_status;
  const slaStatus = ticket.sla?.sla_status ?? ticket.sla_status;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tickets" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{ticket.ticket_number}</h1>
            <Badge variant={ticket.status === "completed" || ticket.status === "closed" ? "default" : "outline"}>
              {statusLabels[ticket.status] ?? ticket.status}
            </Badge>
            <CoverageStatusBadge status={coverageStatus} />
            <SlaStatusBadge status={slaStatus} />
          </div>
          <p className="text-muted-foreground">{ticket.title}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{typeLabels[ticket.type] ?? ticket.type}</Badge>
          <Badge variant={ticket.priority === "urgent" || ticket.priority === "high" ? "destructive" : "secondary"}>
            {priorityLabels[ticket.priority] ?? ticket.priority}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {ticket.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descripcion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline && timeline.length > 0 ? (
                <div className="space-y-3">
                  {timeline.map((entry) => (
                    <div key={entry.id} className="flex gap-3 border-l-2 pl-4 pb-3 text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{entry.event_type}</div>
                        {entry.description && <p className="text-muted-foreground">{entry.description}</p>}
                        {entry.old_value && entry.new_value && (
                          <p className="text-xs text-muted-foreground">
                            {entry.old_value} -&gt; {entry.new_value}
                          </p>
                        )}
                        {entry.user_name && (
                          <p className="text-xs text-muted-foreground">por {entry.user_name}</p>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString("es-MX")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin eventos registrados</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Comentarios ({comments?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments?.map((entry) => (
                <div key={entry.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{entry.user_name ?? "Usuario"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString("es-MX")}
                    </span>
                  </div>
                  <p className="text-sm">{entry.comment}</p>
                  {entry.is_internal && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Interno
                    </Badge>
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                <Textarea
                  placeholder="Escribe un comentario..."
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  disabled={!comment.trim() || commentMutation.isPending}
                  onClick={() => commentMutation.mutate(comment)}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Nombre" value={ticket.client_name} />
                <Field label="Email" value={ticket.client_email} />
                <Field label="Telefono" value={ticket.client_phone} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Sitio</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Nombre" value={ticket.site_name} />
                <Field label="Direccion" value={ticket.site_address} />
                <Field label="Ciudad" value={ticket.site_city} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Asignacion</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Tecnico" value={ticket.assigned_to_name} />
                <Field label="Email" value={ticket.assigned_to_email} />
                <Field label="Telefono" value={ticket.assigned_to_phone} />
                <Field label="Reportado por" value={ticket.reported_by_name} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Cobertura contractual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <CoverageStatusBadge status={coverageStatus} />
                {ticket.policy?.policy_id && (
                  <Link
                    href={`/policies/${ticket.policy.policy_id}`}
                    className="text-sm text-primary underline underline-offset-4"
                  >
                    {ticket.policy.policy_number ?? "Ver poliza"}
                  </Link>
                )}
              </div>

              <dl className="space-y-3">
                <Field label="Poliza" value={ticket.policy?.policy_number} />
                <Field label="Proveedor" value={ticket.policy?.policy_vendor} />
                <Field label="Tipo de contrato" value={ticket.policy?.policy_contract_type} />
              </dl>

              {linkedPolicy ? (
                <PolicyCoverageSummary policy={linkedPolicy} compact />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {ticket.policy?.policy_id
                    ? "La cobertura esta ligada a una poliza, pero el detalle contractual no pudo hidratarse."
                    : "Este ticket no tiene una poliza ligada. Puede quedar fuera de cobertura validada."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">SLA operativo</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.sla ? (
                <dl className="space-y-3">
                  <Field label="Politica" value={ticket.sla.sla_policy_name} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Estado</span>
                    <SlaStatusBadge status={ticket.sla.sla_status} />
                  </div>
                  <Field label="Respuesta requerida" value={ticket.sla.due_response_at ? new Date(ticket.sla.due_response_at).toLocaleString("es-MX") : undefined} />
                  <Field label="Resolucion requerida" value={ticket.sla.due_resolution_at ? new Date(ticket.sla.due_resolution_at).toLocaleString("es-MX") : undefined} />
                  <Field label="Respuesta incumplida" value={ticket.sla.breached_response} />
                  <Field label="Resolucion incumplida" value={ticket.sla.breached_resolution} />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  El backend actual permite tickets sin regla SLA. Este ticket no tiene una politica operativa ligada.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fechas</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Creado" value={new Date(ticket.created_at).toLocaleString("es-MX")} />
                <Field label="Actualizado" value={new Date(ticket.updated_at).toLocaleString("es-MX")} />
                <Field label="Programado" value={ticket.scheduled_date ? new Date(ticket.scheduled_date).toLocaleDateString("es-MX") : undefined} />
                <Field label="Iniciado" value={ticket.started_at ? new Date(ticket.started_at).toLocaleString("es-MX") : undefined} />
                <Field label="Completado" value={ticket.completed_at ? new Date(ticket.completed_at).toLocaleString("es-MX") : undefined} />
              </dl>
            </CardContent>
          </Card>

          {ticket.resolution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resolucion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{ticket.resolution}</p>
                {ticket.rating != null && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Calificacion: </span>
                    <span className="font-medium">{ticket.rating}/5</span>
                    {ticket.rating_comment && (
                      <p className="mt-1 text-xs text-muted-foreground">{ticket.rating_comment}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
