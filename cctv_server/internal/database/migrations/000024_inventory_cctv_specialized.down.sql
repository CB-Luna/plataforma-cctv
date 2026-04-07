-- 000024_inventory_cctv_specialized.down.sql
-- Rollback de tablas especializadas para inventario CCTV

-- Eliminar triggers
DROP TRIGGER IF EXISTS trg_camera_nvr_history ON inventory.cameras;
DROP TRIGGER IF EXISTS trg_nvr_licenses_history ON inventory.nvr_licenses;
DROP TRIGGER IF EXISTS trg_cameras_updated_at ON inventory.cameras;
DROP TRIGGER IF EXISTS trg_nvr_storage_units_updated_at ON inventory.nvr_storage_units;
DROP TRIGGER IF EXISTS trg_nvr_licenses_updated_at ON inventory.nvr_licenses;
DROP TRIGGER IF EXISTS trg_nvr_servers_updated_at ON inventory.nvr_servers;

-- Eliminar funciones
DROP FUNCTION IF EXISTS inventory.log_camera_nvr_changes();
DROP FUNCTION IF EXISTS inventory.log_license_changes();

-- Eliminar tablas (en orden inverso por dependencias)
DROP TABLE IF EXISTS inventory.import_batch_items CASCADE;
DROP TABLE IF EXISTS inventory.import_batches CASCADE;
DROP TABLE IF EXISTS inventory.camera_nvr_history CASCADE;
DROP TABLE IF EXISTS inventory.cameras CASCADE;
DROP TABLE IF EXISTS inventory.nvr_storage_units CASCADE;
DROP TABLE IF EXISTS inventory.nvr_license_history CASCADE;
DROP TABLE IF EXISTS inventory.nvr_licenses CASCADE;
DROP TABLE IF EXISTS inventory.nvr_servers CASCADE;

-- Eliminar tipos ENUM
DROP TYPE IF EXISTS inventory.import_source_type;
DROP TYPE IF EXISTS inventory.import_status;
DROP TYPE IF EXISTS inventory.camera_type;
DROP TYPE IF EXISTS inventory.license_type;
