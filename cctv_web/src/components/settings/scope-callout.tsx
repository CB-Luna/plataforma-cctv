"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ScopeCalloutProps {
  badge: string;
  title: string;
  description: string;
  accent?: "platform" | "tenant";
  footer?: ReactNode;
}

const accentMap = {
  platform: {
    wrapper: "border-blue-200/70 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/20",
    badge: "bg-blue-600 text-white hover:bg-blue-600",
  },
  tenant: {
    wrapper: "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20",
    badge: "bg-emerald-600 text-white hover:bg-emerald-600",
  },
} as const;

export function ScopeCallout({
  badge,
  title,
  description,
  accent = "tenant",
  footer,
}: ScopeCalloutProps) {
  const styles = accentMap[accent];

  return (
    <Card className={styles.wrapper}>
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={styles.badge}>{badge}</Badge>
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      {footer ? <CardContent className="pt-0">{footer}</CardContent> : null}
    </Card>
  );
}
