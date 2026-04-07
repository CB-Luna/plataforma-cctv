"use client";

import { ShieldX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface AccessDeniedStateProps {
  title: string;
  description: string;
}

export function AccessDeniedState({ title, description }: AccessDeniedStateProps) {
  return (
    <EmptyState
      icon={ShieldX}
      title={title}
      description={description}
      className="min-h-[50vh] rounded-2xl border border-dashed border-border bg-background"
    />
  );
}
