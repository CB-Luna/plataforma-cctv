-- 000018_add_admin_global_menu.down.sql
-- Eliminar opción de menú "Administración Global"
-- Eliminar submenús primero
DELETE FROM auth.menu_items
WHERE code IN (
        'admin_users',
        'admin_tenants',
        'admin_roles',
        'admin_permissions',
        'admin_themes',
        'admin_menu',
        'admin_system'
    )
    AND tenant_id IS NULL;
-- Eliminar menú principal
DELETE FROM auth.menu_items
WHERE code = 'admin_global'
    AND tenant_id IS NULL;