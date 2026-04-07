-- 000030_remove_legacy_storage_provider.up.sql
-- Elimina definitivamente el proveedor legacy de storage y sus configuraciones remanentes.

DELETE FROM storage.module_storage_mappings msm
USING storage.storage_configurations sc,
      storage.storage_providers sp
WHERE msm.config_id = sc.id
  AND sc.provider_id = sp.id
  AND sp.provider_name = 'pocketbase';

DELETE FROM storage.storage_configurations sc
USING storage.storage_providers sp
WHERE sc.provider_id = sp.id
  AND sp.provider_name = 'pocketbase';

DELETE FROM storage.storage_providers
WHERE provider_name = 'pocketbase';
