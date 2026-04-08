"use client";

import type { Policy } from "@/types/api";
import {
  assetScopeLabels,
  parsePolicyCoverage,
  serviceFamilyLabels,
  serviceWindowLabels,
} from "@/lib/contracts/contractual";
import { Badge } from "@/components/ui/badge";

interface PolicyCoverageSummaryProps {
  policy?: Pick<Policy, "coverage_json" | "site_id"> | null;
  compact?: boolean;
}

export function PolicyCoverageSummary({
  policy,
  compact = false,
}: PolicyCoverageSummaryProps) {
  const coverage = parsePolicyCoverage(policy?.coverage_json, policy?.site_id);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Servicios cubiertos</p>
        <div className="flex flex-wrap gap-2">
          {coverage.covered_services.length > 0 ? (
            coverage.covered_services.map((service) => (
              <Badge key={service} variant="secondary">
                {serviceFamilyLabels[service]}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Sin familias declaradas</span>
          )}
        </div>
      </div>

      <div className={compact ? "grid gap-2 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2"}>
        <div>
          <p className="text-xs text-muted-foreground">Alcance de activos</p>
          <p className="text-sm font-medium">{assetScopeLabels[coverage.asset_scope]}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ventana de servicio</p>
          <p className="text-sm font-medium">{serviceWindowLabels[coverage.service_window]}</p>
        </div>
      </div>

      {coverage.coverage_notes && (
        <div>
          <p className="text-xs text-muted-foreground">Notas de cobertura</p>
          <p className="text-sm">{coverage.coverage_notes}</p>
        </div>
      )}
    </div>
  );
}
