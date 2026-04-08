"use client";

import { Badge } from "@/components/ui/badge";
import { coverageStatusLabels, slaStatusLabels } from "@/lib/contracts/contractual";

const coverageStatusClasses: Record<string, string> = {
  covered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  partial: "border-amber-200 bg-amber-50 text-amber-700",
  not_covered: "border-red-200 bg-red-50 text-red-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-700",
};

const slaStatusClasses: Record<string, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  at_risk: "border-amber-200 bg-amber-50 text-amber-700",
  breached: "border-red-200 bg-red-50 text-red-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-700",
};

interface StatusBadgeProps {
  status?: string | null;
}

export function CoverageStatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status || "unknown";

  return (
    <Badge variant="outline" className={coverageStatusClasses[normalizedStatus] ?? coverageStatusClasses.unknown}>
      {coverageStatusLabels[normalizedStatus] ?? normalizedStatus}
    </Badge>
  );
}

export function SlaStatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status || "unknown";

  return (
    <Badge variant="outline" className={slaStatusClasses[normalizedStatus] ?? slaStatusClasses.unknown}>
      {slaStatusLabels[normalizedStatus] ?? normalizedStatus}
    </Badge>
  );
}
