-- 000001_create_tenants.up.sql
-- Tabla principal de tenants (proveedores/marcas)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#1976D2',
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    max_users INT DEFAULT 10,
    max_clients INT DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_is_active ON public.tenants(is_active);
COMMENT ON TABLE public.tenants IS 'Proveedores de servicios CCTV (multi-tenant principal)';
COMMENT ON COLUMN public.tenants.slug IS 'Identificador URL-friendly para subdominios';
COMMENT ON COLUMN public.tenants.settings IS 'Configuración personalizada en JSON';