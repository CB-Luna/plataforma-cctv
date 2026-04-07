-- 000012_create_menu_items_table.down.sql
-- Rollback de tabla menu_items
DROP INDEX IF EXISTS auth.idx_menu_items_order;
DROP INDEX IF EXISTS auth.idx_menu_items_active;
DROP INDEX IF EXISTS auth.idx_menu_items_parent;
DROP INDEX IF EXISTS auth.idx_menu_items_tenant;
DROP TABLE IF EXISTS auth.menu_items;