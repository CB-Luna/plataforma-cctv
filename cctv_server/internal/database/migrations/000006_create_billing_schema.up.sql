-- 000006_create_billing_schema.up.sql
-- Schema de facturación (multi-tenant)
CREATE SCHEMA IF NOT EXISTS billing;
-- Tipo ENUM para estado de factura
CREATE TYPE billing.invoice_status AS ENUM (
    'draft',
    'pending',
    'sent',
    'stamped',
    'paid',
    'partial',
    'overdue',
    'cancelled'
);
-- Facturas
CREATE TABLE billing.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    folio VARCHAR(50),
    serie VARCHAR(10),
    client_id UUID NOT NULL REFERENCES policies.clients(id),
    policy_id UUID REFERENCES policies.policies(id),
    status billing.invoice_status DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    -- Montos
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 16.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    balance DECIMAL(12, 2) GENERATED ALWAYS AS (total - paid_amount) STORED,
    currency VARCHAR(3) DEFAULT 'MXN',
    -- CFDI (Timbrado fiscal México)
    cfdi_uuid VARCHAR(100),
    cfdi_status VARCHAR(50),
    uso_cfdi VARCHAR(10) DEFAULT 'G03',
    forma_pago VARCHAR(10),
    metodo_pago VARCHAR(10),
    xml_url TEXT,
    pdf_url TEXT,
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    stamped_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_invoices_tenant_number UNIQUE(tenant_id, invoice_number)
);
-- Conceptos de factura
CREATE TABLE billing.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES billing.invoices(id) ON DELETE CASCADE,
    product_key VARCHAR(20),
    unit_key VARCHAR(10) DEFAULT 'E48',
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    discount DECIMAL(12, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 16.00,
    amount DECIMAL(12, 2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Complementos de pago CFDI
CREATE TABLE billing.payment_complements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    complement_number VARCHAR(50) NOT NULL,
    invoice_id UUID NOT NULL REFERENCES billing.invoices(id),
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(10),
    cfdi_uuid VARCHAR(100),
    xml_url TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_complements_tenant_number UNIQUE(tenant_id, complement_number)
);
-- Índices multi-tenant
CREATE INDEX idx_invoices_tenant ON billing.invoices(tenant_id);
CREATE INDEX idx_invoices_tenant_status ON billing.invoices(tenant_id, status);
CREATE INDEX idx_invoices_tenant_dates ON billing.invoices(tenant_id, issue_date, due_date);
CREATE INDEX idx_invoices_client ON billing.invoices(client_id);
CREATE INDEX idx_invoices_policy ON billing.invoices(policy_id);
CREATE INDEX idx_invoices_cfdi ON billing.invoices(cfdi_uuid);
CREATE INDEX idx_invoices_overdue ON billing.invoices(due_date)
WHERE status IN ('pending', 'sent', 'partial');
CREATE INDEX idx_invoice_items_tenant ON billing.invoice_items(tenant_id);
CREATE INDEX idx_invoice_items_invoice ON billing.invoice_items(invoice_id);
CREATE INDEX idx_payment_complements_tenant ON billing.payment_complements(tenant_id);
CREATE INDEX idx_payment_complements_invoice ON billing.payment_complements(invoice_id);
COMMENT ON SCHEMA billing IS 'Gestión de facturación y CFDI';
COMMENT ON TABLE billing.invoices IS 'Facturas por tenant';
COMMENT ON TABLE billing.payment_complements IS 'Complementos de pago CFDI 4.0';