CREATE TABLE inventory.floor_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES policies.sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    canvas_width INT NOT NULL DEFAULT 1200,
    canvas_height INT NOT NULL DEFAULT 800,
    grid_size INT NOT NULL DEFAULT 20,
    background_file_id UUID REFERENCES storage.files(id) ON DELETE SET NULL,
    document_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_floor_plans_tenant_site UNIQUE (tenant_id, site_id)
);

CREATE INDEX idx_floor_plans_tenant_site ON inventory.floor_plans(tenant_id, site_id);
CREATE INDEX idx_floor_plans_background_file ON inventory.floor_plans(background_file_id);

DROP TRIGGER IF EXISTS set_floor_plans_updated_at ON inventory.floor_plans;
CREATE TRIGGER set_floor_plans_updated_at
    BEFORE UPDATE ON inventory.floor_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
