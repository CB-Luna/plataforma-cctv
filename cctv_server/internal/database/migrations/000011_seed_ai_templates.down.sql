-- 000011_seed_ai_templates.down.sql
-- Rollback del seed de AI templates
-- Eliminar templates globales
DELETE FROM intelligence.prompt_templates
WHERE tenant_id IS NULL;