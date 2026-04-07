-- internal/database/queries/tenants.sql
-- Queries para gestión CRUD de tenants
-- name: GetTenantByID :one
SELECT *
FROM public.tenants
WHERE id = $1
LIMIT 1;
-- name: GetTenantBySlug :one
SELECT *
FROM public.tenants
WHERE slug = $1
LIMIT 1;
-- name: ListTenants :many
SELECT *
FROM public.tenants
ORDER BY name
LIMIT $1 OFFSET $2;
-- name: ListActiveTenants :many
SELECT *
FROM public.tenants
WHERE is_active = true
ORDER BY name;
-- name: CreateTenant :one
INSERT INTO public.tenants (
        name,
        slug,
        domain,
        logo_url,
        primary_color,
        secondary_color,
        tertiary_color,
        settings,
        subscription_plan,
        max_users,
        max_clients
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;
-- name: UpdateTenant :one
UPDATE public.tenants
SET name = $2,
    domain = $3,
    logo_url = $4,
    primary_color = $5,
    secondary_color = $6,
    tertiary_color = $7,
    subscription_plan = $8,
    max_users = $9,
    max_clients = $10,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: UpdateTenantSettings :one
UPDATE public.tenants
SET settings = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: UpdateTenantTheme :one
UPDATE public.tenants
SET primary_color = $2,
    secondary_color = $3,
    tertiary_color = $4,
    logo_url = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: ActivateTenant :one
UPDATE public.tenants
SET is_active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: DeactivateTenant :one
UPDATE public.tenants
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: DeleteTenant :exec
DELETE FROM public.tenants
WHERE id = $1;
-- name: CountTenants :one
SELECT COUNT(*)
FROM public.tenants;
-- name: CountActiveTenants :one
SELECT COUNT(*)
FROM public.tenants
WHERE is_active = true;