-- 000028_add_gemini_embeddings.down.sql

DROP INDEX IF EXISTS intelligence.idx_embedding_vectors_hnsw;
DROP INDEX IF EXISTS intelligence.idx_embedding_vectors_document;
DROP INDEX IF EXISTS intelligence.idx_embedding_vectors_tenant_model;
DROP INDEX IF EXISTS intelligence.idx_embedding_documents_tenant_entity;

DROP TABLE IF EXISTS intelligence.embedding_vectors;
DROP TABLE IF EXISTS intelligence.embedding_documents;
