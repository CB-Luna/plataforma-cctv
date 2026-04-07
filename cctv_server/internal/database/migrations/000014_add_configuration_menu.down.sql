-- 000014_add_configuration_menu.down.sql
-- Eliminar item de menú de Configuración

DELETE FROM auth.menu_items WHERE code = 'configuration' AND tenant_id IS NULL;
