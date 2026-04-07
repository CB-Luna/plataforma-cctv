"use client";

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

const importSchema = z.object({
  batch_name: z.string().min(1, "Nombre requerido"),
  source_type: z.enum(["excel", "csv", "manual"]),
  target_table: z.enum(["cameras", "nvr_servers"]),
  source_filename: z.string().optional(),
});

export type ImportFormValues = z.infer<typeof importSchema>;

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ImportFormValues & { data: Record<string, unknown>[] }) => void;
  isLoading?: boolean;
}

export function ImportDialog({ open, onOpenChange, onSubmit, isLoading }: ImportDialogProps) {
  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      batch_name: "",
      source_type: "csv",
      target_table: "cameras",
      source_filename: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("source_filename", file.name);
      // For now we just capture the filename; actual parsing is done server-side
    }
  };

  const handleSubmit = form.handleSubmit((values) => {
    // Send with empty data array — server will parse from file
    onSubmit({ ...values, data: [] });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva importación</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch_name">Nombre del lote</Label>
            <Input
              id="batch_name"
              placeholder="Ej: Importación Cámaras Enero"
              {...form.register("batch_name")}
            />
            {form.formState.errors.batch_name && (
              <p className="text-sm text-destructive">{form.formState.errors.batch_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de fuente</Label>
              <Select
                value={form.watch("source_type")}
                onValueChange={(v) => form.setValue("source_type", v as ImportFormValues["source_type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tabla destino</Label>
              <Select
                value={form.watch("target_table")}
                onValueChange={(v) => form.setValue("target_table", v as ImportFormValues["target_table"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cameras">Cámaras</SelectItem>
                  <SelectItem value="nvr_servers">NVR Servers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.watch("source_type") !== "manual" && (
            <div className="space-y-2">
              <Label htmlFor="file">Archivo</Label>
              <Input
                id="file"
                type="file"
                accept={form.watch("source_type") === "csv" ? ".csv" : ".xlsx,.xls"}
                onChange={handleFileChange}
              />
              {form.watch("source_filename") && (
                <p className="text-xs text-muted-foreground">
                  Archivo: {form.watch("source_filename")}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando…" : "Crear lote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
