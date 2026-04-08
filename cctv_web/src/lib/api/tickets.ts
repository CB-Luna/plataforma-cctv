import { api } from "./client";
import type {
  Ticket,
  TicketDetail,
  CreateTicketRequest,
  UpdateTicketRequest,
  TimelineEntry,
  TicketComment,
  TicketStats,
  TechnicianWorkload,
} from "@/types/api";

export async function listTickets(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  type?: string;
  priority?: string;
  sla_status?: string;
  coverage_status?: string;
}): Promise<Ticket[]> {
  const searchParams: Record<string, string> = {};
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);
  if (params?.status) searchParams.status = params.status;
  if (params?.type) searchParams.type = params.type;
  if (params?.priority) searchParams.priority = params.priority;
  if (params?.sla_status) searchParams.sla_status = params.sla_status;
  if (params?.coverage_status) searchParams.coverage_status = params.coverage_status;
  return api.get("tickets", { searchParams }).json<Ticket[]>();
}

export async function getTicket(id: string): Promise<TicketDetail> {
  return api.get(`tickets/${id}`).json<TicketDetail>();
}

export async function createTicket(data: CreateTicketRequest): Promise<Ticket> {
  return api.post("tickets", { json: data }).json<Ticket>();
}

export async function updateTicket(id: string, data: UpdateTicketRequest): Promise<Ticket> {
  return api.put(`tickets/${id}`, { json: data }).json<Ticket>();
}

export async function deleteTicket(id: string): Promise<void> {
  await api.delete(`tickets/${id}`);
}

export async function changeTicketStatus(
  id: string,
  data: { status: string; reason?: string }
): Promise<void> {
  await api.patch(`tickets/${id}/status`, { json: data });
}

export async function assignTicket(
  id: string,
  technician_id: string
): Promise<void> {
  await api.patch(`tickets/${id}/assign`, { json: { technician_id } });
}

export async function getTicketTimeline(id: string): Promise<TimelineEntry[]> {
  return api.get(`tickets/${id}/timeline`).json<TimelineEntry[]>();
}

export async function listTicketComments(id: string): Promise<TicketComment[]> {
  return api.get(`tickets/${id}/comments`).json<TicketComment[]>();
}

export async function addTicketComment(
  id: string,
  data: { comment: string; is_internal?: boolean }
): Promise<TicketComment> {
  return api.post(`tickets/${id}/comments`, { json: data }).json<TicketComment>();
}

export async function getTicketStats(): Promise<TicketStats> {
  return api.get("tickets/stats").json<TicketStats>();
}

export async function getTechniciansWorkload(): Promise<TechnicianWorkload[]> {
  return api.get("tickets/technicians/workload").json<TechnicianWorkload[]>();
}
