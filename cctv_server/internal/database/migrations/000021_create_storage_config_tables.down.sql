-- 000021_create_storage_config_tables.down.sql
DROP TABLE IF EXISTS storage.module_storage_mappings;
DROP TABLE IF EXISTS storage.storage_configurations;
DROP TABLE IF EXISTS storage.storage_providers;
DROP TRIGGER IF EXISTS trigger_storage_providers_updated_at ON storage.storage_providers;
DROP TRIGGER IF EXISTS trigger_storage_configurations_updated_at ON storage.storage_configurations;
DROP TRIGGER IF EXISTS trigger_module_storage_mappings_updated_at ON storage.module_storage_mappings;
-- No eliminamos la función ya que podría ser usada por otras tablas en el esquema storage