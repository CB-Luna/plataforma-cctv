-- 000030_remove_legacy_storage_provider.down.sql
-- Restaura el proveedor legacy de storage si se revierte la purga.

INSERT INTO storage.storage_providers (
    provider_name,
    display_name,
    description,
    provider_type,
    is_active,
    supports_collections,
    supports_authentication,
    supports_direct_upload,
    max_file_size_mb,
    allowed_file_types,
    configuration_schema
)
SELECT
    'pocketbase',
    'Legacy Local Storage',
    'Proveedor legacy descontinuado; no usar en nuevas configuraciones.',
    'database',
    false,
    true,
    true,
    false,
    10,
    NULL,
    '{"required": ["host", "port", "username", "password"]}'::jsonb
WHERE NOT EXISTS (
    SELECT 1
    FROM storage.storage_providers
    WHERE provider_name = 'pocketbase'
);
