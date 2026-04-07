-- internal/database/queries/sla.sql
-- Queries para políticas SLA y snapshots por ticket

-- name: ListSlaPoliciesByTenant :many
SELECT *
FROM tickets.sla_policies
WHERE tenant_id = $1
    AND is_active = true
ORDER BY is_default DESC,
    name ASC;

-- name: GetSlaPolicyByID :one
SELECT *
FROM tickets.sla_policies
WHERE id = $1
    AND tenant_id = $2
LIMIT 1;

-- name: CreateSlaPolicy :one
INSERT INTO tickets.sla_policies (
    tenant_id,
    name,
    ticket_priority,
    ticket_type,
    response_time_hours,
    resolution_time_hours,
    is_default,
    is_active,
    business_hours,
    created_by
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: UpdateSlaPolicy :one
UPDATE tickets.sla_policies
SET name = COALESCE($3, name),
    ticket_priority = COALESCE($4, ticket_priority),
    ticket_type = COALESCE($5, ticket_type),
    response_time_hours = COALESCE($6, response_time_hours),
    resolution_time_hours = COALESCE($7, resolution_time_hours),
    is_default = COALESCE($8, is_default),
    is_active = COALESCE($9, is_active),
    business_hours = COALESCE($10, business_hours),
    updated_by = $11,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2
RETURNING *;

-- name: DeactivateSlaPolicy :exec
UPDATE tickets.sla_policies
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;

-- name: SelectSlaPolicyForTicket :one
SELECT *
FROM tickets.sla_policies
WHERE tenant_id = $1
    AND is_active = true
    AND (ticket_priority::text = $2 OR ticket_priority IS NULL)
    AND (ticket_type::text = $3 OR ticket_type IS NULL)
ORDER BY
    CASE WHEN ticket_priority::text = $2 THEN 0 ELSE 1 END,
    CASE WHEN ticket_type::text = $3 THEN 0 ELSE 1 END,
    CASE WHEN is_default THEN 0 ELSE 1 END,
    created_at ASC
LIMIT 1;

-- name: UpsertTicketPolicyLink :one
INSERT INTO tickets.ticket_policy_links (
    tenant_id,
    ticket_id,
    policy_id,
    coverage_status,
    notes
)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (ticket_id)
DO UPDATE SET
    policy_id = EXCLUDED.policy_id,
    coverage_status = EXCLUDED.coverage_status,
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- name: GetTicketPolicyLinkByTicketID :one
SELECT tpl.*,
    p.policy_number,
    p.vendor,
    p.contract_type
FROM tickets.ticket_policy_links tpl
LEFT JOIN policies.policies p ON p.id = tpl.policy_id
WHERE tpl.ticket_id = $1
    AND tpl.tenant_id = $2
LIMIT 1;

-- name: CreateTicketSlaInstance :one
INSERT INTO tickets.ticket_sla_instances (
    tenant_id,
    ticket_id,
    sla_policy_id,
    priority_snapshot,
    type_snapshot,
    response_time_hours,
    resolution_time_hours,
    due_response_at,
    due_resolution_at,
    status
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetTicketSlaInstanceByTicketID :one
SELECT tsi.*,
    sp.name AS sla_policy_name
FROM tickets.ticket_sla_instances tsi
LEFT JOIN tickets.sla_policies sp ON sp.id = tsi.sla_policy_id
WHERE tsi.ticket_id = $1
    AND tsi.tenant_id = $2
LIMIT 1;

-- name: MarkTicketSlaResponded :exec
UPDATE tickets.ticket_sla_instances
SET responded_at = COALESCE(responded_at, CURRENT_TIMESTAMP),
    breached_response = CASE
        WHEN due_response_at IS NOT NULL
             AND COALESCE(responded_at, CURRENT_TIMESTAMP) > due_response_at THEN true
        ELSE breached_response
    END,
    status = CASE
        WHEN due_response_at IS NOT NULL
             AND COALESCE(responded_at, CURRENT_TIMESTAMP) > due_response_at THEN 'breached'::tickets.sla_status
        WHEN status = 'unknown' THEN 'ok'::tickets.sla_status
        ELSE status
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE ticket_id = $1
    AND tenant_id = $2;

-- name: MarkTicketSlaResolved :exec
UPDATE tickets.ticket_sla_instances
SET resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP),
    breached_resolution = CASE
        WHEN due_resolution_at IS NOT NULL
             AND COALESCE(resolved_at, CURRENT_TIMESTAMP) > due_resolution_at THEN true
        ELSE breached_resolution
    END,
    status = CASE
        WHEN due_resolution_at IS NOT NULL
             AND COALESCE(resolved_at, CURRENT_TIMESTAMP) > due_resolution_at THEN 'breached'::tickets.sla_status
        ELSE 'ok'::tickets.sla_status
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE ticket_id = $1
    AND tenant_id = $2;

-- name: RefreshTicketSlaStatus :exec
UPDATE tickets.ticket_sla_instances
SET breached_response = CASE
        WHEN responded_at IS NULL
             AND due_response_at IS NOT NULL
             AND CURRENT_TIMESTAMP > due_response_at THEN true
        ELSE breached_response
    END,
    breached_resolution = CASE
        WHEN resolved_at IS NULL
             AND due_resolution_at IS NOT NULL
             AND CURRENT_TIMESTAMP > due_resolution_at THEN true
        ELSE breached_resolution
    END,
    status = CASE
        WHEN (resolved_at IS NULL AND due_resolution_at IS NOT NULL AND CURRENT_TIMESTAMP > due_resolution_at)
          OR (responded_at IS NULL AND due_response_at IS NOT NULL AND CURRENT_TIMESTAMP > due_response_at)
            THEN 'breached'::tickets.sla_status
        WHEN (resolved_at IS NULL AND due_resolution_at IS NOT NULL AND CURRENT_TIMESTAMP + INTERVAL '2 hour' > due_resolution_at)
          OR (responded_at IS NULL AND due_response_at IS NOT NULL AND CURRENT_TIMESTAMP + INTERVAL '1 hour' > due_response_at)
            THEN 'at_risk'::tickets.sla_status
        ELSE 'ok'::tickets.sla_status
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE ticket_id = $1
    AND tenant_id = $2;
