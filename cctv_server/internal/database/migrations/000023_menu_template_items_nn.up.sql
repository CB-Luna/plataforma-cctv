-- 000023_menu_template_items_nn.up.sql
-- Migración a relación N:N entre menu_items y menu_templates
-- Esto permite que un mismo item de menú pueda estar en múltiples templates

-- 1. Crear tabla intermedia para la relación N:N
CREATE TABLE IF NOT EXISTS auth.menu_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES auth.menu_templates(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES auth.menu_items(id) ON DELETE CASCADE,
    display_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, menu_item_id)
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX idx_menu_template_items_template ON auth.menu_template_items(template_id);
CREATE INDEX idx_menu_template_items_item ON auth.menu_template_items(menu_item_id);
CREATE INDEX idx_menu_template_items_order ON auth.menu_template_items(template_id, display_order);

-- 3. Migrar datos existentes: copiar relaciones de template_id a la tabla intermedia
INSERT INTO auth.menu_template_items (template_id, menu_item_id, display_order, is_visible)
SELECT 
    template_id,
    id,
    COALESCE(display_order, 0),
    COALESCE(is_visible, true)
FROM auth.menu_items 
WHERE template_id IS NOT NULL
ON CONFLICT (template_id, menu_item_id) DO NOTHING;

-- 4. Para items sin template, asignarlos al template por defecto
INSERT INTO auth.menu_template_items (template_id, menu_item_id, display_order, is_visible)
SELECT 
    'a0000000-0000-0000-0000-000000000001'::UUID,
    id,
    COALESCE(display_order, 0),
    COALESCE(is_visible, true)
FROM auth.menu_items 
WHERE template_id IS NULL
ON CONFLICT (template_id, menu_item_id) DO NOTHING;

-- 5. Mantener template_id en menu_items como referencia del template "original"
-- pero ya no será la única forma de asignar items a templates
-- NO eliminamos template_id para mantener compatibilidad

-- 6. Comentarios
COMMENT ON TABLE auth.menu_template_items IS 'Relación N:N entre items de menú y templates. Un item puede estar en múltiples templates.';
COMMENT ON COLUMN auth.menu_template_items.display_order IS 'Orden de visualización específico para este item en este template';
COMMENT ON COLUMN auth.menu_template_items.is_visible IS 'Si el item es visible en este template específico';
