"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (technicianId: string) => void;
  isLoading?: boolean;
}

export function AssignDialog({ open, onOpenChange, onAssign, isLoading }: AssignDialogProps) {
  const [technicianId, setTechnicianId] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Asignar técnico</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="technician_id">ID del técnico</Label>
          <Input
            id="technician_id"
            placeholder="UUID del técnico"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!technicianId || isLoading}
            onClick={() => onAssign(technicianId)}
          >
            {isLoading ? "Asignando…" : "Asignar"}
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

export function StatusDialog({ open, onOpenChange, currentStatus, onChangeStatus, isLoading }: StatusDialogProps) {
  const [status, setStatus] = useState(currentStatus ?? "open");
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar estado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nuevo estado</Label>
            <Select value={status} onValueChange={(v) => { if (v) setStatus(v); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allStatuses
                  .filter((s) => s.value !== currentStatus)
                  .map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Razón (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={isLoading} onClick={() => onChangeStatus(status, reason || undefined)}>
            {isLoading ? "Cambiando…" : "Cambiar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
