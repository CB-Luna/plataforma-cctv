-- 000015_add_tenant_colors.up.sql
-- Add secondary and tertiary color columns to tenants table for theme support
ALTER TABLE public.tenants
ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#424242',
    ADD COLUMN tertiary_color VARCHAR(7) DEFAULT '#757575';
COMMENT ON COLUMN public.tenants.secondary_color IS 'Secondary theme color extracted from logo';
COMMENT ON COLUMN public.tenants.tertiary_color IS 'Tertiary/accent theme color extracted from logo';