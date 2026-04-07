-- 000009_create_storage_schema.up.sql
-- Esquema para gestión centralizada de archivos y multimedia
CREATE SCHEMA storage;
-- Tabla principal de archivos
CREATE TABLE storage.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- Metadata del archivo
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    -- bytes
    file_hash VARCHAR(64),
    -- SHA256 para detectar duplicados
    -- Ubicación
    storage_provider VARCHAR(50) DEFAULT 'minio',
    -- minio, s3, local
    storage_bucket VARCHAR(100),
    storage_path TEXT NOT NULL,
    storage_url TEXT,
    -- URL pública si aplica
    -- Clasificación
    category VARCHAR(50),
    -- ticket_evidence, equipment_photo, invoice_pdf, user_avatar, etc.
    related_entity_type VARCHAR(50),
    -- tickets, equipment, invoices, users, etc.
    related_entity_id UUID,
    -- Procesamiento
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    -- Metadata adicional (EXIF, dimensiones, duración, etc.)
    metadata JSONB DEFAULT '{}',
    -- Audit
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de procesamiento de archivos
CREATE TABLE storage.file_processing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES storage.files(id) ON DELETE CASCADE,
    processing_type VARCHAR(50) NOT NULL,
    -- ai_analysis, ocr, thumbnail, compression, virus_scan
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, processing, completed, failed
    -- Resultado
    result JSONB,
    error_message TEXT,
    -- Performance
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_time_ms INT,
    -- Tiempo de procesamiento
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de acceso a archivos (para auditoría)
CREATE TABLE storage.file_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES storage.files(id) ON DELETE CASCADE,
    access_type VARCHAR(20) NOT NULL,
    -- view, download, delete
    accessed_by UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Índices para optimizar búsquedas
CREATE INDEX idx_files_tenant ON storage.files(tenant_id);
CREATE INDEX idx_files_category ON storage.files(category);
CREATE INDEX idx_files_entity ON storage.files(related_entity_type, related_entity_id);
CREATE INDEX idx_files_hash ON storage.files(file_hash);
CREATE INDEX idx_files_created ON storage.files(created_at DESC);
CREATE INDEX idx_file_processing_file ON storage.file_processing(file_id);
CREATE INDEX idx_file_processing_status ON storage.file_processing(status);
CREATE INDEX idx_file_processing_type ON storage.file_processing(processing_type);
CREATE INDEX idx_file_access_log_file ON storage.file_access_log(file_id);
CREATE INDEX idx_file_access_log_created ON storage.file_access_log(created_at DESC);
-- Comentarios
COMMENT ON SCHEMA storage IS 'Gestión centralizada de archivos y multimedia';
COMMENT ON TABLE storage.files IS 'Tabla principal de archivos subidos al sistema';
COMMENT ON TABLE storage.file_processing IS 'Cola de procesamiento de archivos (IA, OCR, thumbnails)';
COMMENT ON TABLE storage.file_access_log IS 'Auditoría de acceso a archivos';
COMMENT ON COLUMN storage.files.file_hash IS 'SHA256 hash para detectar duplicados';
COMMENT ON COLUMN storage.files.metadata IS 'EXIF, dimensiones, duración, etc. en formato JSON';