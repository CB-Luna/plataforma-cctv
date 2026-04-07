-- 000016_add_scope_and_audit.up.sql
-- Agregar scope a permisos para control de acceso granular (own vs all)
-- Agregar campos de auditoría a usuarios
-- Agregar scope a permisos existentes
ALTER TABLE auth.permissions
ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'own';
COMMENT ON COLUMN auth.permissions.scope IS 'Scope del permiso: own (propio tenant), all (global), none (sin scope)';
-- Agregar campos de auditoría a usuarios
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
COMMENT ON COLUMN auth.users.created_by IS 'Usuario que creó este registro';
COMMENT ON COLUMN auth.users.updated_by IS 'Último usuario que modificó este registro';
-- Crear índices para auditoría
CREATE INDEX IF NOT EXISTS idx_users_created_by ON auth.users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON auth.users(updated_by);