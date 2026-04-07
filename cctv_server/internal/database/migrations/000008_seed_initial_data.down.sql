-- 000008_seed_initial_data.down.sql
-- Revertir datos iniciales
-- Eliminar planes de cobertura globales
DELETE FROM policies.coverage_plans
WHERE tenant_id IS NULL;
-- Eliminar marcas
DELETE FROM inventory.brands;
-- Eliminar tipos de equipo
DELETE FROM inventory.equipment_types;
-- Eliminar roles de sistema
DELETE FROM auth.roles
WHERE is_system = true;
-- Eliminar permisos
DELETE FROM auth.permissions;