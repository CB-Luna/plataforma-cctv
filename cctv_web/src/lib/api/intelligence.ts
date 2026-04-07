import { api } from "./client";
import type {
  ModelConfig,
  CreateModelConfigRequest,
  UpdateModelConfigRequest,
  PromptTemplate,
  Analysis,
  UsageStats,
  EmbeddingReindexResult,
} from "@/types/api";

export async function listModelConfigs(): Promise<ModelConfig[]> {
  return api.get("intelligence/models").json<ModelConfig[]>();
}

export async function getModelConfig(id: string): Promise<ModelConfig> {
  return api.get(`intelligence/models/${id}`).json<ModelConfig>();
}

export async function createModelConfig(data: CreateModelConfigRequest): Promise<ModelConfig> {
  return api.post("intelligence/models", { json: data }).json<ModelConfig>();
}

export async function updateModelConfig(id: string, data: UpdateModelConfigRequest): Promise<ModelConfig> {
  return api.put(`intelligence/models/${id}`, { json: data }).json<ModelConfig>();
}

export async function deleteModelConfig(id: string): Promise<void> {
  await api.delete(`intelligence/models/${id}`);
}

export async function setDefaultModelConfig(id: string): Promise<void> {
  await api.patch(`intelligence/models/${id}/set-default`);
}

export async function toggleModelConfigActive(id: string): Promise<void> {
  await api.patch(`intelligence/models/${id}/active`);
}

export async function listPromptTemplates(): Promise<PromptTemplate[]> {
  return api.get("intelligence/templates").json<PromptTemplate[]>();
}

export async function listAnalyses(): Promise<Analysis[]> {
  return api.get("intelligence/analyses").json<Analysis[]>();
}

export async function getUsageStats(): Promise<UsageStats> {
  return api.get("intelligence/usage").json<UsageStats>();
}

export async function reindexAllEmbeddings(): Promise<EmbeddingReindexResult[]> {
  return api.post("intelligence/embeddings/reindex/models").json<EmbeddingReindexResult[]>();
}

export async function reindexModelEmbedding(modelId: string): Promise<EmbeddingReindexResult> {
  return api.post(`intelligence/embeddings/reindex/model/${modelId}`).json<EmbeddingReindexResult>();
}
