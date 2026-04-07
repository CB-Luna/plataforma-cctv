-- 000017_seed_scoped_permissions.up.sql
-- Insertar permisos con scope para gestión de usuarios multi-tenant
-- Permisos de usuarios con scope 'own' (administrador de empresa)
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'users:read:own',
        'Ver usuarios del propio tenant',
        'users',
        'own'
    ),
    (
        'users:create:own',
        'Crear usuarios en el propio tenant',
        'users',
        'own'
    ),
    (
        'users:update:own',
        'Actualizar usuarios del propio tenant',
        'users',
        'own'
    ),
    (
        'users:delete:own',
        'Eliminar usuarios del propio tenant',
        'users',
        'own'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de usuarios con scope 'all' (super administrador)
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'users:read:all',
        'Ver todos los usuarios del sistema',
        'users',
        'all'
    ),
    (
        'users:create:all',
        'Crear usuarios en cualquier tenant',
        'users',
        'all'
    ),
    (
        'users:update:all',
        'Actualizar cualquier usuario del sistema',
        'users',
        'all'
    ),
    (
        'users:delete:all',
        'Eliminar cualquier usuario del sistema',
        'users',
        'all'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de empresas (tenants) con scope 'all'
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'tenants:read:all',
        'Ver todas las empresas',
        'tenants',
        'all'
    ),
    (
        'tenants:create:all',
        'Crear empresas',
        'tenants',
        'all'
    ),
    (
        'tenants:update:all',
        'Actualizar cualquier empresa',
        'tenants',
        'all'
    ),
    (
        'tenants:delete:all',
        'Eliminar empresas',
        'tenants',
        'all'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de roles con scope
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'roles:read:own',
        'Ver roles del propio tenant',
        'roles',
        'own'
    ),
    (
        'roles:read:all',
        'Ver todos los roles del sistema',
        'roles',
        'all'
    ),
    (
        'roles:create:all',
        'Crear roles globales',
        'roles',
        'all'
    ),
    (
        'roles:update:all',
        'Actualizar cualquier rol',
        'roles',
        'all'
    ),
    (
        'roles:delete:all',
        'Eliminar roles',
        'roles',
        'all'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de permisos (meta) con scope 'all'
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'permissions:read:all',
        'Ver todos los permisos',
        'permissions',
        'all'
    ),
    (
        'permissions:create:all',
        'Crear permisos',
        'permissions',
        'all'
    ),
    (
        'permissions:update:all',
        'Actualizar permisos',
        'permissions',
        'all'
    ),
    (
        'permissions:delete:all',
        'Eliminar permisos',
        'permissions',
        'all'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de menú con scope 'all'
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'menu:read:all',
        'Ver configuración de menú global',
        'menu',
        'all'
    ),
    (
        'menu:update:all',
        'Actualizar configuración de menú',
        'menu',
        'all'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de temas con scope
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'themes:read:own',
        'Ver tema del propio tenant',
        'themes',
        'own'
    ),
    (
        'themes:update:own',
        'Actualizar tema del propio tenant',
        'themes',
        'own'
    ),
    (
        'themes:read:all',
        'Ver temas de todas las empresas',
        'themes',
        'all'
    ),
    (
        'themes:update:all',
        'Actualizar tema de cualquier empresa',
        'themes',
        'all'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permisos de sistema con scope
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'system:read:own',
        'Ver configuración del sistema del tenant',
        'system',
        'own'
    ),
    (
        'system:update:own',
        'Actualizar configuración del sistema del tenant',
        'system',
        'own'
    ),
    (
        'system:read:all',
        'Ver configuración global del sistema',
        'system',
        'all'
    ),
    (
        'system:update:all',
        'Actualizar configuración global del sistema',
        'system',
        'all'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;
-- Permiso especial de administración global
INSERT INTO auth.permissions (code, description, module, scope)
VALUES (
        'admin:global',
        'Acceso al panel de Administración Global',
        'admin',
        'all'
    ) ON CONFLICT (code) DO
UPDATE
SET scope = EXCLUDED.scope,
    description = EXCLUDED.description;