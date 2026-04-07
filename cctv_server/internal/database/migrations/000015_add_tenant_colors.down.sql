-- 000015_add_tenant_colors.down.sql
-- Remove secondary and tertiary color columns from tenants table
ALTER TABLE public.tenants DROP COLUMN IF EXISTS secondary_color,
    DROP COLUMN IF EXISTS tertiary_color;