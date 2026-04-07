-- Script de datos demo para el módulo de Tickets
-- Este script crea tickets de demostración para visualizar el módulo
-- ============================================
-- 1. Crear Clientes Demo (requerido para tickets)
-- ============================================
INSERT INTO policies.clients (
        id,
        tenant_id,
        company_name,
        legal_name,
        rfc,
        email,
        phone,
        address,
        city,
        is_active
    )
VALUES (
        '850e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000',
        'Hospital Central',
        'Hospital Central S.A. de C.V.',
        'HCE123456789',
        'contacto@hospitalcentral.com',
        '555-1234',
        'Av. Principal 123',
        'Ciudad de México',
        true
    ),
    (
        '850e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440000',
        'Centro Comercial Plaza Norte',
        'Inmobiliaria Plaza Norte S.A.',
        'IPN987654321',
        'seguridad@plazanorte.com',
        '555-2345',
        'Blvd. Norte 456',
        'Monterrey',
        true
    ),
    (
        '850e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440000',
        'Banco Nacional Sucursal Centro',
        'Banco Nacional de México S.A.',
        'BNM111222333',
        'sucursal.centro@banconacional.com',
        '555-3456',
        'Calle Reforma 789',
        'Guadalajara',
        true
    ),
    (
        '850e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440000',
        'Universidad Tecnológica',
        'Universidad Tecnológica A.C.',
        'UTE444555666',
        'sistemas@unitec.edu',
        '555-4567',
        'Campus Norte s/n',
        'Puebla',
        true
    ),
    (
        '850e8400-e29b-41d4-a716-446655440005',
        '550e8400-e29b-41d4-a716-446655440000',
        'Fábrica Industrial Sur',
        'Industrias Sur S.A. de C.V.',
        'ISU777888999',
        'mantenimiento@fabind.com',
        '555-5678',
        'Zona Industrial 100',
        'Toluca',
        true
    ) ON CONFLICT (id) DO NOTHING;
-- ============================================
-- 2. Crear Sites (sitios) Demo
-- ============================================
INSERT INTO policies.sites (
        id,
        tenant_id,
        client_id,
        name,
        address,
        city,
        latitude,
        longitude,
        is_active
    )
VALUES (
        '950e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000',
        '850e8400-e29b-41d4-a716-446655440001',
        'Entrada Principal Hospital',
        'Av. Principal 123 - Entrada',
        'Ciudad de México',
        19.4326,
        -99.1332,
        true
    ),
    (
        '950e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440000',
        '850e8400-e29b-41d4-a716-446655440001',
        'Estacionamiento Hospital',
        'Av. Principal 123 - Estacionamiento',
        'Ciudad de México',
        19.4326,
        -99.1332,
        true
    ),
    (
        '950e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440000',
        '850e8400-e29b-41d4-a716-446655440002',
        'Acceso Plaza Norte',
        'Blvd. Norte 456 - Acceso',
        'Monterrey',
        25.6866,
        -100.3161,
        true
    ),
    (
        '950e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440000',
        '850e8400-e29b-41d4-a716-446655440003',
        'Cajeros Banco Centro',
        'Calle Reforma 789 - Cajeros',
        'Guadalajara',
        20.6597,
        -103.3496,
        true
    ),
    (
        '950e8400-e29b-41d4-a716-446655440005',
        '550e8400-e29b-41d4-a716-446655440000',
        '850e8400-e29b-41d4-a716-446655440004',
        'Campus Central Universidad',
        'Campus Norte s/n - Edificio A',
        'Puebla',
        19.0414,
        -98.2063,
        true
    ) ON CONFLICT (id) DO NOTHING;
-- ============================================
-- 3. Crear Tickets Demo
-- ============================================
INSERT INTO tickets.tickets (
        id,
        tenant_id,
        ticket_number,
        client_id,
        site_id,
        type,
        priority,
        status,
        title,
        description,
        reported_by,
        assigned_to,
        scheduled_date,
        sla_hours,
        sla_deadline
    )
VALUES -- Ticket 1: Urgente - Cámara no funciona
    (
        'a50e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000',
        'TKT-2026-0001',
        '850e8400-e29b-41d4-a716-446655440001',
        '950e8400-e29b-41d4-a716-446655440001',
        'corrective',
        'critical',
        'in_progress',
        'Cámara PTZ entrada principal sin imagen',
        'La cámara PTZ de la entrada principal del hospital dejó de transmitir imagen. Se requiere verificación urgente ya que es un punto crítico de seguridad.',
        '750e8400-e29b-41d4-a716-446655440002',
        '750e8400-e29b-41d4-a716-446655440003',
        NOW() + INTERVAL '2 hours',
        4,
        NOW() + INTERVAL '4 hours'
    ),
    -- Ticket 2: Alta prioridad - NVR lleno
    (
        'a50e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440000',
        'TKT-2026-0002',
        '850e8400-e29b-41d4-a716-446655440002',
        '950e8400-e29b-41d4-a716-446655440003',
        'corrective',
        'high',
        'assigned',
        'NVR con almacenamiento al 95%',
        'El servidor NVR de Plaza Norte está casi lleno. Se necesita ampliar almacenamiento o configurar política de retención.',
        '750e8400-e29b-41d4-a716-446655440001',
        '750e8400-e29b-41d4-a716-446655440003',
        NOW() + INTERVAL '1 day',
        24,
        NOW() + INTERVAL '24 hours'
    ),
    -- Ticket 3: Preventivo programado
    (
        'a50e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440000',
        'TKT-2026-0003',
        '850e8400-e29b-41d4-a716-446655440003',
        '950e8400-e29b-41d4-a716-446655440004',
        'preventive',
        'medium',
        'open',
        'Mantenimiento trimestral - Banco Centro',
        'Mantenimiento preventivo programado. Incluye limpieza de cámaras, verificación de conexiones y actualización de firmware.',
        '750e8400-e29b-41d4-a716-446655440001',
        NULL,
        NOW() + INTERVAL '3 days',
        48,
        NOW() + INTERVAL '5 days'
    ),
    -- Ticket 4: Instalación nueva
    (
        'a50e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440000',
        'TKT-2026-0004',
        '850e8400-e29b-41d4-a716-446655440004',
        '950e8400-e29b-41d4-a716-446655440005',
        'installation',
        'medium',
        'pending_parts',
        'Instalación de 4 cámaras nuevas - Edificio A',
        'Instalación de 4 cámaras IP en el edificio A de la universidad. Esperando llegada de equipos.',
        '750e8400-e29b-41d4-a716-446655440002',
        '750e8400-e29b-41d4-a716-446655440003',
        NOW() + INTERVAL '5 days',
        72,
        NOW() + INTERVAL '7 days'
    ),
    -- Ticket 5: Completado
    (
        'a50e8400-e29b-41d4-a716-446655440005',
        '550e8400-e29b-41d4-a716-446655440000',
        'TKT-2026-0005',
        '850e8400-e29b-41d4-a716-446655440005',
        NULL,
        'corrective',
        'low',
        'completed',
        'Reemplazo de fuente de poder DVR',
        'Se reemplazó la fuente de poder del DVR que presentaba fallas intermitentes.',
        '750e8400-e29b-41d4-a716-446655440002',
        '750e8400-e29b-41d4-a716-446655440003',
        NOW() - INTERVAL '2 days',
        24,
        NOW() - INTERVAL '1 day'
    ),
    -- Ticket 6: Cámara con imagen borrosa
    (
        'a50e8400-e29b-41d4-a716-446655440006',
        '550e8400-e29b-41d4-a716-446655440000',
        'TKT-2026-0006',
        '850e8400-e29b-41d4-a716-446655440001',
        '950e8400-e29b-41d4-a716-446655440002',
        'corrective',
        'medium',
        'open',
        'Cámara estacionamiento con imagen borrosa',
        'La cámara del estacionamiento presenta imagen borrosa, posiblemente por suciedad en el lente o desenfoque.',
        '750e8400-e29b-41d4-a716-446655440001',
        NULL,
        NULL,
        24,
        NOW() + INTERVAL '24 hours'
    ),
    -- Ticket 7: Inspección solicitada
    (
        'a50e8400-e29b-41d4-a716-446655440007',
        '550e8400-e29b-41d4-a716-446655440000',
        'TKT-2026-0007',
        '850e8400-e29b-41d4-a716-446655440002',
        '950e8400-e29b-41d4-a716-446655440003',
        'inspection',
        'low',
        'assigned',
        'Inspección de cableado red CCTV',
        'Cliente solicita inspección del cableado de la red CCTV por posibles interferencias.',
        '750e8400-e29b-41d4-a716-446655440002',
        '750e8400-e29b-41d4-a716-446655440003',
        NOW() + INTERVAL '4 days',
        48,
        NOW() + INTERVAL '6 days'
    ),
    -- Ticket 8: Cancelado
    (
        'a50e8400-e29b-41d4-a716-446655440008',
        '550e8400-e29b-41d4-a716-446655440000',
        'TKT-2026-0008',
        '850e8400-e29b-41d4-a716-446655440003',
        '950e8400-e29b-41d4-a716-446655440004',
        'installation',
        'medium',
        'cancelled',
        'Instalación cámara adicional (CANCELADO)',
        'El cliente canceló la solicitud de instalación de cámara adicional.',
        '750e8400-e29b-41d4-a716-446655440001',
        NULL,
        NULL,
        NULL,
        NULL
    ) ON CONFLICT (id) DO NOTHING;
-- ============================================
-- 4. Crear Timeline de eventos
-- ============================================
INSERT INTO tickets.ticket_timeline (
        id,
        tenant_id,
        ticket_id,
        event_type,
        description,
        user_id,
        old_value,
        new_value
    )
VALUES -- Timeline Ticket 1
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440001',
        'created',
        'Ticket creado',
        '750e8400-e29b-41d4-a716-446655440002',
        NULL,
        NULL
    ),
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440001',
        'assignment',
        'Ticket asignado a Carlos Técnico',
        '750e8400-e29b-41d4-a716-446655440001',
        NULL,
        'Carlos Técnico'
    ),
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440001',
        'status_change',
        'Estado cambiado',
        '750e8400-e29b-41d4-a716-446655440003',
        'assigned',
        'in_progress'
    ),
    -- Timeline Ticket 2
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440002',
        'created',
        'Ticket creado',
        '750e8400-e29b-41d4-a716-446655440001',
        NULL,
        NULL
    ),
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440002',
        'assignment',
        'Ticket asignado a Carlos Técnico',
        '750e8400-e29b-41d4-a716-446655440001',
        NULL,
        'Carlos Técnico'
    ),
    -- Timeline Ticket 5 (completado)
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440005',
        'created',
        'Ticket creado',
        '750e8400-e29b-41d4-a716-446655440002',
        NULL,
        NULL
    ),
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440005',
        'assignment',
        'Ticket asignado a Carlos Técnico',
        '750e8400-e29b-41d4-a716-446655440001',
        NULL,
        'Carlos Técnico'
    ),
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440005',
        'status_change',
        'Trabajo iniciado',
        '750e8400-e29b-41d4-a716-446655440003',
        'assigned',
        'in_progress'
    ),
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440005',
        'status_change',
        'Trabajo completado',
        '750e8400-e29b-41d4-a716-446655440003',
        'in_progress',
        'completed'
    );
-- ============================================
-- 5. Crear Comentarios de ejemplo
-- ============================================
INSERT INTO tickets.ticket_comments (
        id,
        tenant_id,
        ticket_id,
        user_id,
        comment,
        is_internal
    )
VALUES -- Comentarios Ticket 1
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440001',
        '750e8400-e29b-41d4-a716-446655440003',
        'Llegué al sitio, verificando la cámara.',
        false
    ),
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440001',
        '750e8400-e29b-41d4-a716-446655440003',
        'La cámara tiene falla en la fuente de alimentación, necesito reemplazo.',
        false
    ),
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440001',
        '750e8400-e29b-41d4-a716-446655440001',
        'NOTA: Verificar si está en garantía',
        true
    ),
    -- Comentarios Ticket 2
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440002',
        '750e8400-e29b-41d4-a716-446655440001',
        'Se cotizó disco duro adicional de 4TB',
        true
    ),
    -- Comentarios Ticket 5
    (
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440000',
        'a50e8400-e29b-41d4-a716-446655440005',
        '750e8400-e29b-41d4-a716-446655440003',
        'Fuente reemplazada exitosamente. DVR funcionando correctamente.',
        false
    );
-- ============================================
-- Verificación
-- ============================================
SELECT t.ticket_number,
    t.title,
    t.status::text,
    t.priority::text,
    t.type::text,
    c.company_name as client
FROM tickets.tickets t
    LEFT JOIN policies.clients c ON t.client_id = c.id
WHERE t.tenant_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY t.created_at DESC;