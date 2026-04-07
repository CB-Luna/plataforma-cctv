-- internal/database/queries/storage.sql
-- Queries para gestión de archivos y multimedia
-- ==================== FILES ====================
-- name: CreateFile :one
INSERT INTO storage.files (
        tenant_id,
        filename,
        original_filename,
        mime_type,
        file_size,
        file_hash,
        storage_provider,
        storage_bucket,
        storage_path,
        storage_url,
        category,
        related_entity_type,
        related_entity_id,
        metadata,
        uploaded_by
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
-- name: GetFileByID :one
SELECT *
FROM storage.files
WHERE id = $1
    AND tenant_id = $2
LIMIT 1;

-- name: GetFileByIDGlobal :one
SELECT *
FROM storage.files
WHERE id = $1
LIMIT 1;
-- name: ListFilesByTenant :many
SELECT *
FROM storage.files
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
-- name: ListFilesByCategory :many
SELECT *
FROM storage.files
WHERE tenant_id = $1
    AND category = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
-- name: ListFilesByEntity :many
SELECT *
FROM storage.files
WHERE tenant_id = $1
    AND related_entity_type = $2
    AND related_entity_id = $3
ORDER BY created_at DESC;
-- name: FindFileByHash :one
SELECT *
FROM storage.files
WHERE tenant_id = $1
    AND file_hash = $2
LIMIT 1;
-- name: UpdateFileProcessed :one
UPDATE storage.files
SET is_processed = true,
    processed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2
RETURNING *;
-- name: DeleteFile :exec
DELETE FROM storage.files
WHERE id = $1
    AND tenant_id = $2;
-- name: CountFilesByTenant :one
SELECT COUNT(*)
FROM storage.files
WHERE tenant_id = $1;
-- name: GetTotalStorageSize :one
SELECT COALESCE(SUM(file_size), 0)::BIGINT
FROM storage.files
WHERE tenant_id = $1;
-- ==================== FILE PROCESSING ====================
-- name: CreateFileProcessing :one
INSERT INTO storage.file_processing (
        tenant_id,
        file_id,
        processing_type,
        status
    )
VALUES ($1, $2, $3, $4)
RETURNING *;
-- name: GetFileProcessing :one
SELECT *
FROM storage.file_processing
WHERE id = $1
    AND tenant_id = $2
LIMIT 1;
-- name: ListPendingProcessing :many
SELECT *
FROM storage.file_processing
WHERE tenant_id = $1
    AND status = 'pending'
ORDER BY created_at ASC
LIMIT $2;
-- name: UpdateProcessingStatus :one
UPDATE storage.file_processing
SET status = $2,
    started_at = CASE
        WHEN $2 = 'processing' THEN CURRENT_TIMESTAMP
        ELSE started_at
    END,
    completed_at = CASE
        WHEN $2 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP
        ELSE completed_at
    END,
    processing_time_ms = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: UpdateProcessingResult :one
UPDATE storage.file_processing
SET status = $2,
    result = $3,
    error_message = $4,
    completed_at = CURRENT_TIMESTAMP,
    processing_time_ms = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: DeleteProcessing :exec
DELETE FROM storage.file_processing
WHERE id = $1
    AND tenant_id = $2;
-- ==================== FILE ACCESS LOG ====================
-- name: CreateFileAccessLog :one
INSERT INTO storage.file_access_log (
        tenant_id,
        file_id,
        access_type,
        accessed_by,
        ip_address,
        user_agent
    )
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
-- name: ListFileAccessLog :many
SELECT *
FROM storage.file_access_log
WHERE file_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
-- name: CountFileAccess :one
SELECT COUNT(*)
FROM storage.file_access_log
WHERE file_id = $1
    AND access_type = $2;
-- ==================== STORAGE CONFIGURATION ====================
-- name: ListStorageProviders :many
SELECT *
FROM storage.storage_providers
WHERE is_active = true
ORDER BY display_name ASC;
-- name: GetStorageProviderByName :one
SELECT *
FROM storage.storage_providers
WHERE provider_name = $1
    AND is_active = true
LIMIT 1;
-- name: CreateStorageConfiguration :one
INSERT INTO storage.storage_configurations (
        tenant_id,
        provider_id,
        config_name,
        is_default,
        is_active,
        host,
        port,
        database_name,
        username,
        password_text,
        api_key,
        secret_key,
        base_url,
        bucket_name,
        region,
        project_id,
        additional_config,
        module_mappings
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
        $15,
        $16,
        $17,
        $18
    )
RETURNING *;
-- name: ListStorageConfigurations :many
SELECT sc.*,
    sp.display_name as provider_display_name,
    sp.provider_name
FROM storage.storage_configurations sc
    JOIN storage.storage_providers sp ON sc.provider_id = sp.id
WHERE sc.tenant_id = $1
ORDER BY sc.created_at DESC;
-- name: GetStorageConfiguration :one
SELECT *
FROM storage.storage_configurations
WHERE id = $1
    AND tenant_id = $2
LIMIT 1;
-- name: GetDefaultStorageConfig :one
SELECT *
FROM storage.storage_configurations
WHERE tenant_id = $1
    AND provider_id = $2
    AND is_default = true
LIMIT 1;
-- name: UpdateStorageConfiguration :one
UPDATE storage.storage_configurations
SET config_name = $3,
    is_default = $4,
    is_active = $5,
    host = $6,
    port = $7,
    database_name = $8,
    username = $9,
    password_text = $10,
    api_key = $11,
    secret_key = $12,
    base_url = $13,
    bucket_name = $14,
    region = $15,
    project_id = $16,
    additional_config = $17,
    module_mappings = $18,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2
RETURNING *;
-- name: DeleteStorageConfiguration :exec
DELETE FROM storage.storage_configurations
WHERE id = $1
    AND tenant_id = $2;
-- name: GetStorageConfigByName :one
SELECT *
FROM storage.storage_configurations
WHERE tenant_id = $1
    AND config_name = $2
LIMIT 1;
-- name: CreateModuleStorageMapping :one
INSERT INTO storage.module_storage_mappings (
        tenant_id,
        module_name,
        collection_name,
        config_id,
        is_active,
        max_file_size_mb,
        allowed_file_types,
        auto_resize,
        thumbnail_sizes
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;
-- name: GetModuleStorageMapping :one
SELECT msm.*,
    sc.config_name,
    sp.provider_name
FROM storage.module_storage_mappings msm
    JOIN storage.storage_configurations sc ON msm.config_id = sc.id
    JOIN storage.storage_providers sp ON sc.provider_id = sp.id
WHERE msm.tenant_id = $1
    AND msm.module_name = $2
LIMIT 1;
-- name: ListModuleStorageMappings :many
SELECT msm.*,
    sc.config_name
FROM storage.module_storage_mappings msm
    JOIN storage.storage_configurations sc ON msm.config_id = sc.id
WHERE msm.tenant_id = $1;
