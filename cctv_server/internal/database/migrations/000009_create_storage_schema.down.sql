-- 000009_create_storage_schema.down.sql
-- Rollback del esquema storage
DROP INDEX IF EXISTS storage.idx_file_access_log_created;
DROP INDEX IF EXISTS storage.idx_file_access_log_file;
DROP INDEX IF EXISTS storage.idx_file_processing_type;
DROP INDEX IF EXISTS storage.idx_file_processing_status;
DROP INDEX IF EXISTS storage.idx_file_processing_file;
DROP INDEX IF EXISTS storage.idx_files_created;
DROP INDEX IF EXISTS storage.idx_files_hash;
DROP INDEX IF EXISTS storage.idx_files_entity;
DROP INDEX IF EXISTS storage.idx_files_category;
DROP INDEX IF EXISTS storage.idx_files_tenant;
DROP TABLE IF EXISTS storage.file_access_log;
DROP TABLE IF EXISTS storage.file_processing;
DROP TABLE IF EXISTS storage.files;
DROP SCHEMA IF EXISTS storage;