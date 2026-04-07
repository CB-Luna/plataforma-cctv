-- 000019_assign_permissions_to_roles.up.sql
-- Asignar permisos a roles del sistema
-- Asignar TODOS los permisos con scope ':all' al rol super_admin
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id as role_id,
    p.id as permission_id
FROM auth.roles r
    CROSS JOIN auth.permissions p
WHERE r.name = 'super_admin'
    AND (
        p.scope = 'all'
        OR p.code = 'admin:global'
    ) ON CONFLICT DO NOTHING;
-- Asignar permisos con scope ':own' al rol tenant_admin
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id as role_id,
    p.id as permission_id
FROM auth.roles r
    CROSS JOIN auth.permissions p
WHERE r.name = 'tenant_admin'
    AND p.scope = 'own' ON CONFLICT DO NOTHING;
-- Asignar permisos con scope ':own' al rol Administrador (igual que tenant_admin)
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id as role_id,
    p.id as permission_id
FROM auth.roles r
    CROSS JOIN auth.permissions p
WHERE r.name = 'Administrador'
    AND p.scope = 'own' ON CONFLICT DO NOTHING;
-- Asignar permisos básicos de lectura al rol Operador
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id as role_id,
    p.id as permission_id
FROM auth.roles r
    CROSS JOIN auth.permissions p
WHERE r.name = 'Operador'
    AND p.scope = 'own'
    AND (
        p.code LIKE 'tickets.%'
        OR p.code LIKE 'clients.read%'
        OR p.code LIKE 'inventory.read%'
    ) ON CONFLICT DO NOTHING;
-- Asignar permisos de técnico
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id as role_id,
    p.id as permission_id
FROM auth.roles r
    CROSS JOIN auth.permissions p
WHERE r.name = 'Técnico'
    AND p.scope = 'own'
    AND (
        p.code LIKE 'tickets.%'
        OR p.code LIKE 'worklogs.%'
        OR p.code = 'clients.read'
    ) ON CONFLICT DO NOTHING;
-- Asignar permisos de solo lectura al rol Visualizador
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id as role_id,
    p.id as permission_id
FROM auth.roles r
    CROSS JOIN auth.permissions p
WHERE r.name = 'Visualizador'
    AND p.scope = 'own'
    AND p.code LIKE '%.read%' ON CONFLICT DO NOTHING;
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