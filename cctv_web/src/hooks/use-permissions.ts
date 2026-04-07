"use client";

import { useAuthStore } from "@/stores/auth-store";

/**
 * Hook RBAC — Fase 1.10
 * Uso: const { can } = usePermissions();
 *      if (can("inventory:read")) { ... }
 */
export function usePermissions() {
  const permissions = useAuthStore((s) => s.permissions);
  const user = useAuthStore((s) => s.user);
  const can = useAuthStore((s) => s.hasPermission);
  const canAny = useAuthStore((s) => s.hasAnyPermission);
  const canAll = (...codes: string[]): boolean => codes.every((code) => can(code));

  return { can, canAny, canAll, permissions, user };
}
