BEGIN;

-- Recrear tenant plataforma oculto (necesario por limitacion del backend: JOIN tenants ON tenant_id)
INSERT INTO public.tenants (id, name, slug, is_active, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '__PLATFORM__',
  '__platform__',
  true,
  '{"is_platform": true, "hidden": true}'::jsonb
);

-- Reasignar super_admins a este tenant plataforma
UPDATE auth.users SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE email IN ('mario_super_admin@gmail.com', 'yuns_super_admin@gmail.com');

-- Verificar
SELECT u.email, u.tenant_id, t.name, t.settings
FROM auth.users u
JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email LIKE '%super_admin%';

COMMIT;
