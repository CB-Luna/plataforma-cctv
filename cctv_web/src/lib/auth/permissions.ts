interface ParsedPermission {
  resource: string;
  action: string;
  scope?: string;
}

const SUPER_PERMISSION_CODES = new Set(["*", "super_admin", "admin:global"]);

function parsePermission(code: string): ParsedPermission | null {
  const trimmed = code.trim();
  if (!trimmed) return null;

  if (trimmed.includes(".")) {
    const [resource, action] = trimmed.split(".", 2);
    if (!resource || !action) return null;
    return { resource, action };
  }

  const [resource, action, scope] = trimmed.split(":");
  if (!resource || !action) return null;

  return {
    resource,
    action,
    scope: scope || undefined,
  };
}

export function matchesPermission(grantedCode: string, requiredCode: string): boolean {
  if (SUPER_PERMISSION_CODES.has(grantedCode)) return true;
  if (grantedCode === requiredCode) return true;

  const granted = parsePermission(grantedCode);
  const required = parsePermission(requiredCode);

  if (!granted || !required) return false;
  if (granted.resource !== required.resource || granted.action !== required.action) return false;

  if (!required.scope) return true;
  if (!granted.scope) return true;

  return granted.scope === required.scope || granted.scope === "all";
}

export function hasAnyPermission(grantedCodes: string[], requiredCodes: string[]): boolean {
  if (requiredCodes.length === 0) return true;

  return grantedCodes.some((grantedCode) =>
    requiredCodes.some((requiredCode) => matchesPermission(grantedCode, requiredCode)),
  );
}

export function hasPermission(grantedCodes: string[], requiredCode: string): boolean {
  return hasAnyPermission(grantedCodes, [requiredCode]);
}
