/**
 * Constantes del tenant plataforma.
 *
 * El backend Go requiere que todo usuario tenga un tenant_id (JOIN obligatorio).
 * Los super_admins del sistema se asignan a un tenant especial "__PLATFORM__"
 * que el frontend debe ocultar de las listas de empresas reales.
 */

/** ID fijo del tenant plataforma en la base de datos */
export const PLATFORM_TENANT_ID = "00000000-0000-0000-0000-000000000001";

/** Slug del tenant plataforma */
export const PLATFORM_TENANT_SLUG = "__platform__";

/** Nombre interno del tenant plataforma */
export const PLATFORM_TENANT_NAME = "__PLATFORM__";

/** Verifica si un tenant_id corresponde al tenant plataforma (no es empresa real) */
export function isPlatformTenant(tenantId: string | null | undefined): boolean {
  return tenantId === PLATFORM_TENANT_ID;
}

/** Verifica si un slug corresponde al tenant plataforma */
export function isPlatformSlug(slug: string | null | undefined): boolean {
  return slug === PLATFORM_TENANT_SLUG;
}
