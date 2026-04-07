-- 000013_seed_menu_items.up.sql
-- Seed inicial de menú global (tenant_id = NULL)
-- Dashboard (siempre visible, sin permiso requerido)
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
        'dashboard',
        'Dashboard',
        'dashboard',
        '/dashboard',
        1,
        'Panel principal del sistema'
    );
-- Tickets
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        required_permission,
        display_order,
        description
    )
VALUES (
        NULL,
        'tickets',
        'Tickets',
        'assignment',
        '/tickets',
        'tickets.read',
        2,
        'Gestión de tickets de servicio'
    );
-- Clientes
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        required_permission,
        display_order,
        description
    )
VALUES (
        NULL,
        'clients',
        'Clientes',
        'business',
        '/clients',
        'clients.read',
        3,
        'Gestión de clientes'
    );
-- Inventario
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        required_permission,
        display_order,
        description
    )
VALUES (
        NULL,
        'inventory',
        'Inventario',
        'inventory_2',
        '/inventory',
        'inventory.read',
        4,
        'Control de inventario de equipos'
    );
-- Pólizas
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        required_permission,
        display_order,
        description
    )
VALUES (
        NULL,
        'policies',
        'Pólizas',
        'description',
        '/policies',
        'policies.read',
        5,
        'Gestión de pólizas y coberturas'
    );
-- Facturación (menú padre)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        required_permission,
        display_order,
        description
    )
VALUES (
        NULL,
        'billing',
        'Facturación',
        'receipt',
        'billing.read',
        6,
        'Módulo de facturación'
    );
-- Facturación > Facturas (submenú)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        description
    )
VALUES (
        NULL,
        'invoices',
        'Facturas',
        'receipt_long',
        '/billing/invoices',
        (
            SELECT id
            FROM auth.menu_items
            WHERE code = 'billing'
                AND tenant_id IS NULL
            LIMIT 1
        ), 'billing.read', 'Gestión de facturas'
    );
-- Facturación > Pagos (submenú)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        description
    )
VALUES (
        NULL,
        'payments',
        'Pagos',
        'payment',
        '/billing/payments',
        (
            SELECT id
            FROM auth.menu_items
            WHERE code = 'billing'
                AND tenant_id IS NULL
            LIMIT 1
        ), 'billing.read', 'Registro de pagos'
    );
-- Reportes (menú padre)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        required_permission,
        display_order,
        description
    )
VALUES (
        NULL,
        'reports',
        'Reportes',
        'assessment',
        'reports.read',
        7,
        'Reportes y análisis'
    );
-- Reportes > Tickets (submenú)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        description
    )
VALUES (
        NULL,
        'tickets-report',
        'Tickets',
        'bar_chart',
        '/reports/tickets',
        (
            SELECT id
            FROM auth.menu_items
            WHERE code = 'reports'
                AND tenant_id IS NULL
            LIMIT 1
        ), 'reports.read', 'Reporte de tickets'
    );
-- Reportes > Financiero (submenú)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        description
    )
VALUES (
        NULL,
        'financial-report',
        'Financiero',
        'trending_up',
        '/reports/financial',
        (
            SELECT id
            FROM auth.menu_items
            WHERE code = 'reports'
                AND tenant_id IS NULL
            LIMIT 1
        ), 'reports.read', 'Reporte financiero'
    );
-- Administración (menú padre)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        required_permission,
        display_order,
        description
    )
VALUES (
        NULL,
        'admin',
        'Administración',
        'admin_panel_settings',
        'admin.read',
        10,
        'Configuración del sistema'
    );
-- Administración > Usuarios (submenú)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        description
    )
VALUES (
        NULL,
        'users',
        'Usuarios',
        'people',
        '/admin/users',
        (
            SELECT id
            FROM auth.menu_items
            WHERE code = 'admin'
                AND tenant_id IS NULL
            LIMIT 1
        ), 'users.read', 'Gestión de usuarios'
    );
-- Administración > Roles (submenú)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        description
    )
VALUES (
        NULL,
        'roles',
        'Roles',
        'security',
        '/admin/roles',
        (
            SELECT id
            FROM auth.menu_items
            WHERE code = 'admin'
                AND tenant_id IS NULL
            LIMIT 1
        ), 'roles.read', 'Gestión de roles y permisos'
    );
-- Administración > Configuración (submenú)
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        description
    )
VALUES (
        NULL,
        'settings',
        'Configuración',
        'settings',
        '/admin/settings',
        (
            SELECT id
            FROM auth.menu_items
            WHERE code = 'admin'
                AND tenant_id IS NULL
            LIMIT 1
        ), 'settings.read', 'Configuración general'
    );
-- Administración > Tenants (submenú) - Solo super admin
INSERT INTO auth.menu_items (
        tenant_id,
        code,
        label,
        icon,
        route,
        parent_id,
        required_permission,
        description
    )
VALUES (
        NULL,
        'tenants',
        'Tenants',
        'domain',
        '/admin/tenants',
        (
            SELECT id
            FROM auth.menu_items
            WHERE code = 'admin'
                AND tenant_id IS NULL
            LIMIT 1
        ), 'tenants.read', 'Gestión de tenants'
    );