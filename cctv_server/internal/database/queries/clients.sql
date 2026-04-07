-- internal/database/queries/clients.sql
-- Queries para clientes y sitios
-- name: CreateClient :one
INSERT INTO policies.clients (
        tenant_id,
        company_name,
        legal_name,
        rfc,
        address,
        city,
        state,
        postal_code,
        email,
        phone
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;
-- name: GetClientByID :one
SELECT *
FROM policies.clients
WHERE id = $1
    AND tenant_id = $2
LIMIT 1;
-- name: ListClientsByTenant :many
SELECT *
FROM policies.clients
WHERE tenant_id = $1
    AND is_active = true
ORDER BY company_name
LIMIT $2 OFFSET $3;
-- name: UpdateClient :one
UPDATE policies.clients
SET company_name = $3,
    legal_name = $4,
    rfc = $5,
    address = $6,
    city = $7,
    state = $8,
    postal_code = $9,
    email = $10,
    phone = $11,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2
RETURNING *;
-- name: DeactivateClient :exec
UPDATE policies.clients
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: SearchClients :many
SELECT *
FROM policies.clients
WHERE tenant_id = $1
    AND is_active = true
    AND (
        company_name ILIKE $2
        OR rfc ILIKE $2
    )
ORDER BY company_name
LIMIT $3;
-- Sites
-- name: CreateSite :one
INSERT INTO policies.sites (
        tenant_id,
        client_id,
        name,
        address,
        city,
        state,
        postal_code,
        latitude,
        longitude,
        contact_name,
        contact_phone
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
        $11
    )
RETURNING *;
-- name: GetSiteByID :one
SELECT *
FROM policies.sites
WHERE id = $1
    AND tenant_id = $2
LIMIT 1;
-- name: ListSitesByClient :many
SELECT *
FROM policies.sites
WHERE client_id = $1
    AND tenant_id = $2
    AND is_active = true
ORDER BY name;
-- name: UpdateSite :one
UPDATE policies.sites
SET name = $3,
    address = $4,
    city = $5,
    state = $6,
    latitude = $7,
    longitude = $8,
    contact_name = $9,
    contact_phone = $10,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2
RETURNING *;
-- Client Contacts
-- name: CreateClientContact :one
INSERT INTO policies.client_contacts (
        tenant_id,
        client_id,
        name,
        position,
        email,
        phone,
        is_primary
    )
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;
-- name: ListClientContacts :many
SELECT *
FROM policies.client_contacts
WHERE client_id = $1
    AND tenant_id = $2
ORDER BY is_primary DESC,
    name;