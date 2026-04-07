-- 000010_create_ai_schema.up.sql
-- Esquema para Inteligencia Artificial
CREATE SCHEMA intelligence;
-- Configuración de modelos de IA por tenant
CREATE TABLE intelligence.model_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- Identificación
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    -- openai, anthropic, google, azure, local
    model_name VARCHAR(100) NOT NULL,
    -- gpt-4, claude-3-opus, gemini-pro, llama-2, etc.
    -- API Configuration
    api_key_encrypted TEXT,
    -- Encriptado con fernet o similar
    api_endpoint TEXT,
    api_version VARCHAR(20),
    -- Parámetros por defecto
    default_temperature DECIMAL(3, 2) DEFAULT 0.7,
    default_max_tokens INT DEFAULT 1000,
    default_top_p DECIMAL(3, 2) DEFAULT 1.0,
    default_top_k INT,
    -- Límites y control
    max_tokens_per_request INT DEFAULT 4000,
    max_requests_per_day INT,
    max_requests_per_hour INT,
    monthly_budget_usd DECIMAL(10, 2),
    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    -- Metadata
    description TEXT,
    capabilities JSONB DEFAULT '{}',
    -- {"vision": true, "function_calling": true, "multimodal": false}
    settings JSONB DEFAULT '{}',
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_model_configs_tenant_name UNIQUE(tenant_id, name),
    CONSTRAINT chk_temperature CHECK (
        default_temperature >= 0
        AND default_temperature <= 2
    ),
    CONSTRAINT chk_top_p CHECK (
        default_top_p >= 0
        AND default_top_p <= 1
    )
);
-- Plantillas de prompts
CREATE TABLE intelligence.prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- NULL = template global/system
    -- Identificación
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- ticket_analysis, image_recognition, text_summary, translation, etc.
    -- Prompt
    system_prompt TEXT,
    user_prompt_template TEXT NOT NULL,
    -- Con placeholders: {{ticket_description}}, {{image_url}}, etc.
    -- Configuración
    model_config_id UUID REFERENCES intelligence.model_configs(id),
    temperature DECIMAL(3, 2),
    max_tokens INT,
    response_format VARCHAR(20) DEFAULT 'text',
    -- text, json, markdown
    -- Metadata
    description TEXT,
    variables JSONB DEFAULT '[]',
    -- ["ticket_description", "image_url", "client_name"]
    example_input JSONB,
    example_output TEXT,
    -- Versioning
    is_active BOOLEAN DEFAULT true,
    version INT DEFAULT 1,
    parent_template_id UUID REFERENCES intelligence.prompt_templates(id),
    -- Para versionado
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_prompt_temperature CHECK (
        temperature IS NULL
        OR (
            temperature >= 0
            AND temperature <= 2
        )
    )
);
-- Historial de llamadas a APIs de IA
CREATE TABLE intelligence.api_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- Contexto
    model_config_id UUID REFERENCES intelligence.model_configs(id),
    prompt_template_id UUID REFERENCES intelligence.prompt_templates(id),
    -- Request
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_text TEXT NOT NULL,
    system_prompt TEXT,
    temperature DECIMAL(3, 2),
    max_tokens INT,
    parameters JSONB DEFAULT '{}',
    -- Response
    response_text TEXT,
    finish_reason VARCHAR(50),
    -- stop, length, content_filter, tool_calls, etc.
    -- Uso y costos
    prompt_tokens INT,
    completion_tokens INT,
    total_tokens INT,
    estimated_cost_usd DECIMAL(10, 4),
    -- Performance
    latency_ms INT,
    -- Tiempo de respuesta en milisegundos
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    -- Estado
    status VARCHAR(20) NOT NULL,
    -- success, error, timeout, rate_limit
    error_message TEXT,
    -- Trazabilidad
    related_entity_type VARCHAR(50),
    -- tickets, storage.files, equipment, etc.
    related_entity_id UUID,
    triggered_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Análisis generados por IA
CREATE TABLE intelligence.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- Tipo de análisis
    analysis_type VARCHAR(50) NOT NULL,
    -- ticket_classification, image_damage_detection, text_sentiment, ocr, etc.
    -- Input
    input_type VARCHAR(50) NOT NULL,
    -- text, image, document, video, audio
    input_reference UUID,
    -- ID del archivo, ticket, etc.
    input_data JSONB,
    -- Datos de entrada si no hay referencia
    -- Output
    result JSONB NOT NULL,
    confidence_score DECIMAL(5, 4),
    -- 0.0 to 1.0
    -- Metadata
    api_call_id UUID REFERENCES intelligence.api_calls(id),
    model_used VARCHAR(100),
    processing_time_ms INT,
    -- Validación humana
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    is_correct BOOLEAN,
    -- Si la IA acertó o no
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_confidence_score CHECK (
        confidence_score IS NULL
        OR (
            confidence_score >= 0
            AND confidence_score <= 1
        )
    )
);
-- Uso y costos por tenant (resumen diario/mensual)
CREATE TABLE intelligence.usage_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    period_type VARCHAR(10) NOT NULL,
    -- day, month
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    -- Estadísticas de uso
    total_api_calls INT DEFAULT 0,
    successful_calls INT DEFAULT 0,
    failed_calls INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    total_prompt_tokens INT DEFAULT 0,
    total_completion_tokens INT DEFAULT 0,
    -- Costos
    total_cost_usd DECIMAL(10, 2) DEFAULT 0.00,
    -- Por proveedor
    usage_by_provider JSONB DEFAULT '{}',
    -- {"openai": {"calls": 100, "tokens": 5000, "cost": 2.50}, ...}
    usage_by_model JSONB DEFAULT '{}',
    -- {"gpt-4": {"calls": 50, "cost": 1.80}, ...}
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usage_summary_tenant_period UNIQUE(tenant_id, period_type, period_start, period_end)
);
-- Índices
CREATE INDEX idx_model_configs_tenant ON intelligence.model_configs(tenant_id);
CREATE INDEX idx_model_configs_active ON intelligence.model_configs(tenant_id, is_active);
CREATE INDEX idx_model_configs_provider ON intelligence.model_configs(provider);
CREATE INDEX idx_prompt_templates_tenant ON intelligence.prompt_templates(tenant_id);
CREATE INDEX idx_prompt_templates_category ON intelligence.prompt_templates(category);
CREATE INDEX idx_prompt_templates_active ON intelligence.prompt_templates(is_active);
CREATE INDEX idx_api_calls_tenant ON intelligence.api_calls(tenant_id);
CREATE INDEX idx_api_calls_created ON intelligence.api_calls(created_at DESC);
CREATE INDEX idx_api_calls_status ON intelligence.api_calls(status);
CREATE INDEX idx_api_calls_provider ON intelligence.api_calls(provider);
CREATE INDEX idx_api_calls_entity ON intelligence.api_calls(related_entity_type, related_entity_id);
CREATE INDEX idx_analyses_tenant ON intelligence.analyses(tenant_id);
CREATE INDEX idx_analyses_type ON intelligence.analyses(analysis_type);
CREATE INDEX idx_analyses_created ON intelligence.analyses(created_at DESC);
CREATE INDEX idx_analyses_verified ON intelligence.analyses(is_verified);
CREATE INDEX idx_usage_summary_tenant ON intelligence.usage_summary(tenant_id);
CREATE INDEX idx_usage_summary_period ON intelligence.usage_summary(period_start, period_end);
-- Comentarios
COMMENT ON SCHEMA intelligence IS 'Inteligencia Artificial - Configuración, llamadas y análisis';
COMMENT ON TABLE intelligence.model_configs IS 'Configuración de modelos de IA por tenant';
COMMENT ON TABLE intelligence.prompt_templates IS 'Plantillas reutilizables de prompts';
COMMENT ON TABLE intelligence.api_calls IS 'Historial completo de llamadas a APIs de IA';
COMMENT ON TABLE intelligence.analyses IS 'Resultados de análisis generados por IA';
COMMENT ON TABLE intelligence.usage_summary IS 'Resúmenes de uso y costos por período';
COMMENT ON COLUMN intelligence.model_configs.api_key_encrypted IS 'API key encriptada - nunca guardar en texto plano';
COMMENT ON COLUMN intelligence.api_calls.estimated_cost_usd IS 'Costo estimado basado en tokens y pricing del proveedor';
COMMENT ON COLUMN intelligence.analyses.confidence_score IS 'Score de confianza del modelo (0.0 a 1.0)';