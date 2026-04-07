-- 000008_seed_initial_data.up.sql
-- Datos iniciales del sistema (permisos, roles, catálogos)
-- =============================================
-- PERMISOS DEL SISTEMA (globales)
-- =============================================
INSERT INTO auth.permissions (code, module, description)
VALUES -- Módulo de usuarios
    ('users.create', 'users', 'Crear usuarios'),
    ('users.read', 'users', 'Ver usuarios'),
    ('users.update', 'users', 'Editar usuarios'),
    ('users.delete', 'users', 'Eliminar usuarios'),
    -- Módulo de roles
    ('roles.create', 'roles', 'Crear roles'),
    ('roles.read', 'roles', 'Ver roles'),
    ('roles.update', 'roles', 'Editar roles'),
    ('roles.delete', 'roles', 'Eliminar roles'),
    (
        'roles.assign',
        'roles',
        'Asignar roles a usuarios'
    ),
    -- Módulo de clientes
    ('clients.create', 'clients', 'Crear clientes'),
    ('clients.read', 'clients', 'Ver clientes'),
    ('clients.update', 'clients', 'Editar clientes'),
    ('clients.delete', 'clients', 'Eliminar clientes'),
    -- Módulo de pólizas
    ('policies.create', 'policies', 'Crear pólizas'),
    ('policies.read', 'policies', 'Ver pólizas'),
    ('policies.update', 'policies', 'Editar pólizas'),
    (
        'policies.delete',
        'policies',
        'Eliminar pólizas'
    ),
    ('policies.renew', 'policies', 'Renovar pólizas'),
    (
        'policies.suspend',
        'policies',
        'Suspender pólizas'
    ),
    -- Módulo de inventario
    ('inventory.create', 'inventory', 'Crear equipos'),
    ('inventory.read', 'inventory', 'Ver inventario'),
    (
        'inventory.update',
        'inventory',
        'Editar equipos'
    ),
    (
        'inventory.delete',
        'inventory',
        'Eliminar equipos'
    ),
    (
        'inventory.transfer',
        'inventory',
        'Transferir equipos'
    ),
    -- Módulo de tickets
    ('tickets.create', 'tickets', 'Crear tickets'),
    ('tickets.read', 'tickets', 'Ver tickets'),
    ('tickets.update', 'tickets', 'Editar tickets'),
    ('tickets.delete', 'tickets', 'Eliminar tickets'),
    ('tickets.assign', 'tickets', 'Asignar técnicos'),
    ('tickets.close', 'tickets', 'Cerrar tickets'),
    ('tickets.reopen', 'tickets', 'Reabrir tickets'),
    -- Módulo de worklogs
    (
        'worklogs.create',
        'worklogs',
        'Registrar trabajo'
    ),
    ('worklogs.read', 'worklogs', 'Ver bitácoras'),
    (
        'worklogs.update',
        'worklogs',
        'Editar bitácoras'
    ),
    -- Módulo de facturación
    ('invoices.create', 'invoices', 'Crear facturas'),
    ('invoices.read', 'invoices', 'Ver facturas'),
    ('invoices.update', 'invoices', 'Editar facturas'),
    (
        'invoices.delete',
        'invoices',
        'Cancelar facturas'
    ),
    (
        'invoices.stamp',
        'invoices',
        'Timbrar facturas CFDI'
    ),
    -- Módulo de cobranza
    ('payments.create', 'payments', 'Registrar pagos'),
    ('payments.read', 'payments', 'Ver pagos'),
    (
        'payments.refund',
        'payments',
        'Reembolsar pagos'
    ),
    -- Módulo de reportes
    ('reports.sla', 'reports', 'Ver reportes SLA'),
    (
        'reports.financial',
        'reports',
        'Ver reportes financieros'
    ),
    (
        'reports.inventory',
        'reports',
        'Ver reportes de inventario'
    ),
    ('reports.export', 'reports', 'Exportar reportes'),
    -- Módulo de configuración
    ('settings.read', 'settings', 'Ver configuración'),
    (
        'settings.update',
        'settings',
        'Editar configuración'
    ),
    (
        'settings.tenants',
        'settings',
        'Gestionar tenants'
    );
-- =============================================
-- ROLES DE SISTEMA (sin tenant_id)
-- =============================================
INSERT INTO auth.roles (tenant_id, name, description, is_system)
VALUES (
        NULL,
        'super_admin',
        'Administrador del sistema con acceso total',
        true
    ),
    (
        NULL,
        'tenant_admin',
        'Administrador de tenant',
        true
    );
-- =============================================
-- CATÁLOGOS DE INVENTARIO (globales)
-- =============================================
-- Tipos de equipo
INSERT INTO inventory.equipment_types (name, description, icon, category)
VALUES ('camera_ip', 'Cámara IP', 'videocam', 'cameras'),
    (
        'camera_analog',
        'Cámara Analógica',
        'videocam',
        'cameras'
    ),
    (
        'camera_ptz',
        'Cámara PTZ',
        'control_camera',
        'cameras'
    ),
    (
        'camera_thermal',
        'Cámara Térmica',
        'thermostat',
        'cameras'
    ),
    (
        'nvr',
        'Grabador de Video en Red (NVR)',
        'storage',
        'recorders'
    ),
    (
        'dvr',
        'Grabador de Video Digital (DVR)',
        'storage',
        'recorders'
    ),
    (
        'monitor',
        'Monitor de Vigilancia',
        'monitor',
        'display'
    ),
    (
        'switch_poe',
        'Switch PoE',
        'cable',
        'networking'
    ),
    (
        'switch_network',
        'Switch de Red',
        'cable',
        'networking'
    ),
    ('router', 'Router', 'router', 'networking'),
    (
        'ups',
        'UPS / No Break',
        'battery_charging_full',
        'power'
    ),
    (
        'hard_drive',
        'Disco Duro',
        'disc_full',
        'storage'
    ),
    (
        'access_control',
        'Control de Acceso',
        'door_front',
        'access'
    ),
    ('intercom', 'Videoportero', 'doorbell', 'access'),
    (
        'sensor_motion',
        'Sensor de Movimiento',
        'sensors',
        'sensors'
    ),
    (
        'sensor_door',
        'Sensor de Puerta',
        'sensor_door',
        'sensors'
    ),
    (
        'alarm_panel',
        'Panel de Alarma',
        'security',
        'alarm'
    ),
    (
        'cable_utp',
        'Cable UTP',
        'cable',
        'infrastructure'
    ),
    (
        'rack',
        'Rack de Telecomunicaciones',
        'apps',
        'infrastructure'
    );
-- Marcas populares
INSERT INTO inventory.brands (name, country, website)
VALUES (
        'Hikvision',
        'China',
        'https://www.hikvision.com'
    ),
    (
        'Dahua',
        'China',
        'https://www.dahuasecurity.com'
    ),
    ('Axis', 'Suecia', 'https://www.axis.com'),
    (
        'Hanwha (Samsung)',
        'Corea del Sur',
        'https://www.hanwha-security.com'
    ),
    ('Vivotek', 'Taiwán', 'https://www.vivotek.com'),
    (
        'Bosch',
        'Alemania',
        'https://www.boschsecurity.com'
    ),
    (
        'Honeywell',
        'Estados Unidos',
        'https://www.honeywellhome.com'
    ),
    (
        'Pelco',
        'Estados Unidos',
        'https://www.pelco.com'
    ),
    ('Genetec', 'Canadá', 'https://www.genetec.com'),
    (
        'Milestone',
        'Dinamarca',
        'https://www.milestonesys.com'
    ),
    (
        'Ubiquiti',
        'Estados Unidos',
        'https://www.ui.com'
    ),
    ('TP-Link', 'China', 'https://www.tp-link.com'),
    ('APC', 'Estados Unidos', 'https://www.apc.com'),
    (
        'Seagate',
        'Estados Unidos',
        'https://www.seagate.com'
    ),
    (
        'Western Digital',
        'Estados Unidos',
        'https://www.westerndigital.com'
    );
-- =============================================
-- PLANES DE COBERTURA GLOBALES (sin tenant_id)
-- =============================================
INSERT INTO policies.coverage_plans (
        tenant_id,
        name,
        description,
        preventive_visits_per_year,
        emergency_response_time_hours,
        includes_parts,
        includes_labor,
        monthly_price,
        features
    )
VALUES (
        NULL,
        'Básico',
        'Soporte básico con respuesta en 48 horas',
        2,
        48,
        false,
        true,
        500.00,
        '["Soporte telefónico", "2 visitas preventivas al año"]'
    ),
    (
        NULL,
        'Estándar',
        'Soporte estándar con respuesta en 24 horas',
        4,
        24,
        false,
        true,
        1000.00,
        '["Soporte telefónico 8x5", "4 visitas preventivas", "Monitoreo básico"]'
    ),
    (
        NULL,
        'Premium',
        'Soporte premium con respuesta en 8 horas',
        6,
        8,
        true,
        true,
        2500.00,
        '["Soporte 24/7", "6 visitas preventivas", "Refacciones incluidas", "Monitoreo avanzado"]'
    ),
    (
        NULL,
        'Enterprise',
        'Soporte empresarial con SLA garantizado',
        12,
        4,
        true,
        true,
        5000.00,
        '["Técnico dedicado", "Visitas mensuales", "Todo incluido", "SLA 99.9%"]'
    );