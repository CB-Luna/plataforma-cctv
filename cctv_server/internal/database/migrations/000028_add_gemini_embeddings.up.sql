-- 000028_add_gemini_embeddings.up.sql
-- Base para búsqueda semántica de catálogo técnico usando pgvector + Gemini Embedding

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE intelligence.embedding_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'catalog_model',
    title VARCHAR(255),
    content_text TEXT NOT NULL,
    content_summary TEXT,
    chunk_index INT NOT NULL DEFAULT 0,
    content_hash VARCHAR(64) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_embedding_documents_entity_chunk UNIQUE (tenant_id, entity_type, entity_id, chunk_index)
);

CREATE TABLE intelligence.embedding_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES intelligence.embedding_documents(id) ON DELETE CASCADE,
    model_config_id UUID REFERENCES intelligence.model_configs(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    modality VARCHAR(20) NOT NULL DEFAULT 'text',
    dimensions INT NOT NULL DEFAULT 3072,
    embedding halfvec(3072) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_embedding_vectors_doc_model_task UNIQUE (document_id, model_config_id, task_type, modality)
);

CREATE INDEX idx_embedding_documents_tenant_entity
    ON intelligence.embedding_documents (tenant_id, entity_type, entity_id);

CREATE INDEX idx_embedding_vectors_tenant_model
    ON intelligence.embedding_vectors (tenant_id, model_config_id, task_type);

CREATE INDEX idx_embedding_vectors_document
    ON intelligence.embedding_vectors (document_id);

CREATE INDEX idx_embedding_vectors_hnsw
    ON intelligence.embedding_vectors
    USING hnsw (embedding halfvec_cosine_ops);

COMMENT ON TABLE intelligence.embedding_documents IS 'Documentos indexables para búsqueda semántica por tenant';
COMMENT ON TABLE intelligence.embedding_vectors IS 'Embeddings generados por proveedor/modelo para búsqueda vectorial';
COMMENT ON COLUMN intelligence.embedding_documents.content_hash IS 'Hash SHA-256 del contenido indexado';
COMMENT ON COLUMN intelligence.embedding_vectors.embedding IS 'Vector semántico almacenado como halfvec para soportar Gemini 3072D con índice HNSW';
