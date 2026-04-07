-- 000007_create_collection_schema.up.sql
-- Schema de cobranza y pagos (multi-tenant)
CREATE SCHEMA IF NOT EXISTS collection;
-- Tipo ENUM para método de pago
CREATE TYPE collection.payment_method AS ENUM (
    'cash',
    'transfer',
    'check',
    'credit_card',
    'debit_card',
    'paypal',
    'stripe',
    'other'
);
-- Tipo ENUM para estado de pago
CREATE TYPE collection.payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'cancelled'
);
-- Pagos recibidos
CREATE TABLE collection.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    payment_reference VARCHAR(100) NOT NULL,
    invoice_id UUID REFERENCES billing.invoices(id),
    client_id UUID NOT NULL REFERENCES policies.clients(id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_method collection.payment_method NOT NULL,
    status collection.payment_status DEFAULT 'pending',
    -- Detalles de transacción
    transaction_id VARCHAR(255),
    authorization_code VARCHAR(100),
    bank_name VARCHAR(100),
    account_last_four VARCHAR(4),
    -- Fechas
    payment_date DATE NOT NULL,
    processed_at TIMESTAMPTZ,
    -- Comprobantes
    receipt_url TEXT,
    notes TEXT,
    -- Auditoría
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payments_tenant_reference UNIQUE(tenant_id, payment_reference)
);
-- Estados de cuenta
CREATE TABLE collection.account_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES policies.clients(id),
    statement_number VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    opening_balance DECIMAL(12, 2) DEFAULT 0,
    charges DECIMAL(12, 2) DEFAULT 0,
    payments_received DECIMAL(12, 2) DEFAULT 0,
    adjustments DECIMAL(12, 2) DEFAULT 0,
    closing_balance DECIMAL(12, 2) DEFAULT 0,
    pdf_url TEXT,
    sent_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_statements_tenant_number UNIQUE(tenant_id, statement_number)
);
-- Recordatorios de pago
CREATE TABLE collection.payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES billing.invoices(id),
    client_id UUID NOT NULL REFERENCES policies.clients(id),
    reminder_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Notas de crédito
CREATE TABLE collection.credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    credit_note_number VARCHAR(50) NOT NULL,
    invoice_id UUID REFERENCES billing.invoices(id),
    client_id UUID NOT NULL REFERENCES policies.clients(id),
    amount DECIMAL(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    applied_to_invoice_id UUID REFERENCES billing.invoices(id),
    cfdi_uuid VARCHAR(100),
    xml_url TEXT,
    pdf_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_credit_notes_tenant_number UNIQUE(tenant_id, credit_note_number)
);
-- Índices multi-tenant
CREATE INDEX idx_payments_tenant ON collection.payments(tenant_id);
CREATE INDEX idx_payments_tenant_status ON collection.payments(tenant_id, status);
CREATE INDEX idx_payments_invoice ON collection.payments(invoice_id);
CREATE INDEX idx_payments_client ON collection.payments(client_id);
CREATE INDEX idx_payments_date ON collection.payments(payment_date);
CREATE INDEX idx_payments_method ON collection.payments(payment_method);
CREATE INDEX idx_account_statements_tenant ON collection.account_statements(tenant_id);
CREATE INDEX idx_account_statements_client ON collection.account_statements(client_id);
CREATE INDEX idx_account_statements_period ON collection.account_statements(period_start, period_end);
CREATE INDEX idx_payment_reminders_tenant ON collection.payment_reminders(tenant_id);
CREATE INDEX idx_payment_reminders_invoice ON collection.payment_reminders(invoice_id);
CREATE INDEX idx_credit_notes_tenant ON collection.credit_notes(tenant_id);
CREATE INDEX idx_credit_notes_client ON collection.credit_notes(client_id);
COMMENT ON SCHEMA collection IS 'Gestión de cobranza y pagos';
COMMENT ON TABLE collection.payments IS 'Pagos recibidos por tenant';
COMMENT ON TABLE collection.account_statements IS 'Estados de cuenta mensuales';