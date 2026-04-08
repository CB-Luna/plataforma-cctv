import { describe, expect, it } from "vitest";
import {
  describeResolvedPolicySource,
  describeResolvedSlaSource,
  isPolicyCurrentlyActive,
  parsePolicyCoverage,
  resolveSlaCandidate,
  resolveTicketPolicyCandidate,
  serializePolicyCoverage,
  summarizeBusinessHours,
  summarizePolicyCoverage,
} from "@/lib/contracts/contractual";
import type { Policy, SlaPolicy } from "@/types/api";

const basePolicy: Policy = {
  id: "policy-1",
  tenant_id: "tenant-1",
  policy_number: "POL-001",
  client_id: "client-1",
  status: "active",
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  monthly_payment: 1000,
  created_at: "2026-01-05T10:00:00Z",
  updated_at: "2026-01-05T10:00:00Z",
};

const baseSla: SlaPolicy = {
  id: "sla-1",
  tenant_id: "tenant-1",
  name: "SLA Base",
  response_time_hours: 4,
  resolution_time_hours: 24,
  is_default: false,
  is_active: true,
  created_at: "2026-01-01T08:00:00Z",
  updated_at: "2026-01-01T08:00:00Z",
};

describe("contractual helpers", () => {
  it("detects active policies inside date range", () => {
    expect(
      isPolicyCurrentlyActive(basePolicy, new Date("2026-04-07T12:00:00Z")),
    ).toBe(true);
    expect(
      isPolicyCurrentlyActive(
        { ...basePolicy, end_date: "2026-03-31" },
        new Date("2026-04-07T12:00:00Z"),
      ),
    ).toBe(false);
  });

  it("parses and serializes policy coverage consistently", () => {
    const parsed = parsePolicyCoverage(
      {
        covered_services: ["cctv", "networking", "unknown"],
        asset_scope: "listed_assets_only",
        service_window: "24x7",
        coverage_notes: "Cobertura premium",
      },
      null,
    );

    expect(parsed.covered_services).toEqual(["cctv", "networking"]);
    expect(parsed.asset_scope).toBe("listed_assets_only");
    expect(parsed.service_window).toBe("24x7");
    expect(parsed.coverage_notes).toBe("Cobertura premium");

    expect(serializePolicyCoverage(parsed)).toEqual({
      covered_services: ["cctv", "networking"],
      asset_scope: "listed_assets_only",
      service_window: "24x7",
      coverage_notes: "Cobertura premium",
    });
  });

  it("falls back to site coverage when coverage json is empty", () => {
    expect(parsePolicyCoverage(undefined, "site-1").asset_scope).toBe("site_only");
    expect(parsePolicyCoverage(undefined, null).asset_scope).toBe("client_scope");
    expect(
      summarizePolicyCoverage({ coverage_json: undefined, site_id: "site-1" }),
    ).toContain("Todos los activos del sitio");
  });

  it("selects the right automatic policy candidate", () => {
    const latestClientPolicy = {
      ...basePolicy,
      id: "policy-client",
      site_id: undefined,
      created_at: "2026-03-01T10:00:00Z",
    };

    const exactSitePolicy = {
      ...basePolicy,
      id: "policy-site",
      site_id: "site-1",
      created_at: "2026-02-01T10:00:00Z",
    };

    const resolution = resolveTicketPolicyCandidate({
      policies: [latestClientPolicy, exactSitePolicy],
      clientId: "client-1",
      siteId: "site-1",
      referenceDate: new Date("2026-04-07T12:00:00Z"),
    });

    expect(resolution?.policy.id).toBe("policy-site");
    expect(resolution?.source).toBe("site_match");
    expect(describeResolvedPolicySource(resolution?.source ?? "latest_client")).toBe(
      "Coincidencia exacta por sitio",
    );
  });

  it("uses explicit policy before automatic matching", () => {
    const resolution = resolveTicketPolicyCandidate({
      policies: [{ ...basePolicy, id: "manual-policy" }],
      clientId: "client-1",
      siteId: "site-1",
      selectedPolicyId: "manual-policy",
    });

    expect(resolution?.source).toBe("explicit");
  });

  it("selects SLA using the backend ordering rules", () => {
    const defaultPolicy = {
      ...baseSla,
      id: "sla-default",
      name: "Default",
      is_default: true,
    };
    const priorityPolicy = {
      ...baseSla,
      id: "sla-priority",
      name: "Alta",
      ticket_priority: "high",
      created_at: "2026-01-02T08:00:00Z",
      updated_at: "2026-01-02T08:00:00Z",
    };
    const exactPolicy = {
      ...baseSla,
      id: "sla-exact",
      name: "Alta Correctiva",
      ticket_priority: "high",
      ticket_type: "corrective",
      created_at: "2026-01-03T08:00:00Z",
      updated_at: "2026-01-03T08:00:00Z",
    };

    const resolution = resolveSlaCandidate({
      policies: [defaultPolicy, priorityPolicy, exactPolicy],
      priority: "high",
      type: "corrective",
    });

    expect(resolution?.policy.id).toBe("sla-exact");
    expect(resolution?.source).toBe("exact");
    expect(describeResolvedSlaSource(resolution?.source ?? "default")).toBe(
      "Coincidencia exacta",
    );
  });

  it("summarizes documented business hours without promising runtime behavior", () => {
    expect(summarizeBusinessHours()).toBe("Horas corridas");
    expect(
      summarizeBusinessHours({ mode: "business_hours", timezone: "America/Tijuana" }),
    ).toBe("Horario laboral");
    expect(summarizeBusinessHours({ start: "09:00", end: "18:00" })).toBe("09:00-18:00");
  });
});
