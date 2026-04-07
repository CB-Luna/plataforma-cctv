import { api } from "./client";
import type { Client, CreateClientRequest } from "@/types/api";

export async function listClients(limit = 100, offset = 0): Promise<Client[]> {
  return api
    .get("clients", { searchParams: { limit, offset } })
    .json<Client[]>();
}

export async function getClient(id: string): Promise<Client> {
  return api.get(`clients/${id}`).json<Client>();
}

export async function createClient(data: CreateClientRequest): Promise<Client> {
  return api.post("clients", { json: data }).json<Client>();
}
