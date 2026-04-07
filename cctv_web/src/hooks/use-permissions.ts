"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useCallback } from "react";

/**
 * Hook RBAC — Fase 1.10
 * Uso: const { can } = usePermissions();
 *      if (can("inventory:read")) { ... }
 */
export function usePermissions() {
  const permissions = useAuthStore((s) => s.permissions);
  const user = useAuthStore((s) => s.user);

  const can = useCallback(
    (code: string): boolean => {
      // Super-admin bypasses all checks
      if (permissions.some((p) => p.code === "super_admin" || p.code === "*")) {
        return true;
      }
      return permissions.some((p) => p.code === code);
    },
    [permissions],
  );

  const canAny = useCallback(
    (...codes: string[]): boolean => codes.some((c) => can(c)),
    [can],
  );

  const canAll = useCallback(
    (...codes: string[]): boolean => codes.every((c) => can(c)),
    [can],
  );

  return { can, canAny, canAll, permissions, user };
}
