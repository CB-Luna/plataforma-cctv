import { api } from "./client";
import type {
  Policy,
  PolicyDetail,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  PolicyAsset,
} from "@/types/api";

export async function listPolicies(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  provider?: string;
  client_id?: string;
}): Promise<Policy[]> {
  const searchParams: Record<string, string> = {};
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);
  if (params?.status) searchParams.status = params.status;
  if (params?.provider) searchParams.provider = params.provider;
  if (params?.client_id) searchParams.client_id = params.client_id;
  return api.get("policies", { searchParams }).json<Policy[]>();
}

export async function getPolicy(id: string): Promise<PolicyDetail> {
  return api.get(`policies/${id}`).json<PolicyDetail>();
}

export async function createPolicy(data: CreatePolicyRequest): Promise<Policy> {
  return api.post("policies", { json: data }).json<Policy>();
}

export async function updatePolicy(id: string, data: UpdatePolicyRequest): Promise<Policy> {
  return api.put(`policies/${id}`, { json: data }).json<Policy>();
}

export async function deletePolicy(id: string): Promise<void> {
  await api.delete(`policies/${id}`);
}

export async function addPolicyAsset(
  policyId: string,
  data: { equipment_id?: string; nvr_server_id?: string; camera_id?: string; notes?: string }
): Promise<PolicyAsset> {
  return api.post(`policies/${policyId}/assets`, { json: data }).json<PolicyAsset>();
}

export async function removePolicyAsset(policyId: string, assetId: string): Promise<void> {
  await api.delete(`policies/${policyId}/assets/${assetId}`);
}
