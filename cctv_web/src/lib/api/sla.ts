import { api } from "./client";
import type { SlaPolicy, CreateSlaPolicyRequest, UpdateSlaPolicyRequest } from "@/types/api";

export async function listSlaPolicies(): Promise<SlaPolicy[]> {
  return api.get("sla/policies").json<SlaPolicy[]>();
}

export async function createSlaPolicy(data: CreateSlaPolicyRequest): Promise<SlaPolicy> {
  return api.post("sla/policies", { json: data }).json<SlaPolicy>();
}

export async function updateSlaPolicy(id: string, data: UpdateSlaPolicyRequest): Promise<SlaPolicy> {
  return api.put(`sla/policies/${id}`, { json: data }).json<SlaPolicy>();
}

export async function deleteSlaPolicy(id: string): Promise<void> {
  await api.delete(`sla/policies/${id}`);
}
