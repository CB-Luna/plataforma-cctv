-- internal/database/queries/inventory.sql
-- Queries para inventario de equipos
-- Equipment Types (catálogo global)
-- name: ListEquipmentTypes :many
SELECT *
FROM inventory.equipment_types
ORDER BY category,
    name;
-- Brands (catálogo global)
-- name: ListBrands :many
SELECT *
FROM inventory.brands
ORDER BY name;
-- Models
-- name: ListModelsByBrand :many
SELECT m.*,
    b.name as brand_name,
    et.name as equipment_type_name
FROM inventory.models m
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
    LEFT JOIN inventory.equipment_types et ON m.equipment_type_id = et.id
WHERE m.brand_id = $1
    AND m.is_active = true
ORDER BY m.name;
-- Equipment
-- name: CreateEquipment :one
INSERT INTO inventory.equipment (
        tenant_id,
        client_id,
        site_id,
        area_id,
        model_id,
        equipment_type_id,
        serial_number,
        asset_tag,
        ip_address,
        status,
        installation_date,
        location_description,
        latitude,
        longitude
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
        $14
    )
RETURNING *;
-- name: GetEquipmentByID :one
SELECT e.*,
    c.company_name as client_name,
    s.name as site_name,
    m.name as model_name,
    b.name as brand_name,
    et.name as equipment_type_name
FROM inventory.equipment e
    LEFT JOIN policies.clients c ON e.client_id = c.id
    LEFT JOIN policies.sites s ON e.site_id = s.id
    LEFT JOIN inventory.models m ON e.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
    LEFT JOIN inventory.equipment_types et ON e.equipment_type_id = et.id
WHERE e.id = $1
    AND e.tenant_id = $2
LIMIT 1;
-- name: ListEquipmentByClient :many
SELECT e.*,
    m.name as model_name,
    b.name as brand_name,
    et.name as equipment_type_name
FROM inventory.equipment e
    LEFT JOIN inventory.models m ON e.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
    LEFT JOIN inventory.equipment_types et ON e.equipment_type_id = et.id
WHERE e.client_id = $1
    AND e.tenant_id = $2
ORDER BY e.created_at DESC;
-- name: ListEquipmentBySite :many
SELECT e.*,
    m.name as model_name,
    b.name as brand_name
FROM inventory.equipment e
    LEFT JOIN inventory.models m ON e.model_id = m.id
    LEFT JOIN inventory.brands b ON m.brand_id = b.id
WHERE e.site_id = $1
    AND e.tenant_id = $2
ORDER BY e.location_description;
-- name: ListEquipmentByStatus :many
SELECT e.*,
    c.company_name as client_name,
    m.name as model_name
FROM inventory.equipment e
    LEFT JOIN policies.clients c ON e.client_id = c.id
    LEFT JOIN inventory.models m ON e.model_id = m.id
WHERE e.tenant_id = $1
    AND e.status = $2
ORDER BY e.created_at DESC
LIMIT $3 OFFSET $4;
-- name: UpdateEquipmentStatus :exec
UPDATE inventory.equipment
SET status = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: UpdateEquipmentLocation :exec
UPDATE inventory.equipment
SET site_id = $3,
    area_id = $4,
    location_description = $5,
    latitude = $6,
    longitude = $7,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: ScheduleMaintenance :exec
UPDATE inventory.equipment
SET next_maintenance_at = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- Maintenance History
-- name: CreateMaintenanceHistory :one
INSERT INTO inventory.maintenance_history (
        tenant_id,
        equipment_id,
        ticket_id,
        service_date,
        service_type,
        performed_by,
        description,
        findings,
        labor_hours,
        next_service_date
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;
-- name: ListMaintenanceByEquipment :many
SELECT mh.*,
    u.first_name || ' ' || u.last_name as technician_name
FROM inventory.maintenance_history mh
    LEFT JOIN auth.users u ON mh.performed_by = u.id
WHERE mh.equipment_id = $1
    AND mh.tenant_id = $2
ORDER BY mh.service_date DESC
LIMIT $3;