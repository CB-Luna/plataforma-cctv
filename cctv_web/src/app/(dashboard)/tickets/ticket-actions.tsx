"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getTechniciansWorkload } from "@/lib/api/tickets";
import { listUsers } from "@/lib/api/users";

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (technicianId: string) => void;
  isLoading?: boolean;
}

export function AssignDialog({ open, onOpenChange, onAssign, isLoading }: AssignDialogProps) {
  const [technicianId, setTechnicianId] = useState("");
  const { data: users = [] } = useQuery({
    queryKey: ["users", "ticket-assign"],
    queryFn: () => listUsers(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: workload = [] } = useQuery({
    queryKey: ["ticket-technicians-workload"],
    queryFn: getTechniciansWorkload,
    staleTime: 60 * 1000,
  });

  const technicians = useMemo(() => {
    const workloadByUser = new Map(
      workload.map((entry) => [
        entry.technician_id,
        {
          active_tickets: entry.active_tickets,
          urgent_tickets: entry.urgent_tickets,
          high_tickets: entry.high_tickets,
        },
      ]),
    );

    return users
      .filter((user) => user.is_active)
      .map((user) => ({
        ...user,
        active_tickets: workloadByUser.get(user.id)?.active_tickets ?? 0,
        urgent_tickets: workloadByUser.get(user.id)?.urgent_tickets ?? 0,
        high_tickets: workloadByUser.get(user.id)?.high_tickets ?? 0,
      }))
      .sort((left, right) => {
        if (left.active_tickets !== right.active_tickets) {
          return left.active_tickets - right.active_tickets;
        }

        if (left.urgent_tickets !== right.urgent_tickets) {
          return left.urgent_tickets - right.urgent_tickets;
        }

        return `${left.first_name} ${left.last_name}`.localeCompare(
          `${right.first_name} ${right.last_name}`,
          "es-MX",
        );
      });
  }, [users, workload]);

  const selectedTechnician = technicians.find((technician) => technician.id === technicianId);

  useEffect(() => {
    if (!open) setTechnicianId("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Asignar tecnico</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Tecnico</Label>
            <Select value={technicianId || undefined} onValueChange={(value) => setTechnicianId(value ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tecnico" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((technician) => (
                  <SelectItem key={technician.id} value={technician.id}>
                    {technician.first_name} {technician.last_name} · {technician.active_tickets} activos
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {technicians.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay usuarios activos disponibles para asignacion en este tenant.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-dashed border-sky-300 bg-sky-50 px-3 py-2 text-xs text-sky-800">
            La carga visible viene del endpoint real de workload. Se priorizan tecnicos con menos tickets activos.
          </div>

          {selectedTechnician && (
            <div className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                {selectedTechnician.first_name} {selectedTechnician.last_name}
              </p>
              <p>{selectedTechnician.email}</p>
              <p>
                {selectedTechnician.active_tickets} tickets activos · {selectedTechnician.urgent_tickets} urgentes · {selectedTechnician.high_tickets} altos
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!technicianId || isLoading} onClick={() => onAssign(technicianId)}>
            {isLoading ? "Asignando..." : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus?: string;
  onChangeStatus: (status: string, reason?: string) => void;
  isLoading?: boolean;
}

const allStatuses = [
  { value: "open", label: "Abierto" },
  { value: "assigned", label: "Asignado" },
  { value: "in_progress", label: "En progreso" },
  { value: "pending_parts", label: "Esperando piezas" },
  { value: "pending_client", label: "Esperando cliente" },
  { value: "completed", label: "Completado" },
  { value: "closed", label: "Cerrado" },
  { value: "cancelled", label: "Cancelado" },
];

function getSlaTransitionNote(status: string): string {
  if (status === "open") {
    return "Mientras siga abierto, el backend no marca primera respuesta ni resolucion SLA.";
  }

  if (status === "completed" || status === "closed" || status === "cancelled") {
    return "Esta transicion marca primera respuesta, resolucion y refresca el snapshot SLA del ticket.";
  }

  return "Cualquier transicion fuera de Abierto marca la primera respuesta SLA y refresca el estado actual.";
}

export function StatusDialog({
  open,
  onOpenChange,
  currentStatus,
  onChangeStatus,
  isLoading,
}: StatusDialogProps) {
  const [status, setStatus] = useState(currentStatus ?? "open");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setStatus(currentStatus ?? "open");
      setReason("");
    }
  }, [currentStatus, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar estado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nuevo estado</Label>
            <Select value={status} onValueChange={(value) => setStatus(value ?? "open")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allStatuses
                  .filter((item) => item.value !== currentStatus)
                  .map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {getSlaTransitionNote(status)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Razon (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={isLoading} onClick={() => onChangeStatus(status, reason || undefined)}>
            {isLoading ? "Cambiando..." : "Cambiar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
