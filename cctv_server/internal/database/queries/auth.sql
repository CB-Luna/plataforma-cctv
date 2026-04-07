-- internal/database/queries/auth.sql
-- Queries para autenticación y usuarios
-- name: CreateUser :one
INSERT INTO auth.users (
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        phone
    )
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
-- name: GetUserByEmail :one
SELECT *
FROM auth.users
WHERE tenant_id = $1
    AND email = $2
LIMIT 1;
-- name: GetUsersByEmailGlobal :many
SELECT u.*,
    t.name as tenant_name,
    t.slug as tenant_slug,
    t.logo_url as tenant_logo_url,
    t.primary_color as tenant_primary_color,
    t.secondary_color as tenant_secondary_color,
    t.tertiary_color as tenant_tertiary_color,
    t.settings as tenant_settings
FROM auth.users u
    JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = $1
    AND u.is_active = true
    AND t.is_active = true;
-- name: GetUserByID :one
SELECT u.*,
    t.name AS tenant_name,
    (
        SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        r.id,
                        'name',
                        r.name,
                        'description',
                        r.description
                    )
                    ORDER BY r.name
                ),
                '[]'::json
            )
        FROM auth.user_roles ur
            INNER JOIN auth.roles r ON r.id = ur.role_id
        WHERE ur.user_id = u.id
    ) AS roles
FROM auth.users u
    LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.id = $1
    AND u.tenant_id = $2
LIMIT 1;
-- name: ListUsersByTenant :many
SELECT u.*,
    t.name AS tenant_name,
    (
        SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        r.id,
                        'name',
                        r.name,
                        'description',
                        r.description
                    )
                    ORDER BY r.name
                ),
                '[]'::json
            )
        FROM auth.user_roles ur
            INNER JOIN auth.roles r ON r.id = ur.role_id
        WHERE ur.user_id = u.id
    ) AS roles
FROM auth.users u
    LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.tenant_id = $1
ORDER BY u.created_at DESC
LIMIT $2 OFFSET $3;
-- name: ListAllUsersGlobal :many
-- Query for super admin to list all users across all tenants
SELECT u.*,
    t.name AS tenant_name,
    (
        SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        r.id,
                        'name',
                        r.name,
                        'description',
                        r.description
                    )
                    ORDER BY r.name
                ),
                '[]'::json
            )
        FROM auth.user_roles ur
            INNER JOIN auth.roles r ON r.id = ur.role_id
        WHERE ur.user_id = u.id
    ) AS roles
FROM auth.users u
    LEFT JOIN public.tenants t ON u.tenant_id = t.id
ORDER BY t.name,
    u.created_at DESC
LIMIT $1 OFFSET $2;
-- name: ListUsersByTenantAdmin :many
-- Query for super admin to list users of a specific tenant
SELECT u.*,
    t.name AS tenant_name,
    (
        SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'id',
                        r.id,
                        'name',
                        r.name,
                        'description',
                        r.description
                    )
                    ORDER BY r.name
                ),
                '[]'::json
            )
        FROM auth.user_roles ur
            INNER JOIN auth.roles r ON r.id = ur.role_id
        WHERE ur.user_id = u.id
    ) AS roles
FROM auth.users u
    LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.tenant_id = $1
ORDER BY u.created_at DESC
LIMIT $2 OFFSET $3;
-- name: UpdateUser :one
UPDATE auth.users
SET first_name = $3,
    last_name = $4,
    phone = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2
RETURNING *;
-- name: UpdateUserPassword :exec
UPDATE auth.users
SET password_hash = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: DeactivateUser :exec
UPDATE auth.users
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: DeactivateUserGlobal :exec
UPDATE auth.users
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
-- name: VerifyUserEmail :exec
UPDATE auth.users
SET email_verified = true,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: UpdateLastLogin :exec
UPDATE auth.users
SET last_login_at = CURRENT_TIMESTAMP
WHERE id = $1;
-- name: UpdateUserAvatar :one
UPDATE auth.users
SET avatar_url = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2
RETURNING *;
-- Roles
-- name: CreateRole :one
INSERT INTO auth.roles (tenant_id, name, description)
VALUES ($1, $2, $3)
RETURNING *;
-- name: CreateSystemRole :one
INSERT INTO auth.roles (tenant_id, name, description, is_system)
VALUES (NULL, $1, $2, true)
RETURNING *;
-- name: GetRoleByID :one
SELECT *
FROM auth.roles
WHERE id = $1
    AND (
        tenant_id = $2
        OR tenant_id IS NULL
    )
LIMIT 1;
-- name: UpdateRole :one
UPDATE auth.roles
SET name = $3,
    description = $4
WHERE id = $1
    AND tenant_id = $2
    AND is_system = false
RETURNING *;
-- name: UpdateRoleGlobal :one
UPDATE auth.roles
SET name = $2,
    description = $3
WHERE id = $1
RETURNING *;
-- name: ListRolesByTenant :many
SELECT *
FROM auth.roles
WHERE tenant_id = $1
    OR tenant_id IS NULL
ORDER BY is_system DESC,
    name;
-- name: AssignRoleToUser :exec
INSERT INTO auth.user_roles (user_id, role_id)
VALUES ($1, $2) ON CONFLICT DO NOTHING;
-- name: RemoveRoleFromUser :exec
DELETE FROM auth.user_roles
WHERE user_id = $1
    AND role_id = $2;
-- name: GetUserRoles :many
SELECT r.*
FROM auth.roles r
    INNER JOIN auth.user_roles ur ON r.id = ur.role_id
WHERE ur.user_id = $1;
-- Permissions
-- name: ListAllPermissions :many
SELECT *
FROM auth.permissions
ORDER BY module,
    code;
-- name: CreatePermission :one
INSERT INTO auth.permissions (code, description, module, scope)
VALUES ($1, $2, $3, $4)
RETURNING *;
-- name: GetPermissionByCode :one
SELECT *
FROM auth.permissions
WHERE code = $1
LIMIT 1;
-- name: ListPermissionsByModule :many
SELECT *
FROM auth.permissions
WHERE module = $1
ORDER BY code;
-- name: ListPermissionsByScope :many
SELECT *
FROM auth.permissions
WHERE scope = $1
ORDER BY module,
    code;
-- name: AssignPermissionToRole :exec
INSERT INTO auth.role_permissions (role_id, permission_id)
VALUES ($1, $2) ON CONFLICT DO NOTHING;
-- name: GetRolePermissions :many
SELECT p.*
FROM auth.permissions p
    INNER JOIN auth.role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = $1;
-- name: GetUserPermissions :many
SELECT DISTINCT p.*
FROM auth.permissions p
    INNER JOIN auth.role_permissions rp ON p.id = rp.permission_id
    INNER JOIN auth.user_roles ur ON rp.role_id = ur.role_id
WHERE ur.user_id = $1;
-- Sessions
-- name: CreateSession :one
INSERT INTO auth.sessions (
        user_id,
        tenant_id,
        token_hash,
        device_info,
        ip_address,
        expires_at
    )
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
-- name: GetSessionByToken :one
SELECT *
FROM auth.sessions
WHERE token_hash = $1
    AND expires_at > CURRENT_TIMESTAMP
LIMIT 1;
-- name: DeleteSession :exec
DELETE FROM auth.sessions
WHERE id = $1;
-- name: DeleteExpiredSessions :exec
DELETE FROM auth.sessions
WHERE expires_at < CURRENT_TIMESTAMP;
-- Menu Templates
-- name: ListMenuTemplates :many
SELECT *
FROM auth.menu_templates
ORDER BY is_default DESC,
    name;
-- name: GetMenuTemplateForTenant :one
SELECT mt.*
FROM auth.menu_templates mt
    INNER JOIN auth.tenant_menu_assignments tma ON mt.id = tma.template_id
WHERE tma.tenant_id = $1
LIMIT 1;
-- name: GetMenuItemsByTemplate :many
-- Usa la tabla N:N menu_template_items para obtener items de un template
SELECT m.*
FROM auth.menu_items m
    INNER JOIN auth.menu_template_items mti ON m.id = mti.menu_item_id
WHERE mti.template_id = $1
    AND m.is_active = true
    AND mti.is_visible = true
ORDER BY mti.display_order, m.display_order;
-- name: AssignMenuTemplateToTenant :exec
INSERT INTO auth.tenant_menu_assignments (tenant_id, template_id)
VALUES ($1, $2) ON CONFLICT (tenant_id) DO
UPDATE
SET template_id = EXCLUDED.template_id;
-- name: CreateMenuTemplate :one
INSERT INTO auth.menu_templates (name, description, is_default)
VALUES ($1, $2, $3)
RETURNING *;
-- name: GetDefaultMenuTemplate :one
SELECT *
FROM auth.menu_templates
WHERE is_default = true
LIMIT 1;
-- name: GetTenantsForTemplate :many
SELECT t.id,
    t.name,
    t.slug,
    t.logo_url
FROM public.tenants t
    INNER JOIN auth.tenant_menu_assignments tma ON t.id = tma.tenant_id
WHERE tma.template_id = $1
ORDER BY t.name;
-- name: ListAllTenants :many
SELECT id,
    name,
    slug,
    logo_url
FROM public.tenants
WHERE is_active = true
ORDER BY name;
-- name: RemoveTemplateFromTenant :exec
DELETE FROM auth.tenant_menu_assignments
WHERE tenant_id = $1;

-- =====================================================
-- Menu Template Items (N:N relationship)
-- =====================================================

-- name: GetTemplateItemAssignments :many
-- Obtiene la asignación de items a un template con info del item
SELECT 
    mti.id,
    mti.template_id,
    mti.menu_item_id,
    mti.display_order,
    mti.is_visible,
    mti.created_at,
    m.code as item_code,
    m.label as item_label,
    m.icon as item_icon,
    m.route as item_route
FROM auth.menu_template_items mti
    INNER JOIN auth.menu_items m ON mti.menu_item_id = m.id
WHERE mti.template_id = $1
ORDER BY mti.display_order, m.label;

-- name: GetTemplatesForMenuItem :many
-- Obtiene todos los templates que tienen asignado un item específico
SELECT 
    mt.id,
    mt.name,
    mt.description,
    mt.is_default,
    mti.display_order,
    mti.is_visible
FROM auth.menu_templates mt
    INNER JOIN auth.menu_template_items mti ON mt.id = mti.template_id
WHERE mti.menu_item_id = $1
ORDER BY mt.name;

-- name: AssignItemToTemplate :one
-- Asigna un item a un template (o actualiza si ya existe)
INSERT INTO auth.menu_template_items (template_id, menu_item_id, display_order, is_visible)
VALUES ($1, $2, $3, $4)
ON CONFLICT (template_id, menu_item_id) DO UPDATE
SET display_order = EXCLUDED.display_order,
    is_visible = EXCLUDED.is_visible
RETURNING *;

-- name: RemoveItemFromTemplate :exec
-- Elimina un item de un template
DELETE FROM auth.menu_template_items
WHERE template_id = $1 AND menu_item_id = $2;

-- name: UpdateItemOrderInTemplate :exec
-- Actualiza el orden de un item en un template
UPDATE auth.menu_template_items
SET display_order = $3
WHERE template_id = $1 AND menu_item_id = $2;

-- name: ToggleItemVisibilityInTemplate :one
-- Cambia la visibilidad de un item en un template
UPDATE auth.menu_template_items
SET is_visible = $3
WHERE template_id = $1 AND menu_item_id = $2
RETURNING *;

-- name: GetUnassignedItemsForTemplate :many
-- Obtiene items que NO están asignados a un template específico
SELECT m.*
FROM auth.menu_items m
WHERE m.id NOT IN (
    SELECT mti.menu_item_id 
    FROM auth.menu_template_items mti
    WHERE mti.template_id = $1
)
AND m.is_active = true
ORDER BY m.label;

-- name: BulkAssignItemsToTemplate :exec
-- Asigna múltiples items a un template
INSERT INTO auth.menu_template_items (template_id, menu_item_id, display_order, is_visible)
SELECT $1::uuid, unnest($2::uuid[]), generate_series(1, array_length($2::uuid[], 1)), true
ON CONFLICT (template_id, menu_item_id) DO NOTHING;

-- name: RemoveAllItemsFromTemplate :exec
-- Elimina todos los items de un template
DELETE FROM auth.menu_template_items
WHERE template_id = $1;

-- name: ListAllMenuItemsForAdmin :many
-- Lista todos los items de menú para administración (sin filtrar por template)
SELECT 
    m.*,
    (SELECT COUNT(*) FROM auth.menu_template_items WHERE menu_item_id = m.id) as template_count
FROM auth.menu_items m
ORDER BY m.label;