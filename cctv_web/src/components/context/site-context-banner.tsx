"use client";

import { MapPin, X } from "lucide-react";
import type { SiteListItem } from "@/types/api";
import { describeSiteContext } from "@/lib/site-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SiteContextBannerProps {
  site: SiteListItem | null;
  title?: string;
  description?: string;
  mode?: "applied" | "informational";
  onClear?: () => void;
}

export function SiteContextBanner({
  site,
  title,
  description,
  mode = "applied",
  onClear,
}: SiteContextBannerProps) {
  if (!site) return null;

  return (
    <Card className={mode === "applied" ? "border-sky-200 bg-sky-50/80" : "border-amber-200 bg-amber-50/80"}>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className={`mt-0.5 rounded-xl p-2 ${mode === "applied" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-sm font-semibold ${mode === "applied" ? "text-sky-950" : "text-amber-950"}`}>
                {title ?? (mode === "applied" ? "Contexto de sitio activo" : "Contexto informativo de sitio")}
              </p>
              <Badge variant="outline">{site.name}</Badge>
            </div>
            <p className={`mt-1 text-sm ${mode === "applied" ? "text-sky-800" : "text-amber-800"}`}>
              {description ?? describeSiteContext(site)}
            </p>
          </div>
        </div>
        {onClear && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="mr-2 h-4 w-4" />
            Limpiar sitio
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
