-- 000023_menu_template_items_nn.down.sql
-- Rollback de migración N:N

-- Eliminar tabla intermedia
DROP INDEX IF EXISTS auth.idx_menu_template_items_order;
DROP INDEX IF EXISTS auth.idx_menu_template_items_item;
DROP INDEX IF EXISTS auth.idx_menu_template_items_template;
DROP TABLE IF EXISTS auth.menu_template_items;
