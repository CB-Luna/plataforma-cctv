-- 000004_create_inventory_schema.up.sql
-- Schema de inventario CCTV
-- Catálogos GLOBALES (sin tenant_id) + Equipos MULTI-TENANT
CREATE SCHEMA IF NOT EXISTS inventory;
-- =============================================
-- CATÁLOGOS GLOBALES (compartidos por todos los tenants)
-- =============================================
-- Tipos de equipo
CREATE TABLE inventory.equipment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Marcas
CREATE TABLE inventory.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    website VARCHAR(255),
    country VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Modelos
CREATE TABLE inventory.models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES inventory.brands(id) ON DELETE CASCADE,
    equipment_type_id UUID NOT NULL REFERENCES inventory.equipment_types(id),
    name VARCHAR(100) NOT NULL,
    part_number VARCHAR(100),
    specifications JSONB DEFAULT '{}',
    datasheet_url TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_models_brand_name UNIQUE(brand_id, name)
);
-- Tipo ENUM para estado de equipo
CREATE TYPE inventory.equipment_status AS ENUM (
    'active',
    'inactive',
    'faulty',
    'under_maintenance',
    'retired',
    'pending_installation'
);
-- =============================================
-- TABLAS MULTI-TENANT (datos de negocio)
-- =============================================
-- Equipos instalados
CREATE TABLE inventory.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES policies.clients(id) ON DELETE CASCADE,
    site_id UUID REFERENCES policies.sites(id),
    area_id UUID REFERENCES policies.areas(id),
    model_id UUID REFERENCES inventory.models(id),
    equipment_type_id UUID NOT NULL REFERENCES inventory.equipment_types(id),
    serial_number VARCHAR(100),
    asset_tag VARCHAR(50),
    ip_address INET,
    mac_address MACADDR,
    status inventory.equipment_status DEFAULT 'active',
    installation_date DATE,
    warranty_expiry_date DATE,
    location_description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    last_maintenance_at TIMESTAMPTZ,
    next_maintenance_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Historial de mantenimiento
CREATE TABLE inventory.maintenance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES inventory.equipment(id) ON DELETE CASCADE,
    ticket_id UUID,
    service_date DATE NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    description TEXT,
    findings TEXT,
    parts_replaced JSONB DEFAULT '[]',
    labor_hours DECIMAL(5, 2),
    next_service_date DATE,
    photos JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Índices para catálogos globales
CREATE INDEX idx_models_brand ON inventory.models(brand_id);
CREATE INDEX idx_models_equipment_type ON inventory.models(equipment_type_id);
CREATE INDEX idx_models_active ON inventory.models(is_active);
-- Índices multi-tenant
CREATE INDEX idx_equipment_tenant ON inventory.equipment(tenant_id);
CREATE INDEX idx_equipment_tenant_client ON inventory.equipment(tenant_id, client_id);
CREATE INDEX idx_equipment_tenant_status ON inventory.equipment(tenant_id, status);
CREATE INDEX idx_equipment_tenant_type ON inventory.equipment(tenant_id, equipment_type_id);
CREATE INDEX idx_equipment_site ON inventory.equipment(site_id);
CREATE INDEX idx_equipment_serial ON inventory.equipment(serial_number);
CREATE INDEX idx_equipment_next_maintenance ON inventory.equipment(next_maintenance_at);
CREATE INDEX idx_maintenance_history_tenant ON inventory.maintenance_history(tenant_id);
CREATE INDEX idx_maintenance_history_equipment ON inventory.maintenance_history(equipment_id);
CREATE INDEX idx_maintenance_history_date ON inventory.maintenance_history(service_date);
COMMENT ON SCHEMA inventory IS 'Inventario de equipos CCTV';
COMMENT ON TABLE inventory.equipment_types IS 'Catálogo global de tipos de equipo';
COMMENT ON TABLE inventory.brands IS 'Catálogo global de marcas';
COMMENT ON TABLE inventory.models IS 'Catálogo global de modelos por marca';
COMMENT ON TABLE inventory.equipment IS 'Equipos instalados por tenant';