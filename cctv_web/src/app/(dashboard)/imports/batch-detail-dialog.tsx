"use client";

import type { ImportBatch, ImportBatchItem } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { getImportBatchItems, getImportBatchErrors } from "@/lib/api/imports";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface BatchDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: ImportBatch | null;
}

export function BatchDetailDialog({ open, onOpenChange, batch }: BatchDetailDialogProps) {
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["import-batch-items", batch?.id],
    queryFn: () => getImportBatchItems(batch!.id),
    enabled: !!batch,
  });

  const { data: errors, isLoading: errorsLoading } = useQuery({
    queryKey: ["import-batch-errors", batch?.id],
    queryFn: () => getImportBatchErrors(batch!.id),
    enabled: !!batch,
  });

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{batch.batch_name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Estado</span>
            <div className="mt-1">
              <Badge variant={batch.status === "completed" ? "default" : batch.status === "failed" ? "destructive" : "outline"}>
                {batch.status}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Total filas</span>
            <div className="mt-1 font-medium">{batch.total_rows ?? "—"}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Éxitos</span>
            <div className="mt-1 font-medium text-green-600">{batch.success_rows ?? 0}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Errores</span>
            <div className="mt-1 font-medium text-destructive">{batch.error_rows ?? 0}</div>
          </div>
        </div>

        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items">
              Elementos ({(items as ImportBatchItem[] | undefined)?.length ?? "…"})
            </TabsTrigger>
            <TabsTrigger value="errors">
              Errores ({(errors as ImportBatchItem[] | undefined)?.length ?? "…"})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="max-h-60 overflow-y-auto">
            {itemsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Datos</TableHead>
                    <TableHead>Mensaje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as ImportBatchItem[] | undefined)?.map((item, i) => (
                    <TableRow key={item.id ?? i}>
                      <TableCell>{item.row_number ?? i + 1}</TableCell>
                      <TableCell>
                        {item.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs font-mono">
                        {JSON.stringify(item.row_data).slice(0, 120)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.error_message ?? "—"}
                      </TableCell>
                    </TableRow>
                  )) ?? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Sin elementos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="errors" className="max-h-60 overflow-y-auto">
            {errorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Datos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(errors as ImportBatchItem[] | undefined)?.map((item, i) => (
                    <TableRow key={item.id ?? i}>
                      <TableCell>{item.row_number ?? i + 1}</TableCell>
                      <TableCell className="text-sm text-destructive">
                        {item.error_message ?? "Error desconocido"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs font-mono">
                        {JSON.stringify(item.row_data).slice(0, 120)}
                      </TableCell>
                    </TableRow>
                  )) ?? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Sin errores
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
