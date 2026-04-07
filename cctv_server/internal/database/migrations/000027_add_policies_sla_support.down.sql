-- 000027_add_policies_sla_support.down.sql
-- Revertir soporte de pólizas/SLA añadido en 000027

DELETE FROM auth.role_permissions rp
USING auth.permissions p
WHERE rp.permission_id = p.id
  AND p.code IN (
    'policies.read',
    'policies.write',
    'policies.delete',
    'sla.read',
    'sla.write',
    'sla.delete',
    'policies:read:all',
    'policies:write:all',
    'policies:delete:all',
    'sla:read:all',
    'sla:write:all',
    'sla:delete:all'
  );

DELETE FROM auth.permissions
WHERE code IN (
    'policies.read',
    'policies.write',
    'policies.delete',
    'sla.read',
    'sla.write',
    'sla.delete',
    'policies:read:all',
    'policies:write:all',
    'policies:delete:all',
    'sla:read:all',
    'sla:write:all',
    'sla:delete:all'
);

DROP INDEX IF EXISTS tickets.idx_ticket_policy_links_policy;
DROP INDEX IF EXISTS tickets.idx_ticket_policy_links_tenant;
DROP TABLE IF EXISTS tickets.ticket_policy_links;

DROP INDEX IF EXISTS tickets.idx_ticket_sla_instances_due_resolution;
DROP INDEX IF EXISTS tickets.idx_ticket_sla_instances_due_response;
DROP INDEX IF EXISTS tickets.idx_ticket_sla_instances_tenant;
DROP TABLE IF EXISTS tickets.ticket_sla_instances;

DROP INDEX IF EXISTS tickets.idx_sla_policies_tenant_type_active;
DROP INDEX IF EXISTS tickets.idx_sla_policies_tenant_priority_active;
DROP INDEX IF EXISTS tickets.idx_sla_policies_tenant;
DROP TABLE IF EXISTS tickets.sla_policies;

DROP TYPE IF EXISTS tickets.coverage_status;
DROP TYPE IF EXISTS tickets.sla_status;

DROP INDEX IF EXISTS policies.idx_policy_assets_policy;
DROP INDEX IF EXISTS policies.idx_policy_assets_tenant;
DROP INDEX IF EXISTS policies.uq_policy_assets_camera;
DROP INDEX IF EXISTS policies.uq_policy_assets_nvr;
DROP INDEX IF EXISTS policies.uq_policy_assets_equipment;
DROP TABLE IF EXISTS policies.policy_assets;

ALTER TABLE policies.policies
    DROP COLUMN IF EXISTS vendor,
    DROP COLUMN IF EXISTS contract_type,
    DROP COLUMN IF EXISTS annual_value,
    DROP COLUMN IF EXISTS coverage_json,
    DROP COLUMN IF EXISTS metadata;
