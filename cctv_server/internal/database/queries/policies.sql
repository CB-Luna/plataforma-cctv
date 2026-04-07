-- internal/database/queries/policies.sql
-- Queries para módulo de pólizas y relación con activos

-- name: ListPoliciesByTenant :many
SELECT p.*,
    c.company_name AS client_name,
    s.name AS site_name
FROM policies.policies p
INNER JOIN policies.clients c ON c.id = p.client_id
LEFT JOIN policies.sites s ON s.id = p.site_id
WHERE p.tenant_id = $1
    AND ($2 = '' OR p.status::text = $2)
    AND ($3 = '' OR p.vendor ILIKE '%' || $3 || '%')
    AND ($4 = '' OR p.client_id::text = $4)
ORDER BY p.created_at DESC
LIMIT $5 OFFSET $6;

-- name: GetPolicyByID :one
SELECT p.*,
    c.company_name AS client_name,
    s.name AS site_name
FROM policies.policies p
INNER JOIN policies.clients c ON c.id = p.client_id
LEFT JOIN policies.sites s ON s.id = p.site_id
WHERE p.id = $1
    AND p.tenant_id = $2
LIMIT 1;

-- name: GetActivePolicyForClientSite :one
SELECT p.*,
    c.company_name AS client_name,
    s.name AS site_name
FROM policies.policies p
INNER JOIN policies.clients c ON c.id = p.client_id
LEFT JOIN policies.sites s ON s.id = p.site_id
WHERE p.tenant_id = $1
    AND p.client_id = $2
    AND ($3::uuid IS NULL OR p.site_id = $3 OR p.site_id IS NULL)
    AND p.status = 'active'
    AND CURRENT_DATE BETWEEN p.start_date AND p.end_date
ORDER BY
    CASE WHEN p.site_id = $3 THEN 0 ELSE 1 END,
    p.created_at DESC
LIMIT 1;

-- name: CreatePolicy :one
INSERT INTO policies.policies (
    tenant_id,
    policy_number,
    client_id,
    site_id,
    coverage_plan_id,
    status,
    start_date,
    end_date,
    monthly_payment,
    payment_day,
    notes,
    terms_accepted,
    contract_url,
    vendor,
    contract_type,
    annual_value,
    coverage_json,
    metadata,
    created_by
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9,
    $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
)
RETURNING *;

-- name: UpdatePolicy :one
UPDATE policies.policies
SET policy_number = COALESCE($3, policy_number),
    client_id = COALESCE($4, client_id),
    site_id = COALESCE($5, site_id),
    coverage_plan_id = COALESCE($6, coverage_plan_id),
    status = COALESCE($7, status),
    start_date = COALESCE($8, start_date),
    end_date = COALESCE($9, end_date),
    monthly_payment = COALESCE($10, monthly_payment),
    payment_day = COALESCE($11, payment_day),
    notes = COALESCE($12, notes),
    terms_accepted = COALESCE($13, terms_accepted),
    contract_url = COALESCE($14, contract_url),
    vendor = COALESCE($15, vendor),
    contract_type = COALESCE($16, contract_type),
    annual_value = COALESCE($17, annual_value),
    coverage_json = COALESCE($18, coverage_json),
    metadata = COALESCE($19, metadata),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2
RETURNING *;

-- name: SoftDeletePolicy :exec
UPDATE policies.policies
SET status = 'cancelled',
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;

-- name: AddPolicyAssetEquipment :one
INSERT INTO policies.policy_assets (
    tenant_id,
    policy_id,
    equipment_id,
    notes
)
VALUES ($1, $2, $3, $4)
ON CONFLICT (policy_id, equipment_id) WHERE equipment_id IS NOT NULL
DO UPDATE SET
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- name: AddPolicyAssetNvr :one
INSERT INTO policies.policy_assets (
    tenant_id,
    policy_id,
    nvr_server_id,
    notes
)
VALUES ($1, $2, $3, $4)
ON CONFLICT (policy_id, nvr_server_id) WHERE nvr_server_id IS NOT NULL
DO UPDATE SET
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- name: AddPolicyAssetCamera :one
INSERT INTO policies.policy_assets (
    tenant_id,
    policy_id,
    camera_id,
    notes
)
VALUES ($1, $2, $3, $4)
ON CONFLICT (policy_id, camera_id) WHERE camera_id IS NOT NULL
DO UPDATE SET
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- name: RemovePolicyAsset :exec
DELETE FROM policies.policy_assets
WHERE id = $1
    AND tenant_id = $2;

-- name: ListPolicyAssets :many
SELECT pa.*,
    e.serial_number AS equipment_serial,
    n.name AS nvr_name,
    cam.name AS camera_name
FROM policies.policy_assets pa
LEFT JOIN inventory.equipment e ON e.id = pa.equipment_id
LEFT JOIN inventory.nvr_servers n ON n.id = pa.nvr_server_id
LEFT JOIN inventory.cameras cam ON cam.id = pa.camera_id
WHERE pa.policy_id = $1
    AND pa.tenant_id = $2
ORDER BY pa.created_at DESC;
