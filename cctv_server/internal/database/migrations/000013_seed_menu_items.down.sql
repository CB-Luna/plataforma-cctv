-- 000013_seed_menu_items.down.sql
-- Rollback del seed de menú
DELETE FROM auth.menu_items
WHERE tenant_id IS NULL;