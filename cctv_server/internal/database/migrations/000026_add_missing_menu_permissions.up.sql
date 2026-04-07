-- 000026_add_missing_menu_permissions.up.sql
-- Agregar permisos faltantes que son requeridos por los items de menú
-- Permisos de administración
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'admin.read',
        'Ver panel de administración',
        'admin',
        'all'
    ),
    (
        'admin:read:all',
        'Ver panel de administración (scope all)',
        'admin',
        'all'
    ),
    (
        'admin:read:own',
        'Ver panel de administración (scope own)',
        'admin',
        'own'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de facturación
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'billing.read',
        'Ver módulo de facturación',
        'billing',
        'all'
    ),
    (
        'billing:read:all',
        'Ver facturación (scope all)',
        'billing',
        'all'
    ),
    (
        'billing:read:own',
        'Ver facturación (scope own)',
        'billing',
        'own'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de reportes
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'reports.read',
        'Ver módulo de reportes',
        'reports',
        'all'
    ),
    (
        'reports:read:all',
        'Ver reportes (scope all)',
        'reports',
        'all'
    ),
    (
        'reports:read:own',
        'Ver reportes (scope own)',
        'reports',
        'own'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de tenants
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'tenants.read',
        'Ver módulo de tenants',
        'tenants',
        'all'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de configuración
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'configuration.read',
        'Ver configuración del sistema',
        'configuration',
        'all'
    ),
    (
        'configuration:read:all',
        'Ver configuración (scope all)',
        'configuration',
        'all'
    ),
    (
        'configuration:read:own',
        'Ver configuración (scope own)',
        'configuration',
        'own'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de almacenamiento
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'storage.read',
        'Ver configuración de almacenamiento',
        'storage',
        'all'
    ),
    (
        'storage:read:all',
        'Ver almacenamiento (scope all)',
        'storage',
        'all'
    ),
    (
        'storage:read:own',
        'Ver almacenamiento (scope own)',
        'storage',
        'own'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de modelos de IA
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'ai_models.read',
        'Ver modelos de IA',
        'ai_models',
        'all'
    ),
    (
        'ai_models:read:all',
        'Ver modelos de IA (scope all)',
        'ai_models',
        'all'
    ),
    (
        'ai_models:read:own',
        'Ver modelos de IA (scope own)',
        'ai_models',
        'own'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Asignar todos los nuevos permisos con scope 'all' al rol super_admin
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id as role_id,
    p.id as permission_id
FROM auth.roles r
    CROSS JOIN auth.permissions p
WHERE r.name = 'super_admin'
    AND p.scope = 'all'
    AND p.code IN (
        'admin.read',
        'admin:read:all',
        'billing.read',
        'billing:read:all',
        'reports.read',
        'reports:read:all',
        'tenants.read',
        'configuration.read',
        'configuration:read:all',
        'storage.read',
        'storage:read:all',
        'ai_models.read',
        'ai_models:read:all'
    ) ON CONFLICT DO NOTHING;
-- Asignar permisos con scope 'own' al rol tenant_admin
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id as role_id,
    p.id as permission_id
FROM auth.roles r
    CROSS JOIN auth.permissions p
WHERE r.name = 'tenant_admin'
    AND p.scope = 'own'
    AND p.code IN (
        'admin:read:own',
        'billing:read:own',
        'reports:read:own',
        'configuration:read:own',
        'storage:read:own',
        'ai_models:read:own'
    ) ON CONFLICT DO NOTHING;
-- Mostrar resultado
DO $$
DECLARE role_rec RECORD;
perm_count INTEGER;
BEGIN FOR role_rec IN
SELECT id,
    name
FROM auth.roles
ORDER BY name LOOP
SELECT COUNT(*) INTO perm_count
FROM auth.role_permissions
WHERE role_id = role_rec.id;
RAISE NOTICE 'Rol "%": % permisos asignados',
role_rec.name,
perm_count;
END LOOP;
END $$;