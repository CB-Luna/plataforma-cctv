"use client";

import { Badge } from "@/components/ui/badge";
import {
  PRODUCT_SERVICE_DEFINITIONS,
  getServiceStatusMeta,
  type ProductServiceCode,
} from "@/lib/product/service-catalog";

export function ServiceBadges({
  services,
  compact = false,
}: {
  services: ProductServiceCode[];
  compact?: boolean;
}) {
  if (!services.length) {
    return <Badge variant="outline">Sin servicios operativos</Badge>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {services.map((serviceCode) => {
        const service = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
        const statusMeta = getServiceStatusMeta(service.status);

        return (
          <Badge
            key={service.code}
            variant={statusMeta.tone === "default" ? "default" : "secondary"}
            title={compact ? service.description : undefined}
          >
            {compact ? service.shortLabel : `${service.label} - ${statusMeta.label}`}
          </Badge>
        );
      })}
    </div>
  );
}
