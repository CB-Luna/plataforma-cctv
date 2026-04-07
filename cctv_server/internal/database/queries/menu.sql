-- internal/database/queries/menu.sql
-- Queries para gestión de items de menú
-- name: ListMenuItems :many
SELECT *
FROM auth.menu_items
WHERE (
        tenant_id = $1
        OR tenant_id IS NULL
    )
    AND is_active = true
ORDER BY display_order,
    label;
-- name: ListAllMenuItems :many
SELECT *
FROM auth.menu_items
WHERE (
        tenant_id = $1
        OR tenant_id IS NULL
    )
ORDER BY display_order,
    label;
-- name: GetMenuItem :one
SELECT *
FROM auth.menu_items
WHERE id = $1
LIMIT 1;
-- name: CreateMenuItem :one
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
        badge_text,
        badge_color,
        description,
        metadata,
        created_by
    )
VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15
    )
RETURNING *;
-- name: UpdateMenuItem :one
UPDATE auth.menu_items
SET label = $2,
    icon = $3,
    route = $4,
    parent_id = $5,
    required_permission = $6,
    display_order = $7,
    is_visible = $8,
    badge_text = $9,
    badge_color = $10,
    description = $11,
    metadata = $12,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: ToggleMenuItem :one
UPDATE auth.menu_items
SET is_active = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: DeleteMenuItem :exec
DELETE FROM auth.menu_items
WHERE id = $1;
-- name: ReorderMenuItems :exec
UPDATE auth.menu_items
SET display_order = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
-- name: GetMenuItemsByParent :many
SELECT *
FROM auth.menu_items
WHERE parent_id = $1
    AND is_active = true
ORDER BY display_order;
-- name: CountMenuItems :one
SELECT COUNT(*)
FROM auth.menu_items
WHERE (
        tenant_id = $1
        OR tenant_id IS NULL
    );