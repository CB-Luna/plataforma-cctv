-- 000003_create_policies_schema.up.sql
-- Schema de clientes, pólizas y coberturas (multi-tenant)
CREATE SCHEMA IF NOT EXISTS policies;
-- Clientes (empresas con póliza)
CREATE TABLE policies.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    rfc VARCHAR(13),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'México',
    email VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Contactos del cliente
CREATE TABLE policies.client_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES policies.clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Sitios/ubicaciones del cliente
CREATE TABLE policies.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES policies.clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Áreas dentro de un sitio
CREATE TABLE policies.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES policies.sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    floor VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Planes de cobertura
CREATE TABLE policies.coverage_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preventive_visits_per_year INT DEFAULT 0,
    emergency_response_time_hours INT DEFAULT 24,
    includes_parts BOOLEAN DEFAULT false,
    includes_labor BOOLEAN DEFAULT true,
    monthly_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    features JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Tipo ENUM para estado de póliza
CREATE TYPE policies.policy_status AS ENUM (
    'draft',
    'active',
    'suspended',
    'expired',
    'cancelled',
    'pending_renewal'
);
-- Pólizas/contratos
CREATE TABLE policies.policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    policy_number VARCHAR(50) NOT NULL,
    client_id UUID NOT NULL REFERENCES policies.clients(id),
    site_id UUID REFERENCES policies.sites(id),
    coverage_plan_id UUID REFERENCES policies.coverage_plans(id),
    status policies.policy_status DEFAULT 'draft',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_payment DECIMAL(10, 2) NOT NULL,
    payment_day INT CHECK (
        payment_day BETWEEN 1 AND 31
    ),
    notes TEXT,
    terms_accepted BOOLEAN DEFAULT false,
    contract_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_policies_tenant_number UNIQUE(tenant_id, policy_number)
);
-- Historial de cambios en pólizas
CREATE TABLE policies.policy_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies.policies(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    previous_status policies.policy_status,
    new_status policies.policy_status,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Índices multi-tenant
CREATE INDEX idx_clients_tenant ON policies.clients(tenant_id);
CREATE INDEX idx_clients_tenant_active ON policies.clients(tenant_id, is_active);
CREATE INDEX idx_clients_rfc ON policies.clients(rfc);
CREATE INDEX idx_client_contacts_tenant ON policies.client_contacts(tenant_id);
CREATE INDEX idx_client_contacts_client ON policies.client_contacts(client_id);
CREATE INDEX idx_sites_tenant ON policies.sites(tenant_id);
CREATE INDEX idx_sites_client ON policies.sites(client_id);
CREATE INDEX idx_areas_tenant ON policies.areas(tenant_id);
CREATE INDEX idx_areas_site ON policies.areas(site_id);
CREATE INDEX idx_coverage_plans_tenant ON policies.coverage_plans(tenant_id);
CREATE INDEX idx_policies_tenant ON policies.policies(tenant_id);
CREATE INDEX idx_policies_tenant_status ON policies.policies(tenant_id, status);
CREATE INDEX idx_policies_client ON policies.policies(client_id);
CREATE INDEX idx_policies_dates ON policies.policies(start_date, end_date);
CREATE INDEX idx_policy_history_tenant ON policies.policy_history(tenant_id);
CREATE INDEX idx_policy_history_policy ON policies.policy_history(policy_id);
COMMENT ON SCHEMA policies IS 'Gestión de clientes, pólizas y coberturas';
COMMENT ON TABLE policies.clients IS 'Empresas cliente con servicios CCTV';
COMMENT ON TABLE policies.sites IS 'Ubicaciones físicas de los clientes';
COMMENT ON TABLE policies.policies IS 'Contratos de servicio activos';