-- 000017_seed_scoped_permissions.down.sql
-- Eliminar permisos scoped
DELETE FROM auth.permissions
WHERE code LIKE '%:own'
    OR code LIKE '%:all';
DELETE FROM auth.permissions
WHERE code = 'admin:global';