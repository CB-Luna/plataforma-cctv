-- 000005_create_tickets_schema.up.sql
-- Schema de tickets y bitácoras de trabajo (multi-tenant)
CREATE SCHEMA IF NOT EXISTS tickets;
-- Tipos ENUM
CREATE TYPE tickets.ticket_type AS ENUM (
    'preventive',
    'corrective',
    'emergency',
    'installation',
    'uninstallation',
    'inspection'
);
CREATE TYPE tickets.ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);
CREATE TYPE tickets.ticket_status AS ENUM (
    'open',
    'assigned',
    'in_progress',
    'on_hold',
    'pending_parts',
    'pending_approval',
    'completed',
    'cancelled'
);
-- Tickets de servicio
CREATE TABLE tickets.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) NOT NULL,
    client_id UUID NOT NULL REFERENCES policies.clients(id),
    site_id UUID REFERENCES policies.sites(id),
    policy_id UUID REFERENCES policies.policies(id),
    equipment_id UUID REFERENCES inventory.equipment(id),
    type tickets.ticket_type NOT NULL,
    priority tickets.ticket_priority DEFAULT 'medium',
    status tickets.ticket_status DEFAULT 'open',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reported_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    scheduled_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    sla_hours INT,
    sla_deadline TIMESTAMPTZ,
    sla_met BOOLEAN,
    resolution TEXT,
    customer_signature_url TEXT,
    rating INT CHECK (
        rating BETWEEN 1 AND 5
    ),
    rating_comment TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tickets_tenant_number UNIQUE(tenant_id, ticket_number)
);
-- Asignaciones de técnicos
CREATE TABLE tickets.ticket_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES auth.users(id),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    notes TEXT
);
-- Comentarios en tickets
CREATE TABLE tickets.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);
-- Evidencias (fotos, videos, documentos)
CREATE TABLE tickets.ticket_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size INT,
    description TEXT,
    evidence_type VARCHAR(50),
    uploaded_by UUID REFERENCES auth.users(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Timeline de eventos del ticket
CREATE TABLE tickets.ticket_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id),
    old_value TEXT,
    new_value TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Bitácoras de trabajo (worklogs)
CREATE TABLE tickets.worklogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES auth.users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INT,
    work_description TEXT NOT NULL,
    travel_time_minutes INT,
    travel_distance_km DECIMAL(10, 2),
    parts_used JSONB DEFAULT '[]',
    labor_type VARCHAR(50),
    is_billable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Índices multi-tenant
CREATE INDEX idx_tickets_tenant ON tickets.tickets(tenant_id);
CREATE INDEX idx_tickets_tenant_status ON tickets.tickets(tenant_id, status);
CREATE INDEX idx_tickets_tenant_priority ON tickets.tickets(tenant_id, priority);
CREATE INDEX idx_tickets_tenant_type ON tickets.tickets(tenant_id, type);
CREATE INDEX idx_tickets_client ON tickets.tickets(client_id);
CREATE INDEX idx_tickets_assigned_to ON tickets.tickets(assigned_to);
CREATE INDEX idx_tickets_sla ON tickets.tickets(sla_deadline)
WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX idx_tickets_created ON tickets.tickets(created_at DESC);
CREATE INDEX idx_ticket_assignments_tenant ON tickets.ticket_assignments(tenant_id);
CREATE INDEX idx_ticket_assignments_ticket ON tickets.ticket_assignments(ticket_id);
CREATE INDEX idx_ticket_assignments_technician ON tickets.ticket_assignments(technician_id);
CREATE INDEX idx_ticket_assignments_active ON tickets.ticket_assignments(is_active);
CREATE INDEX idx_ticket_comments_tenant ON tickets.ticket_comments(tenant_id);
CREATE INDEX idx_ticket_comments_ticket ON tickets.ticket_comments(ticket_id);
CREATE INDEX idx_ticket_evidences_tenant ON tickets.ticket_evidences(tenant_id);
CREATE INDEX idx_ticket_evidences_ticket ON tickets.ticket_evidences(ticket_id);
CREATE INDEX idx_ticket_timeline_tenant ON tickets.ticket_timeline(tenant_id);
CREATE INDEX idx_ticket_timeline_ticket ON tickets.ticket_timeline(ticket_id);
CREATE INDEX idx_worklogs_tenant ON tickets.worklogs(tenant_id);
CREATE INDEX idx_worklogs_ticket ON tickets.worklogs(ticket_id);
CREATE INDEX idx_worklogs_technician ON tickets.worklogs(technician_id);
COMMENT ON SCHEMA tickets IS 'Gestión de tickets y bitácoras de servicio';
COMMENT ON TABLE tickets.tickets IS 'Tickets de servicio por tenant';
COMMENT ON TABLE tickets.worklogs IS 'Registro de trabajo realizado en tickets';