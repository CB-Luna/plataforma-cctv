-- 000006_create_billing_schema.down.sql
-- Revertir schema de billing
DROP INDEX IF EXISTS billing.idx_payment_complements_invoice;
DROP INDEX IF EXISTS billing.idx_payment_complements_tenant;
DROP INDEX IF EXISTS billing.idx_invoice_items_invoice;
DROP INDEX IF EXISTS billing.idx_invoice_items_tenant;
DROP INDEX IF EXISTS billing.idx_invoices_overdue;
DROP INDEX IF EXISTS billing.idx_invoices_cfdi;
DROP INDEX IF EXISTS billing.idx_invoices_policy;
DROP INDEX IF EXISTS billing.idx_invoices_client;
DROP INDEX IF EXISTS billing.idx_invoices_tenant_dates;
DROP INDEX IF EXISTS billing.idx_invoices_tenant_status;
DROP INDEX IF EXISTS billing.idx_invoices_tenant;
DROP TABLE IF EXISTS billing.payment_complements;
DROP TABLE IF EXISTS billing.invoice_items;
DROP TABLE IF EXISTS billing.invoices;
DROP TYPE IF EXISTS billing.invoice_status;
DROP SCHEMA IF EXISTS billing;