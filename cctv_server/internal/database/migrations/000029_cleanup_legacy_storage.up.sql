-- 000029_cleanup_legacy_storage.up.sql
-- Desactiva el proveedor legacy de storage para que deje de aparecer en configuración.

UPDATE storage.storage_configurations sc
SET is_active = false,
    is_default = false,
    updated_at = CURRENT_TIMESTAMP
FROM storage.storage_providers sp
WHERE sc.provider_id = sp.id
  AND sp.provider_name = 'pocketbase';

UPDATE storage.storage_providers
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE provider_name = 'pocketbase';
