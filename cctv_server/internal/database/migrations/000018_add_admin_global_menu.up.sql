-- 000018_add_admin_global_menu.up.sql
-- Agregar opción de menú "Administración Global" para Super Admin
-- Verificar si ya existe antes de insertar
DO $$
DECLARE admin_menu_id UUID;
BEGIN -- Verificar si el menú principal ya existe
SELECT id INTO admin_menu_id
FROM auth.menu_items
WHERE code = 'admin_global'
    AND tenant_id IS NULL;
IF admin_menu_id IS NULL THEN -- Insertar menú principal de Administración Global
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        display_order,
        is_active,
        is_visible,
        description
    )
VALUES (
        NULL,
        -- Global (sin tenant específico)
        'admin_global',
        'Administración Global',
        'admin_panel_settings',
        '/admin',
        NULL,
        'admin:global',
        90,
        -- Orden alto para mostrar cerca del final
        true,
        true,
        'Panel de administración global del sistema'
    )
RETURNING id INTO admin_menu_id;
-- Insertar submenús
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        display_order,
        is_active,
        is_visible
    )
VALUES (
        NULL,
        'admin_users',
        'Usuarios',
        'people',
        '/admin?tab=users',
        admin_menu_id,
        'users:read:all',
        1,
        true,
        true
    ),
    (
        NULL,
        'admin_tenants',
        'Empresas',
        'business',
        '/admin?tab=tenants',
        admin_menu_id,
        'tenants:read:all',
        2,
        true,
        true
    ),
    (
        NULL,
        'admin_roles',
        'Roles',
        'admin_panel_settings',
        '/admin?tab=roles',
        admin_menu_id,
        'roles:read:all',
        3,
        true,
        true
    ),
    (
        NULL,
        'admin_permissions',
        'Permisos',
        'security',
        '/admin?tab=permissions',
        admin_menu_id,
        'permissions:read:all',
        4,
        true,
        true
    ),
    (
        NULL,
        'admin_themes',
        'Temas',
        'palette',
        '/admin?tab=themes',
        admin_menu_id,
        'themes:read:all',
        5,
        true,
        true
    ),
    (
        NULL,
        'admin_menu',
        'Menú',
        'menu',
        '/admin?tab=menu',
        admin_menu_id,
        'menu:read:all',
        6,
        true,
        true
    ),
    (
        NULL,
        'admin_system',
        'Sistema',
        'settings_applications',
        '/admin?tab=system',
        admin_menu_id,
        'system:read:all',
        7,
        true,
        true
    );
RAISE NOTICE 'Menú de Administración Global creado exitosamente';
ELSE RAISE NOTICE 'Menú de Administración Global ya existe (ID: %)',
admin_menu_id;
END IF;
END $$;