-- 000029_cleanup_legacy_storage.down.sql
-- Reactiva el proveedor legacy de storage si se requiere revertir.

UPDATE storage.storage_providers
SET is_active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE provider_name = 'pocketbase';

UPDATE storage.storage_configurations sc
SET is_active = true,
    updated_at = CURRENT_TIMESTAMP
FROM storage.storage_providers sp
WHERE sc.provider_id = sp.id
  AND sp.provider_name = 'pocketbase';
