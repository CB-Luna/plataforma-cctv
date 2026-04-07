-- 000027_add_policies_sla_support.up.sql
-- Extiende policies y tickets con soporte formal de pólizas vinculadas a activos y SLA tenant-aware

-- ==================== POLICIES EXTENSIONS ====================

ALTER TABLE policies.policies
    ADD COLUMN IF NOT EXISTS vendor VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contract_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS annual_value DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS coverage_json JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Relación póliza -> activos de inventario especializado
CREATE TABLE IF NOT EXISTS policies.policy_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies.policies(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES inventory.equipment(id) ON DELETE CASCADE,
    nvr_server_id UUID REFERENCES inventory.nvr_servers(id) ON DELETE CASCADE,
    camera_id UUID REFERENCES inventory.cameras(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_policy_assets_one_target CHECK (
        equipment_id IS NOT NULL
        OR nvr_server_id IS NOT NULL
        OR camera_id IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_policy_assets_equipment
    ON policies.policy_assets(policy_id, equipment_id)
    WHERE equipment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_policy_assets_nvr
    ON policies.policy_assets(policy_id, nvr_server_id)
    WHERE nvr_server_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_policy_assets_camera
    ON policies.policy_assets(policy_id, camera_id)
    WHERE camera_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_policy_assets_tenant ON policies.policy_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_assets_policy ON policies.policy_assets(policy_id);

-- ==================== SLA CORE ====================

CREATE TYPE tickets.sla_status AS ENUM (
    'unknown',
    'ok',
    'at_risk',
    'breached'
);

CREATE TYPE tickets.coverage_status AS ENUM (
    'unknown',
    'covered',
    'partial',
    'not_covered'
);

CREATE TABLE IF NOT EXISTS tickets.sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    ticket_priority tickets.ticket_priority,
    ticket_type tickets.ticket_type,
    response_time_hours INT NOT NULL CHECK (response_time_hours > 0),
    resolution_time_hours INT NOT NULL CHECK (resolution_time_hours > 0),
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    business_hours JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sla_policy_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sla_policies_tenant ON tickets.sla_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sla_policies_tenant_priority_active
    ON tickets.sla_policies(tenant_id, ticket_priority, is_active);
CREATE INDEX IF NOT EXISTS idx_sla_policies_tenant_type_active
    ON tickets.sla_policies(tenant_id, ticket_type, is_active);

CREATE TABLE IF NOT EXISTS tickets.ticket_sla_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
    sla_policy_id UUID REFERENCES tickets.sla_policies(id) ON DELETE SET NULL,
    priority_snapshot tickets.ticket_priority,
    type_snapshot tickets.ticket_type,
    response_time_hours INT,
    resolution_time_hours INT,
    due_response_at TIMESTAMPTZ,
    due_resolution_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    breached_response BOOLEAN NOT NULL DEFAULT false,
    breached_resolution BOOLEAN NOT NULL DEFAULT false,
    status tickets.sla_status NOT NULL DEFAULT 'unknown',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ticket_sla_instances_ticket UNIQUE (ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_sla_instances_tenant ON tickets.ticket_sla_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ticket_sla_instances_due_response ON tickets.ticket_sla_instances(due_response_at);
CREATE INDEX IF NOT EXISTS idx_ticket_sla_instances_due_resolution ON tickets.ticket_sla_instances(due_resolution_at);

CREATE TABLE IF NOT EXISTS tickets.ticket_policy_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policies.policies(id) ON DELETE SET NULL,
    coverage_status tickets.coverage_status NOT NULL DEFAULT 'unknown',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ticket_policy_links_ticket UNIQUE (ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_policy_links_tenant ON tickets.ticket_policy_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ticket_policy_links_policy ON tickets.ticket_policy_links(policy_id);

-- ==================== PERMISSIONS ====================

INSERT INTO auth.permissions (code, description, module, scope)
VALUES
    ('policies.read', 'Ver pólizas', 'policies', 'own'),
    ('policies.write', 'Crear/editar pólizas', 'policies', 'own'),
    ('policies.delete', 'Eliminar pólizas', 'policies', 'own'),
    ('sla.read', 'Ver políticas SLA', 'sla', 'own'),
    ('sla.write', 'Crear/editar políticas SLA', 'sla', 'own'),
    ('sla.delete', 'Eliminar políticas SLA', 'sla', 'own'),
    ('policies:read:all', 'Ver pólizas (scope all)', 'policies', 'all'),
    ('policies:write:all', 'Crear/editar pólizas (scope all)', 'policies', 'all'),
    ('policies:delete:all', 'Eliminar pólizas (scope all)', 'policies', 'all'),
    ('sla:read:all', 'Ver SLA (scope all)', 'sla', 'all'),
    ('sla:write:all', 'Crear/editar SLA (scope all)', 'sla', 'all'),
    ('sla:delete:all', 'Eliminar SLA (scope all)', 'sla', 'all')
ON CONFLICT (code) DO UPDATE
SET description = EXCLUDED.description,
    scope = EXCLUDED.scope;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN (
    'policies:read:all',
    'policies:write:all',
    'policies:delete:all',
    'sla:read:all',
    'sla:write:all',
    'sla:delete:all'
)
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
JOIN auth.permissions p ON p.code IN (
    'policies.read',
    'policies.write',
    'policies.delete',
    'sla.read',
    'sla.write',
    'sla.delete'
)
WHERE r.name = 'tenant_admin'
ON CONFLICT DO NOTHING;
