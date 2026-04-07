-- 000021_create_storage_config_tables.up.sql
-- Agregar tablas de configuración de proveedores de almacenamiento
-- Basado en el esquema de systemcattle para soportar múltiples proveedores de object storage
-- Paso 1: Función para actualizar timestamps si no existe
CREATE OR REPLACE FUNCTION storage.update_storage_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Paso 2: Catálogo de proveedores de almacenamiento
CREATE TABLE IF NOT EXISTS storage.storage_providers (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(50) UNIQUE NOT NULL,
    -- minio, aws_s3, etc.
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    provider_type VARCHAR(30) NOT NULL DEFAULT 'database',
    -- database, cloud_storage, cdn
    is_active BOOLEAN DEFAULT TRUE,
    supports_collections BOOLEAN DEFAULT TRUE,
    supports_authentication BOOLEAN DEFAULT TRUE,
    supports_direct_upload BOOLEAN DEFAULT FALSE,
    max_file_size_mb INTEGER DEFAULT 10,
    allowed_file_types TEXT [],
    -- Array de extensiones permitidas
    configuration_schema JSONB,
    -- Schema JSON que define los campos requeridos
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Paso 3: Configuraciones específicas por proveedor/tenant
CREATE TABLE IF NOT EXISTS storage.storage_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    provider_id INTEGER NOT NULL REFERENCES storage.storage_providers(id) ON DELETE CASCADE,
    config_name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    -- Configuración de conexión
    host VARCHAR(255),
    port INTEGER,
    database_name VARCHAR(100),
    -- Credenciales (idealmente encriptadas en el futuro)
    username VARCHAR(100),
    password_text TEXT,
    -- Para proveedores cloud
    api_key TEXT,
    secret_key TEXT,
    base_url VARCHAR(500),
    bucket_name VARCHAR(100),
    region VARCHAR(50),
    project_id VARCHAR(100),
    -- Configuración extendida
    additional_config JSONB DEFAULT '{}',
    module_mappings JSONB DEFAULT '{}',
    -- Mapeo de módulos a colecciones/paths
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, provider_id, config_name)
);
-- Paso 4: Mapeos específicos de módulos a storage configurado
CREATE TABLE IF NOT EXISTS storage.module_storage_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_name VARCHAR(50) NOT NULL,
    -- users, inventory, tickets, etc.
    collection_name VARCHAR(100) NOT NULL,
    config_id UUID NOT NULL REFERENCES storage.storage_configurations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    max_file_size_mb INTEGER,
    allowed_file_types TEXT [],
    auto_resize BOOLEAN DEFAULT FALSE,
    thumbnail_sizes INTEGER [],
    -- [150, 300, 600]
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, module_name, config_id)
);
-- Triggers para updated_at
CREATE TRIGGER trigger_storage_providers_updated_at BEFORE
UPDATE ON storage.storage_providers FOR EACH ROW EXECUTE FUNCTION storage.update_storage_timestamp();
CREATE TRIGGER trigger_storage_configurations_updated_at BEFORE
UPDATE ON storage.storage_configurations FOR EACH ROW EXECUTE FUNCTION storage.update_storage_timestamp();
CREATE TRIGGER trigger_module_storage_mappings_updated_at BEFORE
UPDATE ON storage.module_storage_mappings FOR EACH ROW EXECUTE FUNCTION storage.update_storage_timestamp();
-- Seed inicial de proveedores
INSERT INTO storage.storage_providers (
        provider_name,
        display_name,
        description,
        provider_type,
        configuration_schema
    )
VALUES (
        'minio',
        'MinIO Object Storage',
        'Almacenamiento de objetos compatible con S3, ideal para grandes volúmenes de multimedia.',
        'cloud_storage',
        '{"required": ["base_url", "api_key", "secret_key", "bucket_name"]}'::jsonb
    );
