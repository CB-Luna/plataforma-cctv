-- 000014_add_configuration_menu.up.sql
-- Agregar item de menú para Configuración del Sistema

-- Configuración (menú principal para mantenimientos del sistema)
INSERT INTO auth.menu_items (
    tenant_id,
    code,
    label,
    icon,
    route,
    display_order,
    description
)
VALUES (
    NULL,
    'configuration',
    'Configuración',
    'settings',
    '/configuration',
    8,
    'Configuración y mantenimientos del sistema'
) ON CONFLICT (code, tenant_id) DO NOTHING;
