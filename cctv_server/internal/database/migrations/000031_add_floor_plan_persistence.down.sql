DROP TRIGGER IF EXISTS set_floor_plans_updated_at ON inventory.floor_plans;
DROP INDEX IF EXISTS inventory.idx_floor_plans_background_file;
DROP INDEX IF EXISTS inventory.idx_floor_plans_tenant_site;
DROP TABLE IF EXISTS inventory.floor_plans;
