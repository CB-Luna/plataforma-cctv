-- 000024_inventory_cctv_specialized.up.sql
-- Tablas especializadas para inventario CCTV: Servidores NVR y Cámaras
-- Modelo híbrido: columnas dedicadas + JSONB para flexibilidad

-- Esta función se usa en varios triggers legacy del esquema CCTV.
-- La definimos aquí de forma idempotente para que la migración sea
-- reproducible incluso si el bootstrap anterior no la creó.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SERVIDORES NVR/VMS (Video Management System)
-- =============================================

-- Tabla principal de servidores NVR
CREATE TABLE inventory.nvr_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    site_id UUID REFERENCES policies.sites(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES inventory.brands(id) ON DELETE SET NULL,
    
    -- Identificación
    name VARCHAR(100) NOT NULL,                    -- Ej: "ASSY NVR-1", "NVR-1-HDNVR"
    code VARCHAR(50),                              -- Código interno único por tenant
    vms_server_id VARCHAR(100),                    -- ID del servidor en el VMS (genérico)
    
    -- Información del VMS
    edition VARCHAR(50),                           -- Enterprise, Standard, Professional
    vms_version VARCHAR(50),                       -- Versión del software VMS
    
    -- Canales/Licencias
    camera_channels INT DEFAULT 0,                 -- Canales de cámara
    tpv_channels INT DEFAULT 0,                    -- Canales de transacciones TPV
    lpr_channels INT DEFAULT 0,                    -- Canales LPR (reconocimiento de placas)
    integration_connections INT DEFAULT 0,         -- Conexiones de integración
    
    -- Hardware
    model VARCHAR(100),                            -- Modelo del servidor: OEMR R520, PowerEdge R710
    service_tag VARCHAR(50),                       -- Service Tag (Dell)
    service_code VARCHAR(50),                      -- Service Code
    processor VARCHAR(255),                        -- Intel Xeon CPU ES-2407 0 @ 2.20GHz
    ram_gb INT,                                    -- Memoria RAM en GB
    os_name VARCHAR(100),                          -- Windows Embedded Standard Service Pack 1
    system_type VARCHAR(50),                       -- 64 bits, 32 bits
    
    -- Red
    ip_address INET,
    subnet_mask INET,
    gateway INET,
    mac_address MACADDR,
    
    -- Almacenamiento (resumen)
    total_storage_tb DECIMAL(10, 2),               -- Capacidad total en TB
    recording_days INT,                            -- Días de grabación estimados
    
    -- Fechas
    launch_date DATE,                              -- Año de lanzamiento
    warranty_expiry_date DATE,                     -- Fecha fin de garantía
    installation_date DATE,
    
    -- Estado
    status inventory.equipment_status DEFAULT 'active',
    
    -- Credenciales (encriptadas en producción)
    admin_username VARCHAR(100),
    admin_password_encrypted TEXT,
    
    -- Especificaciones adicionales (híbrido JSONB)
    hardware_specs JSONB DEFAULT '{}',             -- Detalles de hardware adicionales
    network_config JSONB DEFAULT '{}',             -- Configuración de red adicional
    metadata JSONB DEFAULT '{}',                   -- Metadatos flexibles
    
    -- Notas
    notes TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT uq_nvr_servers_tenant_code UNIQUE(tenant_id, code)
);

-- =============================================
-- LICENCIAS DE NVR
-- =============================================

-- Tipos de licencia
CREATE TYPE inventory.license_type AS ENUM (
    'enterprise',
    'standard',
    'professional',
    'camera_channel',
    'lpr_channel',
    'tpv_channel',
    'analytics',
    'integration',
    'other'
);

-- Licencias activas por NVR
CREATE TABLE inventory.nvr_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nvr_server_id UUID NOT NULL REFERENCES inventory.nvr_servers(id) ON DELETE CASCADE,
    
    -- Información de licencia
    license_key VARCHAR(255),                      -- Clave de licencia
    license_type inventory.license_type NOT NULL,
    edition VARCHAR(50),                           -- Enterprise, Standard
    
    -- Cantidades
    total_licenses INT NOT NULL DEFAULT 0,
    used_licenses INT NOT NULL DEFAULT 0,
    
    -- Fechas
    issue_date DATE,
    expiry_date DATE,
    is_perpetual BOOLEAN DEFAULT false,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}',
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_nvr_licenses_used CHECK (used_licenses <= total_licenses)
);

-- Histórico de cambios en licencias
CREATE TABLE inventory.nvr_license_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nvr_license_id UUID NOT NULL REFERENCES inventory.nvr_licenses(id) ON DELETE CASCADE,
    nvr_server_id UUID NOT NULL REFERENCES inventory.nvr_servers(id) ON DELETE CASCADE,
    
    -- Información del cambio
    change_type VARCHAR(50) NOT NULL,              -- created, updated, renewed, expired, revoked
    field_changed VARCHAR(100),                    -- Campo que cambió (null si es creación)
    old_value TEXT,
    new_value TEXT,
    
    -- Descripción
    description TEXT,
    
    -- Auditoría
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- UNIDADES DE ALMACENAMIENTO POR NVR
-- =============================================

CREATE TABLE inventory.nvr_storage_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nvr_server_id UUID NOT NULL REFERENCES inventory.nvr_servers(id) ON DELETE CASCADE,
    
    -- Información del disco
    slot_number INT,                               -- Número de slot
    disk_type VARCHAR(50),                         -- HDD, SSD, NVMe
    brand VARCHAR(100),                            -- Marca del disco
    model VARCHAR(100),                            -- Modelo del disco
    serial_number VARCHAR(100),
    capacity_tb DECIMAL(10, 2) NOT NULL,           -- Capacidad en TB
    
    -- Estado
    status VARCHAR(50) DEFAULT 'healthy',          -- healthy, warning, failed, spare
    health_percentage INT DEFAULT 100,
    
    -- Fechas
    installation_date DATE,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CÁMARAS (especializada, multi-marca)
-- =============================================

-- Tipos de cámara
CREATE TYPE inventory.camera_type AS ENUM (
    'micro_dome',
    'dome',
    'dome_360',
    'ptz',
    'bullet',
    'box',
    'fisheye',
    'multisensor',
    'thermal',
    'encoder',
    'other'
);

-- Tabla principal de cámaras
CREATE TABLE inventory.cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nvr_server_id UUID REFERENCES inventory.nvr_servers(id) ON DELETE SET NULL,
    site_id UUID REFERENCES policies.sites(id) ON DELETE SET NULL,
    area_id UUID REFERENCES policies.areas(id) ON DELETE SET NULL,
    model_id UUID REFERENCES inventory.models(id) ON DELETE SET NULL,
    
    -- Identificación
    consecutive INT,                               -- Número consecutivo
    name VARCHAR(255) NOT NULL,                    -- Nombre descriptivo: "Casilleros comedor 4"
    code VARCHAR(50),                              -- Código interno único por tenant
    
    -- Tipo
    camera_type inventory.camera_type DEFAULT 'dome',
    camera_model_name VARCHAR(255),                -- Tipo completo: "Avigilon (ONVIF) 2.0-H3M-DO1"
    generation VARCHAR(50),                        -- Generación del modelo
    
    -- Red
    ip_address INET,
    mac_address MACADDR,
    
    -- Especificaciones técnicas
    resolution VARCHAR(50),                        -- 1920x1080, 2992x2992
    megapixels DECIMAL(4, 1),                      -- 2.0, 4.0, 8.0
    ips INT,                                       -- Frames por segundo
    bitrate_kbps INT,                              -- Bitrate en kbps
    quality INT,                                   -- Calidad (1-10 o porcentaje)
    
    -- Firmware
    firmware_version VARCHAR(100),
    serial_number VARCHAR(100),
    
    -- Ubicación
    area VARCHAR(100),                             -- Área: "Bóveda 2", "Almacén"
    zone VARCHAR(100),                             -- Zona específica
    location_description TEXT,                     -- Descripción de ubicación
    project VARCHAR(100),                          -- Proyecto asociado
    
    -- Conteo (para cámaras con analytics)
    has_counting BOOLEAN DEFAULT false,
    counting_enabled BOOLEAN DEFAULT false,
    
    -- Estado
    status inventory.equipment_status DEFAULT 'active',
    
    -- Fechas
    installation_date DATE,
    warranty_expiry_date DATE,
    
    -- Especificaciones adicionales (híbrido JSONB)
    specifications JSONB DEFAULT '{}',             -- Especificaciones técnicas flexibles
    analytics_config JSONB DEFAULT '{}',           -- Configuración de analíticas
    metadata JSONB DEFAULT '{}',                   -- Metadatos adicionales
    
    -- Notas
    notes TEXT,
    comments TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT uq_cameras_tenant_code UNIQUE(tenant_id, code)
);

-- Histórico de asignaciones cámara-NVR
CREATE TABLE inventory.camera_nvr_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    camera_id UUID NOT NULL REFERENCES inventory.cameras(id) ON DELETE CASCADE,
    
    -- NVR anterior y nuevo
    old_nvr_server_id UUID REFERENCES inventory.nvr_servers(id) ON DELETE SET NULL,
    new_nvr_server_id UUID REFERENCES inventory.nvr_servers(id) ON DELETE SET NULL,
    
    -- Motivo del cambio
    reason TEXT,
    
    -- Auditoría
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- IMPORTACIÓN MASIVA
-- =============================================

-- Estados de importación
CREATE TYPE inventory.import_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'completed_with_errors',
    'failed',
    'cancelled'
);

-- Tipos de fuente de importación
CREATE TYPE inventory.import_source_type AS ENUM (
    'excel',
    'csv',
    'ocr_image',
    'api',
    'manual'
);

-- Lotes de importación
CREATE TABLE inventory.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Información del lote
    batch_name VARCHAR(255) NOT NULL,
    source_type inventory.import_source_type NOT NULL,
    source_filename VARCHAR(255),
    
    -- Tipo de datos a importar
    target_table VARCHAR(50) NOT NULL,             -- nvr_servers, cameras, etc.
    
    -- Mapeo de columnas (JSON)
    column_mapping JSONB NOT NULL DEFAULT '{}',
    
    -- Contadores
    total_rows INT DEFAULT 0,
    processed_rows INT DEFAULT 0,
    success_rows INT DEFAULT 0,
    error_rows INT DEFAULT 0,
    skipped_rows INT DEFAULT 0,
    
    -- Estado
    status inventory.import_status DEFAULT 'pending',
    error_message TEXT,
    
    -- Archivo original (referencia a storage)
    source_file_id UUID,
    
    -- Fechas
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Items individuales de importación
CREATE TABLE inventory.import_batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES inventory.import_batches(id) ON DELETE CASCADE,
    
    -- Número de fila en el archivo original
    row_number INT NOT NULL,
    
    -- Datos originales
    raw_data JSONB NOT NULL,
    
    -- Resultado
    status VARCHAR(50) DEFAULT 'pending',          -- pending, success, error, skipped
    error_message TEXT,
    
    -- Referencia al registro creado (si exitoso)
    created_record_id UUID,
    created_record_table VARCHAR(50),
    
    -- Auditoría
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ÍNDICES
-- =============================================

-- Índices para nvr_servers
CREATE INDEX idx_nvr_servers_tenant ON inventory.nvr_servers(tenant_id);
CREATE INDEX idx_nvr_servers_tenant_site ON inventory.nvr_servers(tenant_id, site_id);
CREATE INDEX idx_nvr_servers_tenant_status ON inventory.nvr_servers(tenant_id, status);
CREATE INDEX idx_nvr_servers_brand ON inventory.nvr_servers(brand_id);
CREATE INDEX idx_nvr_servers_ip ON inventory.nvr_servers(ip_address);
CREATE INDEX idx_nvr_servers_name ON inventory.nvr_servers(tenant_id, name);

-- Índices para nvr_licenses
CREATE INDEX idx_nvr_licenses_tenant ON inventory.nvr_licenses(tenant_id);
CREATE INDEX idx_nvr_licenses_server ON inventory.nvr_licenses(nvr_server_id);
CREATE INDEX idx_nvr_licenses_expiry ON inventory.nvr_licenses(expiry_date) WHERE is_perpetual = false;
CREATE INDEX idx_nvr_licenses_active ON inventory.nvr_licenses(nvr_server_id) WHERE is_active = true;

-- Índices para nvr_license_history
CREATE INDEX idx_nvr_license_history_tenant ON inventory.nvr_license_history(tenant_id);
CREATE INDEX idx_nvr_license_history_license ON inventory.nvr_license_history(nvr_license_id);
CREATE INDEX idx_nvr_license_history_server ON inventory.nvr_license_history(nvr_server_id);
CREATE INDEX idx_nvr_license_history_date ON inventory.nvr_license_history(changed_at DESC);

-- Índices para nvr_storage_units
CREATE INDEX idx_nvr_storage_tenant ON inventory.nvr_storage_units(tenant_id);
CREATE INDEX idx_nvr_storage_server ON inventory.nvr_storage_units(nvr_server_id);

-- Índices para cameras
CREATE INDEX idx_cameras_tenant ON inventory.cameras(tenant_id);
CREATE INDEX idx_cameras_tenant_nvr ON inventory.cameras(tenant_id, nvr_server_id);
CREATE INDEX idx_cameras_tenant_site ON inventory.cameras(tenant_id, site_id);
CREATE INDEX idx_cameras_tenant_status ON inventory.cameras(tenant_id, status);
CREATE INDEX idx_cameras_model ON inventory.cameras(model_id);
CREATE INDEX idx_cameras_ip ON inventory.cameras(ip_address);
CREATE INDEX idx_cameras_type ON inventory.cameras(tenant_id, camera_type);
CREATE INDEX idx_cameras_serial ON inventory.cameras(serial_number);
CREATE INDEX idx_cameras_name ON inventory.cameras(tenant_id, name);

-- Índices para camera_nvr_history
CREATE INDEX idx_camera_nvr_history_tenant ON inventory.camera_nvr_history(tenant_id);
CREATE INDEX idx_camera_nvr_history_camera ON inventory.camera_nvr_history(camera_id);
CREATE INDEX idx_camera_nvr_history_date ON inventory.camera_nvr_history(changed_at DESC);

-- Índices para import_batches
CREATE INDEX idx_import_batches_tenant ON inventory.import_batches(tenant_id);
CREATE INDEX idx_import_batches_status ON inventory.import_batches(tenant_id, status);
CREATE INDEX idx_import_batches_date ON inventory.import_batches(created_at DESC);

-- Índices para import_batch_items
CREATE INDEX idx_import_batch_items_tenant ON inventory.import_batch_items(tenant_id);
CREATE INDEX idx_import_batch_items_batch ON inventory.import_batch_items(batch_id);
CREATE INDEX idx_import_batch_items_status ON inventory.import_batch_items(batch_id, status);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER trg_nvr_servers_updated_at
    BEFORE UPDATE ON inventory.nvr_servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_nvr_licenses_updated_at
    BEFORE UPDATE ON inventory.nvr_licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_nvr_storage_units_updated_at
    BEFORE UPDATE ON inventory.nvr_storage_units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_cameras_updated_at
    BEFORE UPDATE ON inventory.cameras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TRIGGER PARA HISTÓRICO DE LICENCIAS
-- =============================================

CREATE OR REPLACE FUNCTION inventory.log_license_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO inventory.nvr_license_history (
            tenant_id, nvr_license_id, nvr_server_id, change_type, description
        ) VALUES (
            NEW.tenant_id, NEW.id, NEW.nvr_server_id, 'created', 'Licencia creada'
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log cambios en total_licenses
        IF OLD.total_licenses IS DISTINCT FROM NEW.total_licenses THEN
            INSERT INTO inventory.nvr_license_history (
                tenant_id, nvr_license_id, nvr_server_id, change_type, 
                field_changed, old_value, new_value
            ) VALUES (
                NEW.tenant_id, NEW.id, NEW.nvr_server_id, 'updated',
                'total_licenses', OLD.total_licenses::TEXT, NEW.total_licenses::TEXT
            );
        END IF;
        
        -- Log cambios en used_licenses
        IF OLD.used_licenses IS DISTINCT FROM NEW.used_licenses THEN
            INSERT INTO inventory.nvr_license_history (
                tenant_id, nvr_license_id, nvr_server_id, change_type,
                field_changed, old_value, new_value
            ) VALUES (
                NEW.tenant_id, NEW.id, NEW.nvr_server_id, 'updated',
                'used_licenses', OLD.used_licenses::TEXT, NEW.used_licenses::TEXT
            );
        END IF;
        
        -- Log cambios en expiry_date
        IF OLD.expiry_date IS DISTINCT FROM NEW.expiry_date THEN
            INSERT INTO inventory.nvr_license_history (
                tenant_id, nvr_license_id, nvr_server_id, change_type,
                field_changed, old_value, new_value, description
            ) VALUES (
                NEW.tenant_id, NEW.id, NEW.nvr_server_id, 'renewed',
                'expiry_date', OLD.expiry_date::TEXT, NEW.expiry_date::TEXT,
                'Fecha de expiración actualizada'
            );
        END IF;
        
        -- Log cambios en is_active
        IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
            INSERT INTO inventory.nvr_license_history (
                tenant_id, nvr_license_id, nvr_server_id, change_type,
                field_changed, old_value, new_value
            ) VALUES (
                NEW.tenant_id, NEW.id, NEW.nvr_server_id,
                CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END,
                'is_active', OLD.is_active::TEXT, NEW.is_active::TEXT
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nvr_licenses_history
    AFTER INSERT OR UPDATE ON inventory.nvr_licenses
    FOR EACH ROW EXECUTE FUNCTION inventory.log_license_changes();

-- =============================================
-- TRIGGER PARA HISTÓRICO DE ASIGNACIÓN CÁMARA-NVR
-- =============================================

CREATE OR REPLACE FUNCTION inventory.log_camera_nvr_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.nvr_server_id IS DISTINCT FROM NEW.nvr_server_id THEN
        INSERT INTO inventory.camera_nvr_history (
            tenant_id, camera_id, old_nvr_server_id, new_nvr_server_id
        ) VALUES (
            NEW.tenant_id, NEW.id, OLD.nvr_server_id, NEW.nvr_server_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_camera_nvr_history
    AFTER UPDATE ON inventory.cameras
    FOR EACH ROW EXECUTE FUNCTION inventory.log_camera_nvr_changes();

-- =============================================
-- COMENTARIOS
-- =============================================

COMMENT ON TABLE inventory.nvr_servers IS 'Servidores NVR/VMS (multi-marca: Avigilon, Milestone, Genetec, etc.)';
COMMENT ON TABLE inventory.nvr_licenses IS 'Licencias activas por servidor NVR';
COMMENT ON TABLE inventory.nvr_license_history IS 'Histórico de cambios en licencias para auditoría';
COMMENT ON TABLE inventory.nvr_storage_units IS 'Unidades de almacenamiento (discos) por NVR';
COMMENT ON TABLE inventory.cameras IS 'Cámaras multi-marca (Avigilon, Hikvision, Dahua, Axis, etc.)';
COMMENT ON TABLE inventory.camera_nvr_history IS 'Histórico de asignaciones cámara-NVR';
COMMENT ON TABLE inventory.import_batches IS 'Lotes de importación masiva (Excel, CSV, OCR)';
COMMENT ON TABLE inventory.import_batch_items IS 'Items individuales de cada lote de importación';

COMMENT ON COLUMN inventory.nvr_servers.vms_server_id IS 'ID del servidor en el VMS (genérico para cualquier marca)';
COMMENT ON COLUMN inventory.nvr_servers.hardware_specs IS 'Especificaciones de hardware adicionales en formato JSON';
COMMENT ON COLUMN inventory.cameras.camera_model_name IS 'Nombre completo del modelo (ej: Avigilon (ONVIF) 2.0-H3M-DO1)';
COMMENT ON COLUMN inventory.cameras.specifications IS 'Especificaciones técnicas flexibles por marca en JSON';
