-- 000022_add_storage_menu_items.up.sql
-- Agregar items de menú para la gestión de almacenamiento y proveedores
-- 1. Item de menú principal: Almacenamiento (bajo Configuración)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        display_order,
        description
    )
VALUES (
        NULL,
        'storage_admin',
        'Almacenamiento',
        'perm_media',
        '/storage/providers',
        (
            SELECT id
            FROM auth.menu_items
            WHERE code = 'configuration'
                AND tenant_id IS NULL
            LIMIT 1
        ), 'storage.read', 5, 'Gestión de proveedores y configuraciones de almacenamiento'
    ) ON CONFLICT (code, tenant_id) DO NOTHING;
-- 2. Asegurar que los permisos existan
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'storage.read',
        'Ver configuraciones de almacenamiento',
        'storage',
        'own'
    ),
    (
        'storage.write',
        'Modificar configuraciones de almacenamiento',
        'storage',
        'own'
    ),
    (
        'storage.delete',
        'Eliminar configuraciones de almacenamiento',
        'storage',
        'own'
    ) ON CONFLICT (code) DO NOTHING;
-- 3. Asignar permisos al rol Administrador
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id,
    p.id
FROM auth.roles r
    CROSS JOIN auth.permissions p
WHERE r.name = 'Administrador'
    AND p.code IN (
        'storage.read',
        'storage.write',
        'storage.delete'
    ) ON CONFLICT DO NOTHING;