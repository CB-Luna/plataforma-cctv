-- internal/database/queries/inventory_import.sql
-- Queries SQLC para importación masiva de inventario

-- =============================================
-- IMPORT BATCHES
-- =============================================

-- name: CreateImportBatch :one
INSERT INTO inventory.import_batches (
    tenant_id, batch_name, source_type, source_filename, target_table,
    column_mapping, total_rows, source_file_id, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
)
RETURNING *;

-- name: GetImportBatchByID :one
SELECT 
    ib.*,
    u.first_name || ' ' || u.last_name as created_by_name
FROM inventory.import_batches ib
    LEFT JOIN auth.users u ON ib.created_by = u.id
WHERE ib.id = $1 AND ib.tenant_id = $2
LIMIT 1;

-- name: ListImportBatchesByTenant :many
SELECT 
    ib.*,
    u.first_name || ' ' || u.last_name as created_by_name
FROM inventory.import_batches ib
    LEFT JOIN auth.users u ON ib.created_by = u.id
WHERE ib.tenant_id = $1
ORDER BY ib.created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListImportBatchesByStatus :many
SELECT 
    ib.*,
    u.first_name || ' ' || u.last_name as created_by_name
FROM inventory.import_batches ib
    LEFT JOIN auth.users u ON ib.created_by = u.id
WHERE ib.tenant_id = $1 AND ib.status = $2
ORDER BY ib.created_at DESC;

-- name: UpdateImportBatchStatus :exec
UPDATE inventory.import_batches
SET 
    status = $3,
    error_message = $4,
    started_at = CASE WHEN $3 = 'processing' THEN CURRENT_TIMESTAMP ELSE started_at END,
    completed_at = CASE WHEN $3 IN ('completed', 'completed_with_errors', 'failed', 'cancelled') THEN CURRENT_TIMESTAMP ELSE completed_at END
WHERE id = $1 AND tenant_id = $2;

-- name: UpdateImportBatchProgress :exec
UPDATE inventory.import_batches
SET 
    processed_rows = $3,
    success_rows = $4,
    error_rows = $5,
    skipped_rows = $6
WHERE id = $1 AND tenant_id = $2;

-- name: IncrementImportBatchProgress :exec
UPDATE inventory.import_batches
SET 
    processed_rows = processed_rows + 1,
    success_rows = success_rows + $3,
    error_rows = error_rows + $4,
    skipped_rows = skipped_rows + $5
WHERE id = $1 AND tenant_id = $2;

-- name: DeleteImportBatch :exec
DELETE FROM inventory.import_batches
WHERE id = $1 AND tenant_id = $2;

-- name: GetImportBatchStats :one
SELECT 
    COUNT(*) as total_batches,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'processing') as processing,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'completed_with_errors') as completed_with_errors,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    COALESCE(SUM(total_rows), 0) as total_rows_imported,
    COALESCE(SUM(success_rows), 0) as total_success_rows
FROM inventory.import_batches
WHERE tenant_id = $1;

-- =============================================
-- IMPORT BATCH ITEMS
-- =============================================

-- name: CreateImportBatchItem :one
INSERT INTO inventory.import_batch_items (
    tenant_id, batch_id, row_number, raw_data, status
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;

-- name: CreateImportBatchItemsBulk :copyfrom
INSERT INTO inventory.import_batch_items (
    tenant_id, batch_id, row_number, raw_data, status
) VALUES ($1, $2, $3, $4, $5);

-- name: GetImportBatchItemByID :one
SELECT *
FROM inventory.import_batch_items
WHERE id = $1 AND tenant_id = $2
LIMIT 1;

-- name: ListImportBatchItems :many
SELECT *
FROM inventory.import_batch_items
WHERE batch_id = $1 AND tenant_id = $2
ORDER BY row_number ASC
LIMIT $3 OFFSET $4;

-- name: ListImportBatchItemsByStatus :many
SELECT *
FROM inventory.import_batch_items
WHERE batch_id = $1 AND tenant_id = $2 AND status = $3
ORDER BY row_number ASC
LIMIT $4 OFFSET $5;

-- name: ListPendingImportBatchItems :many
SELECT *
FROM inventory.import_batch_items
WHERE batch_id = $1 AND tenant_id = $2 AND status = 'pending'
ORDER BY row_number ASC
LIMIT $3;

-- name: UpdateImportBatchItemStatus :exec
UPDATE inventory.import_batch_items
SET 
    status = $3,
    error_message = $4,
    created_record_id = $5,
    created_record_table = $6,
    processed_at = CURRENT_TIMESTAMP
WHERE id = $1 AND tenant_id = $2;

-- name: BulkUpdateImportBatchItemsStatus :exec
UPDATE inventory.import_batch_items
SET 
    status = $3,
    processed_at = CURRENT_TIMESTAMP
WHERE batch_id = $1 AND tenant_id = $2 AND id = ANY($4::UUID[]);

-- name: GetImportBatchItemErrors :many
SELECT *
FROM inventory.import_batch_items
WHERE batch_id = $1 AND tenant_id = $2 AND status = 'error'
ORDER BY row_number ASC;

-- name: CountImportBatchItemsByStatus :one
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'success') as success,
    COUNT(*) FILTER (WHERE status = 'error') as error,
    COUNT(*) FILTER (WHERE status = 'skipped') as skipped
FROM inventory.import_batch_items
WHERE batch_id = $1 AND tenant_id = $2;

-- name: DeleteImportBatchItems :exec
DELETE FROM inventory.import_batch_items
WHERE batch_id = $1 AND tenant_id = $2;

-- =============================================
-- HELPER QUERIES FOR IMPORT VALIDATION
-- =============================================

-- name: CheckCameraCodeExists :one
SELECT EXISTS(
    SELECT 1 FROM inventory.cameras 
    WHERE tenant_id = $1 AND code = $2
) as exists;

-- name: CheckNvrCodeExists :one
SELECT EXISTS(
    SELECT 1 FROM inventory.nvr_servers 
    WHERE tenant_id = $1 AND code = $2
) as exists;

-- name: CheckCameraIPExists :one
SELECT EXISTS(
    SELECT 1 FROM inventory.cameras 
    WHERE tenant_id = $1 AND ip_address = $2
) as exists;

-- name: CheckNvrIPExists :one
SELECT EXISTS(
    SELECT 1 FROM inventory.nvr_servers 
    WHERE tenant_id = $1 AND ip_address = $2
) as exists;

-- name: GetNvrServerByName :one
SELECT id, name
FROM inventory.nvr_servers
WHERE tenant_id = $1 AND name ILIKE $2
LIMIT 1;

-- name: GetBrandByName :one
SELECT id, name
FROM inventory.brands
WHERE name ILIKE $1
LIMIT 1;

-- name: GetModelByNameAndBrand :one
SELECT m.id, m.name, b.name as brand_name
FROM inventory.models m
    JOIN inventory.brands b ON m.brand_id = b.id
WHERE m.name ILIKE $1 AND b.name ILIKE $2
LIMIT 1;

-- name: GetSiteByName :one
SELECT id, name
FROM policies.sites
WHERE tenant_id = $1 AND name ILIKE $2
LIMIT 1;

-- name: GetAreaByName :one
SELECT id, name
FROM policies.areas
WHERE tenant_id = $1 AND name ILIKE $2
LIMIT 1;
