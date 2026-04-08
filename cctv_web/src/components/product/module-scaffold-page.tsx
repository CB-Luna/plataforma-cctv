"use client";

import { ModuleScaffoldShell } from "@/components/product/module-scaffold-shell";
import { MODULE_SCAFFOLDS } from "@/lib/product/module-scaffolds";

export function ModuleScaffoldPage({
  moduleKey,
  activeSectionKey,
}: {
  moduleKey: keyof typeof MODULE_SCAFFOLDS;
  activeSectionKey: string;
}) {
  const scaffold = MODULE_SCAFFOLDS[moduleKey];

  return (
    <ModuleScaffoldShell
      serviceCode={scaffold.serviceCode}
      title={scaffold.title}
      summary={scaffold.summary}
      sections={scaffold.sections}
      activeSectionKey={activeSectionKey}
      backendGaps={scaffold.backendGaps}
      productNotes={scaffold.productNotes}
    />
  );
}
