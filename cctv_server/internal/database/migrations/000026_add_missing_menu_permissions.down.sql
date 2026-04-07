-- 000026_add_missing_menu_permissions.down.sql
-- Revertir permisos agregados
-- Eliminar asignaciones de permisos
DELETE FROM auth.role_permissions
WHERE permission_id IN (
        SELECT id
        FROM auth.permissions
        WHERE code IN (
                'admin.read',
                'admin:read:all',
                'admin:read:own',
                'billing.read',
                'billing:read:all',
                'billing:read:own',
                'reports.read',
                'reports:read:all',
                'reports:read:own',
                'tenants.read',
                'configuration.read',
                'configuration:read:all',
                'configuration:read:own',
                'storage.read',
                'storage:read:all',
                'storage:read:own',
                'ai_models.read',
                'ai_models:read:all',
                'ai_models:read:own'
            )
    );
-- Eliminar permisos
DELETE FROM auth.permissions
WHERE code IN (
        'admin.read',
        'admin:read:all',
        'admin:read:own',
        'billing.read',
        'billing:read:all',
        'billing:read:own',
        'reports.read',
        'reports:read:all',
        'reports:read:own',
        'tenants.read',
        'configuration.read',
        'configuration:read:all',
        'configuration:read:own',
        'storage.read',
        'storage:read:all',
        'storage:read:own',
        'ai_models.read',
        'ai_models:read:all',
        'ai_models:read:own'
    );