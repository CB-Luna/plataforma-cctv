-- 000020_menu_templates.down.sql
-- Revertir sistema de plantillas de menú
-- Eliminar asignaciones
DROP TABLE IF EXISTS auth.tenant_menu_assignments;
-- Quitar template_id de menu_items
ALTER TABLE auth.menu_items DROP COLUMN IF EXISTS template_id;
-- Eliminar tabla de plantillas
DROP TABLE IF EXISTS auth.menu_templates;