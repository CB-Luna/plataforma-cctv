-- 000019_assign_permissions_to_roles.down.sql
-- Eliminar asignaciones de permisos scoped a roles
-- Eliminar asignaciones de permisos con scope ':all' del super_admin
DELETE FROM auth.role_permissions
WHERE role_id IN (
        SELECT id
        FROM auth.roles
        WHERE name = 'super_admin'
    )
    AND permission_id IN (
        SELECT id
        FROM auth.permissions
        WHERE scope IN ('all', 'own')
    );
-- Eliminar asignaciones de permisos scoped de tenant_admin
DELETE FROM auth.role_permissions
WHERE role_id IN (
        SELECT id
        FROM auth.roles
        WHERE name = 'tenant_admin'
    )
    AND permission_id IN (
        SELECT id
        FROM auth.permissions
        WHERE scope = 'own'
    );
-- Eliminar asignaciones de permisos scoped de Administrador
DELETE FROM auth.role_permissions
WHERE role_id IN (
        SELECT id
        FROM auth.roles
        WHERE name = 'Administrador'
    )
    AND permission_id IN (
        SELECT id
        FROM auth.permissions
        WHERE scope = 'own'
    );