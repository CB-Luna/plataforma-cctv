"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTicket, getTicketTimeline, listTicketComments, addTicketComment } from "@/lib/api/tickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  Building2,
  MapPin,
  Shield,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  open: "Abierto", assigned: "Asignado", in_progress: "En progreso",
  pending_parts: "Esperando piezas", pending_client: "Esperando cliente",
  completed: "Completado", closed: "Cerrado", cancelled: "Cancelado",
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgente", high: "Alta", medium: "Media", low: "Baja",
};

const typeLabels: Record<string, string> = {
  corrective: "Correctivo", preventive: "Preventivo", installation: "Instalación", other: "Otro",
};

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">
        {typeof value === "boolean" ? (value ? "Sí" : "No") : String(value)}
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
        <Link href="/tickets" className="text-primary underline text-sm mt-2">Volver al listado</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tickets" className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{ticket.ticket_number}</h1>
            <Badge variant={ticket.status === "completed" || ticket.status === "closed" ? "default" : "outline"}>
              {statusLabels[ticket.status] ?? ticket.status}
            </Badge>
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
        {/* Left: Info cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {ticket.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline && timeline.length > 0 ? (
                <div className="space-y-3">
                  {timeline.map((entry) => (
                    <div key={entry.id} className="flex gap-3 text-sm border-l-2 pl-4 pb-3">
                      <div className="flex-1">
                        <div className="font-medium">{entry.event_type}</div>
                        {entry.description && <p className="text-muted-foreground">{entry.description}</p>}
                        {entry.old_value && entry.new_value && (
                          <p className="text-xs text-muted-foreground">
                            {entry.old_value} → {entry.new_value}
                          </p>
                        )}
                        {entry.user_name && (
                          <p className="text-xs text-muted-foreground">por {entry.user_name}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
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

          {/* Comments */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">
                Comentarios ({comments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments?.map((c) => (
                <div key={c.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{c.user_name ?? "Usuario"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("es-MX")}
                    </span>
                  </div>
                  <p className="text-sm">{c.comment}</p>
                  {c.is_internal && (
                    <Badge variant="outline" className="mt-1 text-xs">Interno</Badge>
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                <Textarea
                  placeholder="Escribe un comentario…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
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

        {/* Right sidebar: metadata */}
        <div className="space-y-6">
          {/* Client */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Nombre" value={ticket.client_name} />
                <Field label="Email" value={ticket.client_email} />
                <Field label="Teléfono" value={ticket.client_phone} />
              </dl>
            </CardContent>
          </Card>

          {/* Site */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Sitio</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Nombre" value={ticket.site_name} />
                <Field label="Dirección" value={ticket.site_address} />
                <Field label="Ciudad" value={ticket.site_city} />
              </dl>
            </CardContent>
          </Card>

          {/* Assigned */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Asignación</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Técnico" value={ticket.assigned_to_name} />
                <Field label="Email" value={ticket.assigned_to_email} />
                <Field label="Teléfono" value={ticket.assigned_to_phone} />
                <Field label="Reportado por" value={ticket.reported_by_name} />
              </dl>
            </CardContent>
          </Card>

          {/* SLA */}
          {ticket.sla && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">SLA</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <Field label="Política" value={ticket.sla.sla_policy_name} />
                  <Field label="Estado SLA" value={ticket.sla.sla_status} />
                  <Field label="Respuesta requerida" value={ticket.sla.due_response_at ? new Date(ticket.sla.due_response_at).toLocaleString("es-MX") : undefined} />
                  <Field label="Resolución requerida" value={ticket.sla.due_resolution_at ? new Date(ticket.sla.due_resolution_at).toLocaleString("es-MX") : undefined} />
                  <Field label="Respuesta incumplida" value={ticket.sla.breached_response} />
                  <Field label="Resolución incumplida" value={ticket.sla.breached_resolution} />
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
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

          {/* Resolution */}
          {ticket.resolution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resolución</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{ticket.resolution}</p>
                {ticket.rating != null && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Calificación: </span>
                    <span className="font-medium">{ticket.rating}/5</span>
                    {ticket.rating_comment && (
                      <p className="text-muted-foreground text-xs mt-1">{ticket.rating_comment}</p>
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
