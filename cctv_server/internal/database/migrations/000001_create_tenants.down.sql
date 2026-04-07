-- 000001_create_tenants.down.sql
-- Revertir creación de tenants
DROP INDEX IF EXISTS idx_tenants_is_active;
DROP INDEX IF EXISTS idx_tenants_slug;
DROP TABLE IF EXISTS public.tenants;