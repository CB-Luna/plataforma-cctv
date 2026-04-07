-- internal/database/queries/inventory_cameras.sql
-- Queries SQLC para cámaras

-- =============================================
-- CAMERAS
-- =============================================

-- name: CreateCamera :one
INSERT INTO inventory.cameras (
    tenant_id, nvr_server_id, site_id, area_id, model_id,
    consecutive, name, code, camera_type, camera_model_name, generation,
    ip_address, mac_address, resolution, megapixels, ips, bitrate_kbps,
    quality, firmware_version, serial_number, area, zone, location_description,
    project, has_counting, counting_enabled, status, installation_date,
    warranty_expiry_date, specifications, analytics_config, metadata,
    notes, comments, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
    $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
    $29, $30, $31, $32, $33, $34, $35
)
RETURNING *;

-- name: GetCameraByID :one
SELECT 
    c.*,
    nvr.name as nvr_name,
    nvr.ip_address as nvr_ip,
    m.name as model_name,
    b.name as brand_name,
    b.logo_url as brand_logo,
    s.name as site_name,
    a.name as area_name
FROM inventory.cameras c
    LEFT JOIN inventory.nvr_servers nvr ON c.nvr_server_id = nvr.id
    LEFT JOIN inventory.models m ON c.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
    LEFT JOIN policies.sites s ON c.site_id = s.id
    LEFT JOIN policies.areas a ON c.area_id = a.id
WHERE c.id = $1 AND c.tenant_id = $2
LIMIT 1;

-- name: ListCamerasByTenant :many
SELECT 
    c.*,
    nvr.name as nvr_name,
    m.name as model_name,
    b.name as brand_name,
    s.name as site_name
FROM inventory.cameras c
    LEFT JOIN inventory.nvr_servers nvr ON c.nvr_server_id = nvr.id
    LEFT JOIN inventory.models m ON c.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
    LEFT JOIN policies.sites s ON c.site_id = s.id
WHERE c.tenant_id = $1
ORDER BY c.name ASC
LIMIT $2 OFFSET $3;

-- name: ListCamerasByNvr :many
SELECT 
    c.*,
    m.name as model_name,
    b.name as brand_name
FROM inventory.cameras c
    LEFT JOIN inventory.models m ON c.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
WHERE c.nvr_server_id = $1 AND c.tenant_id = $2
ORDER BY c.name ASC;

-- name: ListCamerasBySite :many
SELECT 
    c.*,
    nvr.name as nvr_name,
    m.name as model_name,
    b.name as brand_name
FROM inventory.cameras c
    LEFT JOIN inventory.nvr_servers nvr ON c.nvr_server_id = nvr.id
    LEFT JOIN inventory.models m ON c.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
WHERE c.site_id = $1 AND c.tenant_id = $2
ORDER BY c.name ASC;

-- name: ListCamerasByArea :many
SELECT 
    c.*,
    nvr.name as nvr_name,
    m.name as model_name
FROM inventory.cameras c
    LEFT JOIN inventory.nvr_servers nvr ON c.nvr_server_id = nvr.id
    LEFT JOIN inventory.models m ON c.model_id = m.id
WHERE c.area = $1 AND c.tenant_id = $2
ORDER BY c.name ASC;

-- name: ListCamerasByStatus :many
SELECT 
    c.*,
    nvr.name as nvr_name,
    m.name as model_name,
    b.name as brand_name,
    s.name as site_name
FROM inventory.cameras c
    LEFT JOIN inventory.nvr_servers nvr ON c.nvr_server_id = nvr.id
    LEFT JOIN inventory.models m ON c.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
    LEFT JOIN policies.sites s ON c.site_id = s.id
WHERE c.tenant_id = $1 AND c.status = $2
ORDER BY c.name ASC
LIMIT $3 OFFSET $4;

-- name: ListCamerasByType :many
SELECT 
    c.*,
    nvr.name as nvr_name,
    m.name as model_name,
    b.name as brand_name
FROM inventory.cameras c
    LEFT JOIN inventory.nvr_servers nvr ON c.nvr_server_id = nvr.id
    LEFT JOIN inventory.models m ON c.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
WHERE c.tenant_id = $1 AND c.camera_type = $2
ORDER BY c.name ASC;

-- name: ListCamerasByModel :many
SELECT 
    c.*,
    nvr.name as nvr_name,
    s.name as site_name
FROM inventory.cameras c
    LEFT JOIN inventory.nvr_servers nvr ON c.nvr_server_id = nvr.id
    LEFT JOIN policies.sites s ON c.site_id = s.id
WHERE c.model_id = $1 AND c.tenant_id = $2
ORDER BY c.name ASC;

-- name: SearchCameras :many
SELECT 
    c.*,
    nvr.name as nvr_name,
    m.name as model_name,
    b.name as brand_name,
    s.name as site_name
FROM inventory.cameras c
    LEFT JOIN inventory.nvr_servers nvr ON c.nvr_server_id = nvr.id
    LEFT JOIN inventory.models m ON c.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
    LEFT JOIN policies.sites s ON c.site_id = s.id
WHERE c.tenant_id = $1 
    AND (
        c.name ILIKE '%' || $2 || '%'
        OR c.serial_number ILIKE '%' || $2 || '%'
        OR c.camera_model_name ILIKE '%' || $2 || '%'
        OR c.area ILIKE '%' || $2 || '%'
        OR c.ip_address::TEXT ILIKE '%' || $2 || '%'
    )
ORDER BY c.name ASC
LIMIT $3 OFFSET $4;

-- name: UpdateCamera :one
UPDATE inventory.cameras
SET 
    nvr_server_id = COALESCE($3, nvr_server_id),
    site_id = COALESCE($4, site_id),
    area_id = COALESCE($5, area_id),
    model_id = COALESCE($6, model_id),
    name = COALESCE($7, name),
    code = COALESCE($8, code),
    camera_type = COALESCE($9, camera_type),
    camera_model_name = COALESCE($10, camera_model_name),
    ip_address = COALESCE($11, ip_address),
    mac_address = COALESCE($12, mac_address),
    resolution = COALESCE($13, resolution),
    megapixels = COALESCE($14, megapixels),
    ips = COALESCE($15, ips),
    bitrate_kbps = COALESCE($16, bitrate_kbps),
    quality = COALESCE($17, quality),
    firmware_version = COALESCE($18, firmware_version),
    serial_number = COALESCE($19, serial_number),
    area = COALESCE($20, area),
    zone = COALESCE($21, zone),
    location_description = COALESCE($22, location_description),
    project = COALESCE($23, project),
    status = COALESCE($24, status),
    specifications = COALESCE($25, specifications),
    metadata = COALESCE($26, metadata),
    notes = COALESCE($27, notes),
    comments = COALESCE($28, comments),
    updated_by = $29,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: UpdateCameraStatus :exec
UPDATE inventory.cameras
SET 
    status = $3,
    updated_by = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND tenant_id = $2;

-- name: UpdateCameraNvr :exec
UPDATE inventory.cameras
SET 
    nvr_server_id = $3,
    updated_by = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND tenant_id = $2;

-- name: BulkUpdateCamerasNvr :exec
UPDATE inventory.cameras
SET 
    nvr_server_id = $3,
    updated_by = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = $1 AND id = ANY($2::UUID[]);

-- name: DeleteCamera :exec
DELETE FROM inventory.cameras
WHERE id = $1 AND tenant_id = $2;

-- name: GetCameraStats :one
SELECT 
    COUNT(*) as total_cameras,
    COUNT(*) FILTER (WHERE status = 'active') as active_cameras,
    COUNT(*) FILTER (WHERE status = 'inactive') as inactive_cameras,
    COUNT(*) FILTER (WHERE status = 'faulty') as faulty_cameras,
    COUNT(*) FILTER (WHERE status = 'under_maintenance') as maintenance_cameras,
    COUNT(DISTINCT camera_type) as camera_types,
    COUNT(DISTINCT nvr_server_id) as nvr_count,
    COUNT(DISTINCT area) as area_count
FROM inventory.cameras
WHERE tenant_id = $1;

-- name: GetCameraStatsByType :many
SELECT 
    camera_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count
FROM inventory.cameras
WHERE tenant_id = $1
GROUP BY camera_type
ORDER BY count DESC;

-- name: GetCameraStatsByModel :many
SELECT 
    m.name as model_name,
    b.name as brand_name,
    COUNT(*) as count,
    AVG(c.ips)::INT as avg_ips,
    AVG(c.quality)::INT as avg_quality
FROM inventory.cameras c
    LEFT JOIN inventory.models m ON c.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
WHERE c.tenant_id = $1
GROUP BY m.name, b.name
ORDER BY count DESC;

-- name: GetCameraStatsByNvr :many
SELECT 
    nvr.id as nvr_id,
    nvr.name as nvr_name,
    COUNT(c.id) as camera_count,
    COUNT(c.id) FILTER (WHERE c.status = 'active') as active_count
FROM inventory.nvr_servers nvr
    LEFT JOIN inventory.cameras c ON c.nvr_server_id = nvr.id
WHERE nvr.tenant_id = $1
GROUP BY nvr.id, nvr.name
ORDER BY camera_count DESC;

-- =============================================
-- CAMERA NVR HISTORY
-- =============================================

-- name: ListCameraNvrHistory :many
SELECT 
    h.*,
    old_nvr.name as old_nvr_name,
    new_nvr.name as new_nvr_name,
    u.first_name || ' ' || u.last_name as changed_by_name
FROM inventory.camera_nvr_history h
    LEFT JOIN inventory.nvr_servers old_nvr ON h.old_nvr_server_id = old_nvr.id
    LEFT JOIN inventory.nvr_servers new_nvr ON h.new_nvr_server_id = new_nvr.id
    LEFT JOIN auth.users u ON h.changed_by = u.id
WHERE h.camera_id = $1 AND h.tenant_id = $2
ORDER BY h.changed_at DESC
LIMIT $3;

-- =============================================
-- EXECUTIVE SUMMARY QUERIES
-- =============================================

-- name: GetExecutiveSummary :one
SELECT 
    (SELECT COUNT(*) FROM inventory.nvr_servers n WHERE n.tenant_id = $1) as total_nvrs,
    (SELECT COUNT(*) FROM inventory.nvr_servers n WHERE n.tenant_id = $1 AND n.status = 'active') as active_nvrs,
    (SELECT COUNT(*) FROM inventory.cameras c WHERE c.tenant_id = $1) as total_cameras,
    (SELECT COUNT(*) FROM inventory.cameras c WHERE c.tenant_id = $1 AND c.status = 'active') as active_cameras,
    (SELECT COALESCE(SUM(n.total_storage_tb), 0) FROM inventory.nvr_servers n WHERE n.tenant_id = $1) as total_storage_tb,
    (SELECT COUNT(*) FROM inventory.nvr_licenses l WHERE l.tenant_id = $1 AND l.is_active = true AND l.is_perpetual = false AND l.expiry_date < CURRENT_DATE + INTERVAL '30 days') as licenses_expiring_soon;

-- name: GetCameraTypesSummary :many
SELECT 
    camera_type,
    camera_model_name as model,
    COUNT(*) as quantity,
    AVG(quality)::INT as avg_quality,
    AVG(ips)::INT as avg_ips
FROM inventory.cameras
WHERE tenant_id = $1
GROUP BY camera_type, camera_model_name
ORDER BY quantity DESC;
