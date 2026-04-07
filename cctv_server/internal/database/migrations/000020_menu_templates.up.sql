-- 000020_menu_templates.up.sql
-- Sistema de plantillas de menú para asignación por tenant
-- Tabla de plantillas de menú
CREATE TABLE auth.menu_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Agregar columna template_id a menu_items
ALTER TABLE auth.menu_items
ADD COLUMN template_id UUID REFERENCES auth.menu_templates(id) ON DELETE CASCADE;
-- Crear índice para template_id
CREATE INDEX idx_menu_items_template ON auth.menu_items(template_id);
-- Tabla de asignación de plantilla a tenant
CREATE TABLE auth.tenant_menu_assignments (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES auth.menu_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id)
);
-- Insertar plantilla por defecto
INSERT INTO auth.menu_templates (id, name, description, is_default)
VALUES (
        'a0000000-0000-0000-0000-000000000001',
        'Menú Estándar',
        'Menú completo con acceso a todos los módulos',
        true
    );
-- Asignar todos los items existentes a la plantilla por defecto
UPDATE auth.menu_items
SET template_id = 'a0000000-0000-0000-0000-000000000001'
WHERE template_id IS NULL;
-- Asignar la plantilla por defecto a todos los tenants existentes
INSERT INTO auth.tenant_menu_assignments (tenant_id, template_id)
SELECT id,
    'a0000000-0000-0000-0000-000000000001'
FROM public.tenants ON CONFLICT DO NOTHING;
-- Comentarios
COMMENT ON TABLE auth.menu_templates IS 'Plantillas de menú reutilizables';
COMMENT ON TABLE auth.tenant_menu_assignments IS 'Asignación de plantilla de menú por tenant';
COMMENT ON COLUMN auth.menu_items.template_id IS 'Plantilla a la que pertenece este item';