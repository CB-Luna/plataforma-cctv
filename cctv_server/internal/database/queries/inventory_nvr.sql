-- internal/database/queries/inventory_nvr.sql
-- Queries SQLC para servidores NVR y licencias

-- =============================================
-- NVR SERVERS
-- =============================================

-- name: CreateNvrServer :one
INSERT INTO inventory.nvr_servers (
    tenant_id, site_id, brand_id, name, code, vms_server_id,
    edition, vms_version, camera_channels, tpv_channels, lpr_channels,
    integration_connections, model, service_tag, service_code, processor,
    ram_gb, os_name, system_type, ip_address, subnet_mask, gateway,
    mac_address, total_storage_tb, recording_days, launch_date,
    warranty_expiry_date, installation_date, status, hardware_specs,
    network_config, metadata, notes, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
    $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
    $29, $30, $31, $32, $33, $34
)
RETURNING *;

-- name: GetNvrServerByID :one
SELECT 
    nvr.*,
    b.name as brand_name,
    b.logo_url as brand_logo,
    s.name as site_name,
    s.address as site_address,
    (SELECT COUNT(*) FROM inventory.cameras c WHERE c.nvr_server_id = nvr.id) as camera_count,
    (SELECT COALESCE(SUM(nl.total_licenses), 0) FROM inventory.nvr_licenses nl WHERE nl.nvr_server_id = nvr.id AND nl.is_active = true) as total_licenses,
    (SELECT COALESCE(SUM(nl.used_licenses), 0) FROM inventory.nvr_licenses nl WHERE nl.nvr_server_id = nvr.id AND nl.is_active = true) as used_licenses
FROM inventory.nvr_servers nvr
    LEFT JOIN inventory.brands b ON nvr.brand_id = b.id
    LEFT JOIN policies.sites s ON nvr.site_id = s.id
WHERE nvr.id = $1 AND nvr.tenant_id = $2
LIMIT 1;

-- name: ListNvrServersByTenant :many
SELECT 
    nvr.*,
    b.name as brand_name,
    s.name as site_name,
    (SELECT COUNT(*) FROM inventory.cameras c WHERE c.nvr_server_id = nvr.id) as camera_count
FROM inventory.nvr_servers nvr
    LEFT JOIN inventory.brands b ON nvr.brand_id = b.id
    LEFT JOIN policies.sites s ON nvr.site_id = s.id
WHERE nvr.tenant_id = $1
ORDER BY nvr.name ASC;

-- name: ListNvrServersBySite :many
SELECT 
    nvr.*,
    b.name as brand_name,
    (SELECT COUNT(*) FROM inventory.cameras c WHERE c.nvr_server_id = nvr.id) as camera_count
FROM inventory.nvr_servers nvr
    LEFT JOIN inventory.brands b ON nvr.brand_id = b.id
WHERE nvr.site_id = $1 AND nvr.tenant_id = $2
ORDER BY nvr.name ASC;

-- name: ListNvrServersByStatus :many
SELECT 
    nvr.*,
    b.name as brand_name,
    s.name as site_name
FROM inventory.nvr_servers nvr
    LEFT JOIN inventory.brands b ON nvr.brand_id = b.id
    LEFT JOIN policies.sites s ON nvr.site_id = s.id
WHERE nvr.tenant_id = $1 AND nvr.status = $2
ORDER BY nvr.name ASC;

-- name: UpdateNvrServer :one
UPDATE inventory.nvr_servers
SET 
    site_id = COALESCE($3, site_id),
    brand_id = COALESCE($4, brand_id),
    name = COALESCE($5, name),
    code = COALESCE($6, code),
    vms_server_id = COALESCE($7, vms_server_id),
    edition = COALESCE($8, edition),
    vms_version = COALESCE($9, vms_version),
    camera_channels = COALESCE($10, camera_channels),
    tpv_channels = COALESCE($11, tpv_channels),
    lpr_channels = COALESCE($12, lpr_channels),
    model = COALESCE($13, model),
    service_tag = COALESCE($14, service_tag),
    processor = COALESCE($15, processor),
    ram_gb = COALESCE($16, ram_gb),
    os_name = COALESCE($17, os_name),
    ip_address = COALESCE($18, ip_address),
    mac_address = COALESCE($19, mac_address),
    total_storage_tb = COALESCE($20, total_storage_tb),
    recording_days = COALESCE($21, recording_days),
    status = COALESCE($22, status),
    hardware_specs = COALESCE($23, hardware_specs),
    network_config = COALESCE($24, network_config),
    metadata = COALESCE($25, metadata),
    notes = COALESCE($26, notes),
    updated_by = $27,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: UpdateNvrServerStatus :exec
UPDATE inventory.nvr_servers
SET 
    status = $3,
    updated_by = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND tenant_id = $2;

-- name: DeleteNvrServer :exec
DELETE FROM inventory.nvr_servers
WHERE id = $1 AND tenant_id = $2;

-- name: GetNvrServerStats :one
SELECT 
    COUNT(*) as total_servers,
    COUNT(*) FILTER (WHERE status = 'active') as active_servers,
    COUNT(*) FILTER (WHERE status = 'inactive') as inactive_servers,
    COUNT(*) FILTER (WHERE status = 'under_maintenance') as maintenance_servers,
    COALESCE(SUM(camera_channels), 0) as total_camera_channels,
    COALESCE(SUM(total_storage_tb), 0) as total_storage_tb,
    COALESCE(SUM(ram_gb), 0) as total_ram_gb
FROM inventory.nvr_servers
WHERE tenant_id = $1;

-- =============================================
-- NVR LICENSES
-- =============================================

-- name: CreateNvrLicense :one
INSERT INTO inventory.nvr_licenses (
    tenant_id, nvr_server_id, license_key, license_type, edition,
    total_licenses, used_licenses, issue_date, expiry_date, is_perpetual,
    is_active, metadata
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
RETURNING *;

-- name: GetNvrLicenseByID :one
SELECT 
    nl.*,
    nvr.name as nvr_name
FROM inventory.nvr_licenses nl
    LEFT JOIN inventory.nvr_servers nvr ON nl.nvr_server_id = nvr.id
WHERE nl.id = $1 AND nl.tenant_id = $2
LIMIT 1;

-- name: ListNvrLicensesByServer :many
SELECT *
FROM inventory.nvr_licenses
WHERE nvr_server_id = $1 AND tenant_id = $2
ORDER BY license_type ASC;

-- name: ListActiveLicensesByTenant :many
SELECT 
    nl.*,
    nvr.name as nvr_name,
    nvr.ip_address as nvr_ip
FROM inventory.nvr_licenses nl
    LEFT JOIN inventory.nvr_servers nvr ON nl.nvr_server_id = nvr.id
WHERE nl.tenant_id = $1 AND nl.is_active = true
ORDER BY nl.expiry_date ASC NULLS LAST;

-- name: ListExpiringLicenses :many
SELECT 
    nl.*,
    nvr.name as nvr_name,
    nvr.ip_address as nvr_ip
FROM inventory.nvr_licenses nl
    LEFT JOIN inventory.nvr_servers nvr ON nl.nvr_server_id = nvr.id
WHERE nl.tenant_id = $1 
    AND nl.is_active = true 
    AND nl.is_perpetual = false
    AND nl.expiry_date <= $2
ORDER BY nl.expiry_date ASC;

-- name: UpdateNvrLicense :one
UPDATE inventory.nvr_licenses
SET 
    license_key = COALESCE($3, license_key),
    license_type = COALESCE($4, license_type),
    edition = COALESCE($5, edition),
    total_licenses = COALESCE($6, total_licenses),
    used_licenses = COALESCE($7, used_licenses),
    expiry_date = COALESCE($8, expiry_date),
    is_perpetual = COALESCE($9, is_perpetual),
    is_active = COALESCE($10, is_active),
    metadata = COALESCE($11, metadata),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: UpdateLicenseUsage :exec
UPDATE inventory.nvr_licenses
SET 
    used_licenses = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND tenant_id = $2;

-- name: DeleteNvrLicense :exec
DELETE FROM inventory.nvr_licenses
WHERE id = $1 AND tenant_id = $2;

-- name: GetLicenseStats :one
SELECT 
    COUNT(*) as total_licenses,
    COUNT(*) FILTER (WHERE is_active = true) as active_licenses,
    COUNT(*) FILTER (WHERE is_perpetual = true) as perpetual_licenses,
    COUNT(*) FILTER (WHERE is_perpetual = false AND expiry_date < CURRENT_DATE) as expired_licenses,
    COALESCE(SUM(total_licenses), 0) as total_license_count,
    COALESCE(SUM(used_licenses), 0) as used_license_count
FROM inventory.nvr_licenses
WHERE tenant_id = $1;

-- =============================================
-- NVR LICENSE HISTORY
-- =============================================

-- name: ListLicenseHistoryByLicense :many
SELECT 
    lh.*,
    u.first_name || ' ' || u.last_name as changed_by_name
FROM inventory.nvr_license_history lh
    LEFT JOIN auth.users u ON lh.changed_by = u.id
WHERE lh.nvr_license_id = $1 AND lh.tenant_id = $2
ORDER BY lh.changed_at DESC
LIMIT $3 OFFSET $4;

-- name: ListLicenseHistoryByServer :many
SELECT 
    lh.*,
    nl.license_type,
    u.first_name || ' ' || u.last_name as changed_by_name
FROM inventory.nvr_license_history lh
    LEFT JOIN inventory.nvr_licenses nl ON lh.nvr_license_id = nl.id
    LEFT JOIN auth.users u ON lh.changed_by = u.id
WHERE lh.nvr_server_id = $1 AND lh.tenant_id = $2
ORDER BY lh.changed_at DESC
LIMIT $3 OFFSET $4;

-- =============================================
-- NVR STORAGE UNITS
-- =============================================

-- name: CreateNvrStorageUnit :one
INSERT INTO inventory.nvr_storage_units (
    tenant_id, nvr_server_id, slot_number, disk_type, brand, model,
    serial_number, capacity_tb, status, health_percentage, installation_date
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
)
RETURNING *;

-- name: ListStorageUnitsByServer :many
SELECT *
FROM inventory.nvr_storage_units
WHERE nvr_server_id = $1 AND tenant_id = $2
ORDER BY slot_number ASC;

-- name: UpdateNvrStorageUnit :one
UPDATE inventory.nvr_storage_units
SET 
    disk_type = COALESCE($3, disk_type),
    brand = COALESCE($4, brand),
    model = COALESCE($5, model),
    serial_number = COALESCE($6, serial_number),
    capacity_tb = COALESCE($7, capacity_tb),
    status = COALESCE($8, status),
    health_percentage = COALESCE($9, health_percentage),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: DeleteNvrStorageUnit :exec
DELETE FROM inventory.nvr_storage_units
WHERE id = $1 AND tenant_id = $2;

-- name: GetStorageStatsByServer :one
SELECT 
    COUNT(*) as total_disks,
    COUNT(*) FILTER (WHERE status = 'healthy') as healthy_disks,
    COUNT(*) FILTER (WHERE status = 'warning') as warning_disks,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_disks,
    COALESCE(SUM(capacity_tb), 0) as total_capacity_tb,
    AVG(health_percentage)::INT as avg_health
FROM inventory.nvr_storage_units
WHERE nvr_server_id = $1 AND tenant_id = $2;
