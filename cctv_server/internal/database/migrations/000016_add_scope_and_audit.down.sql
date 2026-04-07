-- 000016_add_scope_and_audit.down.sql
-- Revertir cambios de scope y auditoría
-- Eliminar índices de auditoría
DROP INDEX IF EXISTS auth.idx_users_created_by;
DROP INDEX IF EXISTS auth.idx_users_updated_by;
-- Eliminar columnas de auditoría
ALTER TABLE auth.users DROP COLUMN IF EXISTS created_by,
    DROP COLUMN IF EXISTS updated_by;
-- Eliminar scope de permisos
ALTER TABLE auth.permissions DROP COLUMN IF EXISTS scope;