-- 000012_create_menu_items_table.up.sql
-- Tabla para gestión dinámica de menús
CREATE TABLE auth.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- NULL = menú global/sistema
    -- Identificación
    code VARCHAR(50) NOT NULL,
    -- 'dashboard', 'tickets', 'clients'
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    -- Navegación
    route VARCHAR(255),
    parent_id UUID REFERENCES auth.menu_items(id) ON DELETE CASCADE,
    -- Para submenús
    -- Permisos
    required_permission VARCHAR(100),
    -- 'tickets.read', 'users.write'
    -- Visualización
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    -- Badge (opcional)
    badge_text VARCHAR(20),
    badge_color VARCHAR(20),
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    -- Audit
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT uq_menu_item_code UNIQUE(tenant_id, code)
);
-- Índices
CREATE INDEX idx_menu_items_tenant ON auth.menu_items(tenant_id);
CREATE INDEX idx_menu_items_parent ON auth.menu_items(parent_id);
CREATE INDEX idx_menu_items_active ON auth.menu_items(is_active, is_visible);
CREATE INDEX idx_menu_items_order ON auth.menu_items(display_order);
-- Comentarios
COMMENT ON TABLE auth.menu_items IS 'Items de menú dinámicos y configurables por tenant';
COMMENT ON COLUMN auth.menu_items.tenant_id IS 'NULL = menú global disponible para todos los tenants';
COMMENT ON COLUMN auth.menu_items.parent_id IS 'ID del item padre para crear submenús';
COMMENT ON COLUMN auth.menu_items.required_permission IS 'Permiso requerido para ver este item';