-- Script de datos de prueba para SyMTickets CCTV
-- Este script crea un tenant y usuarios de prueba con diferentes roles
-- ============================================
-- 1. Verificar/Crear Tenant de prueba
-- ============================================
-- Eliminar datos existentes si es necesario (para pruebas limpias)
-- DELETE FROM auth.user_roles;
-- DELETE FROM auth.role_permissions;
-- DELETE FROM auth.users;
-- DELETE FROM auth.roles;
-- DELETE FROM public.tenants WHERE slug = 'demo';
-- Crear tenant de prueba (si no existe)
INSERT INTO public.tenants (id, name, slug, is_active)
VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'Empresa Demo CCTV',
        'demo',
        true
    ) ON CONFLICT (slug) DO NOTHING;
-- ============================================
-- 2. Crear Roles
-- ============================================
INSERT INTO auth.roles (id, tenant_id, name, description, is_system)
VALUES -- Roles del sistema
    (
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000',
        'Administrador',
        'Acceso total al sistema',
        false
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440000',
        'Operador',
        'Operador del sistema de tickets',
        false
    ),
    (
        '550e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440000',
        'Técnico',
        'Técnico de campo',
        false
    ),
    (
        '550e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440000',
        'Visualizador',
        'Solo lectura',
        false
    ) ON CONFLICT (id) DO NOTHING;
-- ============================================
-- 3. Crear Permisos básicos
-- ============================================
-- Nota: se insertan por code y luego las asignaciones a roles tambien se
-- resuelven por code para no depender de UUIDs fijos cuando el catalogo ya
-- fue sembrado por migraciones previas.
INSERT INTO auth.permissions (id, code, description, module)
VALUES (
        '650e8400-e29b-41d4-a716-446655440001',
        'users.read',
        'Ver usuarios',
        'users'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440002',
        'users.write',
        'Crear/editar usuarios',
        'users'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440003',
        'users.delete',
        'Eliminar usuarios',
        'users'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440004',
        'tickets.read',
        'Ver tickets',
        'tickets'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440005',
        'tickets.write',
        'Crear/editar tickets',
        'tickets'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440006',
        'tickets.delete',
        'Eliminar tickets',
        'tickets'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440007',
        'clients.read',
        'Ver clientes',
        'clients'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440008',
        'clients.write',
        'Crear/editar clientes',
        'clients'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440009',
        'roles.read',
        'Ver roles',
        'roles'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440010',
        'roles.write',
        'Crear/editar roles',
        'roles'
    ) ON CONFLICT (code) DO NOTHING;
-- ============================================
-- 4. Asignar permisos a roles
-- ============================================
-- Administrador: todos los permisos
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT '550e8400-e29b-41d4-a716-446655440001',
    id
FROM auth.permissions ON CONFLICT DO NOTHING;
-- Operador: lectura/escritura de tickets y clientes
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT '550e8400-e29b-41d4-a716-446655440002',
    p.id
FROM auth.permissions p
WHERE p.code IN (
        'tickets.read',
        'tickets.write',
        'clients.read',
        'clients.write'
    ) ON CONFLICT DO NOTHING;
-- Técnico: lectura/escritura de tickets
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT '550e8400-e29b-41d4-a716-446655440003',
    p.id
FROM auth.permissions p
WHERE p.code IN (
        'tickets.read',
        'tickets.write',
        'clients.read'
    ) ON CONFLICT DO NOTHING;
-- Visualizador: solo lectura
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT '550e8400-e29b-41d4-a716-446655440004',
    p.id
FROM auth.permissions p
WHERE p.code IN (
        'users.read',
        'tickets.read',
        'clients.read',
        'roles.read'
    ) ON CONFLICT DO NOTHING;
-- ============================================
-- 5. Crear Usuarios de prueba
-- ============================================
-- Todas las contraseñas son: Password123!
-- Hash bcrypt de "Password123!" con cost 10 (generado con scripts/generate_hash.go)
INSERT INTO auth.users (
        id,
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        is_active,
        email_verified
    )
VALUES -- Administrador
    (
        '750e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000',
        'admin@demo.com',
        '$2a$10$e5Hr7eSJjLYBTBF2UVGKQeVQBGFduNuWSb4029sI.6nsD7RBQyK9i',
        'Admin',
        'Sistema',
        '5551234567',
        true,
        true
    ),
    -- Operador
    (
        '750e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440000',
        'operador@demo.com',
        '$2a$10$e5Hr7eSJjLYBTBF2UVGKQeVQBGFduNuWSb4029sI.6nsD7RBQyK9i',
        'Juan',
        'Operador',
        '5552345678',
        true,
        true
    ),
    -- Técnico
    (
        '750e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440000',
        'tecnico@demo.com',
        '$2a$10$e5Hr7eSJjLYBTBF2UVGKQeVQBGFduNuWSb4029sI.6nsD7RBQyK9i',
        'Carlos',
        'Técnico',
        '5553456789',
        true,
        true
    ),
    -- Visualizador
    (
        '750e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440000',
        'viewer@demo.com',
        '$2a$10$e5Hr7eSJjLYBTBF2UVGKQeVQBGFduNuWSb4029sI.6nsD7RBQyK9i',
        'María',
        'Visualizadora',
        '5554567890',
        true,
        true
    ),
    -- Usuario sin rol (para pruebas)
    (
        '750e8400-e29b-41d4-a716-446655440005',
        '550e8400-e29b-41d4-a716-446655440000',
        'usuario@demo.com',
        '$2a$10$e5Hr7eSJjLYBTBF2UVGKQeVQBGFduNuWSb4029sI.6nsD7RBQyK9i',
        'Usuario',
        'Sin Rol',
        '5555678901',
        true,
        true
    ) ON CONFLICT (id) DO NOTHING;
-- ============================================
-- 6. Asignar roles a usuarios
-- ============================================
INSERT INTO auth.user_roles (user_id, role_id)
VALUES -- Admin
    (
        '750e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440001'
    ),
    -- Operador
    (
        '750e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440002'
    ),
    -- Técnico
    (
        '750e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440003'
    ),
    -- Visualizador
    (
        '750e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440004'
    ) ON CONFLICT DO NOTHING;
-- ============================================
-- Verificación
-- ============================================
-- Ver usuarios creados
SELECT u.email,
    u.first_name,
    u.last_name,
    COALESCE(string_agg(r.name, ', '), 'Sin rol') as roles
FROM auth.users u
    LEFT JOIN auth.user_roles ur ON u.id = ur.user_id
    LEFT JOIN auth.roles r ON ur.role_id = r.id
WHERE u.tenant_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY u.id,
    u.email,
    u.first_name,
    u.last_name
ORDER BY u.email;
