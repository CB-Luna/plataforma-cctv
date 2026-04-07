-- 000022_add_storage_menu_items.down.sql
-- Eliminar items de menú de almacenamiento
DELETE FROM auth.menu_items
WHERE code = 'storage_admin'
    AND tenant_id IS NULL;
-- No eliminamos los permisos ni las asignaciones para evitar efectos secundarios
-- en otros roles que podrían haberlos recibido manualmente.