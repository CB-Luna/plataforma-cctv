"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Error boundary para todas las paginas del dashboard.
 * Atrapa errores de renderizado sin romper el layout (sidebar + header siguen funcionales).
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-lg border-destructive/30">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Error en esta pagina</h2>
            <p className="text-sm text-muted-foreground">
              Ocurrio un problema al cargar esta seccion. El resto de la plataforma sigue funcionando.
            </p>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="w-full rounded-md border bg-muted/50 p-3 text-left">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                Detalle tecnico (solo dev)
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-destructive">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Regresar
            </Button>
            <Button onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
