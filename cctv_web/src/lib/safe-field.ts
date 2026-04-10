/**
 * Extrae un string seguro de un campo que el backend puede devolver como:
 * - string directo: "active"
 * - objeto envuelto: {inventory_equipment_status: "active", valid: true}
 * - null / undefined
 *
 * El backend de Go envuelve ciertos campos (camera_type, status, etc.)
 * en objetos con la forma {inventory_<campo>: valor, valid: boolean}.
 */
export function safeString(value: unknown, fallback = "—"): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    // Buscar la primera propiedad que no sea "valid"
    const entries = Object.entries(value as Record<string, unknown>);
    const main = entries.find(([key]) => key !== "valid");
    if (main && (typeof main[1] === "string" || typeof main[1] === "number")) {
      return String(main[1]);
    }
    return fallback;
  }
  return fallback;
}

/**
 * Extrae el status de un campo que puede ser string u objeto envuelto.
 * Retorna "active" | "inactive" | el valor string real.
 */
export function safeStatus(value: unknown, isActive?: boolean): string {
  const raw = safeString(value, "");
  if (raw) return raw;
  return isActive ? "active" : "inactive";
}
