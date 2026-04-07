-- internal/database/queries/tickets.sql
-- Queries para tickets y worklogs
-- name: CreateTicket :one
INSERT INTO tickets.tickets (
        tenant_id,
        ticket_number,
        client_id,
        site_id,
        policy_id,
        equipment_id,
        type,
        priority,
        title,
        description,
        reported_by
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;
-- name: GetTicketByID :one
SELECT t.*,
    c.company_name as client_name,
    s.name as site_name,
    u.first_name || ' ' || u.last_name as reported_by_name
FROM tickets.tickets t
    LEFT JOIN policies.clients c ON t.client_id = c.id
    LEFT JOIN policies.sites s ON t.site_id = s.id
    LEFT JOIN auth.users u ON t.reported_by = u.id
WHERE t.id = $1
    AND t.tenant_id = $2
LIMIT 1;
-- name: ListTicketsByTenant :many
SELECT t.*,
    c.company_name as client_name,
    u.first_name || ' ' || u.last_name as assigned_to_name
FROM tickets.tickets t
    LEFT JOIN policies.clients c ON t.client_id = c.id
    LEFT JOIN auth.users u ON t.assigned_to = u.id
WHERE t.tenant_id = $1
ORDER BY t.created_at DESC
LIMIT $2 OFFSET $3;
-- name: ListTicketsByStatus :many
SELECT t.*,
    c.company_name as client_name
FROM tickets.tickets t
    LEFT JOIN policies.clients c ON t.client_id = c.id
WHERE t.tenant_id = $1
    AND t.status = $2
ORDER BY t.priority DESC,
    t.created_at DESC
LIMIT $3 OFFSET $4;
-- name: ListTicketsByTechnician :many
SELECT t.*,
    c.company_name as client_name
FROM tickets.tickets t
    LEFT JOIN policies.clients c ON t.client_id = c.id
WHERE t.tenant_id = $1
    AND t.assigned_to = $2
ORDER BY t.priority DESC,
    t.created_at DESC;
-- name: UpdateTicketStatus :exec
UPDATE tickets.tickets
SET status = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: AssignTicket :exec
UPDATE tickets.tickets
SET assigned_to = $3,
    status = 'assigned',
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: CompleteTicket :exec
UPDATE tickets.tickets
SET status = 'completed',
    completed_at = CURRENT_TIMESTAMP,
    resolution = $3,
    sla_met = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: GenerateTicketNumber :one
SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(
                    ticket_number
                    FROM '[0-9]+'
                ) AS INTEGER
            )
        ),
        0
    ) + 1 as next_number
FROM tickets.tickets
WHERE tenant_id = $1;
-- Worklogs
-- name: CreateWorklog :one
INSERT INTO tickets.worklogs (
        tenant_id,
        ticket_id,
        technician_id,
        start_time,
        end_time,
        duration_minutes,
        work_description,
        travel_time_minutes,
        is_billable
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;
-- name: ListWorklogsByTicket :many
SELECT w.*,
    u.first_name || ' ' || u.last_name as technician_name
FROM tickets.worklogs w
    LEFT JOIN auth.users u ON w.technician_id = u.id
WHERE w.ticket_id = $1
    AND w.tenant_id = $2
ORDER BY w.start_time DESC;
-- Evidences
-- name: CreateTicketEvidence :one
INSERT INTO tickets.ticket_evidences (
        tenant_id,
        ticket_id,
        file_url,
        file_name,
        file_type,
        file_size,
        description,
        uploaded_by
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;
-- name: ListTicketEvidences :many
SELECT *
FROM tickets.ticket_evidences
WHERE ticket_id = $1
    AND tenant_id = $2
ORDER BY created_at DESC;
-- Comments
-- name: CreateTicketComment :one
INSERT INTO tickets.ticket_comments (
        tenant_id,
        ticket_id,
        user_id,
        comment,
        is_internal
    )
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
-- name: ListTicketComments :many
SELECT c.*,
    u.first_name || ' ' || u.last_name as user_name
FROM tickets.ticket_comments c
    LEFT JOIN auth.users u ON c.user_id = u.id
WHERE c.ticket_id = $1
    AND c.tenant_id = $2
ORDER BY c.created_at ASC;
-- ============================================
-- EXTENDED QUERIES FOR TICKET MODULE
-- ============================================
-- name: UpdateTicket :exec
UPDATE tickets.tickets
SET title = COALESCE($3, title),
    description = COALESCE($4, description),
    priority = COALESCE($5, priority),
    type = COALESCE($6, type),
    site_id = COALESCE($7, site_id),
    equipment_id = COALESCE($8, equipment_id),
    scheduled_date = COALESCE($9, scheduled_date),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: ListTicketsByType :many
SELECT t.*,
    c.company_name as client_name,
    u.first_name || ' ' || u.last_name as assigned_to_name
FROM tickets.tickets t
    LEFT JOIN policies.clients c ON t.client_id = c.id
    LEFT JOIN auth.users u ON t.assigned_to = u.id
WHERE t.tenant_id = $1
    AND t.type = $2
ORDER BY t.priority DESC,
    t.created_at DESC
LIMIT $3 OFFSET $4;
-- name: ListTicketsByPriority :many
SELECT t.*,
    c.company_name as client_name,
    u.first_name || ' ' || u.last_name as assigned_to_name
FROM tickets.tickets t
    LEFT JOIN policies.clients c ON t.client_id = c.id
    LEFT JOIN auth.users u ON t.assigned_to = u.id
WHERE t.tenant_id = $1
    AND t.priority = $2
ORDER BY t.created_at DESC
LIMIT $3 OFFSET $4;
-- name: GetTicketWithFullDetails :one
SELECT t.*,
    c.company_name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    s.name as site_name,
    s.address as site_address,
    s.city as site_city,
    e.serial_number as equipment_serial,
    rep.first_name || ' ' || rep.last_name as reported_by_name,
    rep.email as reported_by_email,
    tech.first_name || ' ' || tech.last_name as assigned_to_name,
    tech.email as assigned_to_email,
    tech.phone as assigned_to_phone
FROM tickets.tickets t
    LEFT JOIN policies.clients c ON t.client_id = c.id
    LEFT JOIN policies.sites s ON t.site_id = s.id
    LEFT JOIN inventory.equipment e ON t.equipment_id = e.id
    LEFT JOIN auth.users rep ON t.reported_by = rep.id
    LEFT JOIN auth.users tech ON t.assigned_to = tech.id
WHERE t.id = $1
    AND t.tenant_id = $2
LIMIT 1;
-- name: CountTickets :one
SELECT COUNT(*) as total
FROM tickets.tickets
WHERE tenant_id = $1;
-- name: CountTicketsByStatus :one
SELECT COUNT(*) as total
FROM tickets.tickets
WHERE tenant_id = $1
    AND status = $2;
-- name: GetTicketStats :one
SELECT COUNT(*) as total,
    COUNT(*) FILTER (
        WHERE status = 'open'
    ) as open_count,
    COUNT(*) FILTER (
        WHERE status = 'assigned'
    ) as assigned_count,
    COUNT(*) FILTER (
        WHERE status = 'in_progress'
    ) as in_progress_count,
    COUNT(*) FILTER (
        WHERE status = 'pending_parts'
    ) as pending_parts_count,
    COUNT(*) FILTER (
        WHERE status = 'pending_approval'
    ) as pending_approval_count,
    COUNT(*) FILTER (
        WHERE status = 'on_hold'
    ) as on_hold_count,
    COUNT(*) FILTER (
        WHERE status = 'completed'
    ) as completed_count,
    COUNT(*) FILTER (
        WHERE status = 'cancelled'
    ) as cancelled_count,
    COUNT(*) FILTER (
        WHERE priority = 'critical'
    ) as critical_count,
    COUNT(*) FILTER (
        WHERE priority = 'high'
    ) as high_count,
    COUNT(*) FILTER (
        WHERE type = 'preventive'
    ) as preventive_count,
    COUNT(*) FILTER (
        WHERE type = 'corrective'
    ) as corrective_count
FROM tickets.tickets
WHERE tenant_id = $1;
-- Timeline
-- name: CreateTicketTimeline :one
INSERT INTO tickets.ticket_timeline (
        tenant_id,
        ticket_id,
        event_type,
        description,
        user_id,
        old_value,
        new_value,
        metadata
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;
-- name: ListTicketTimeline :many
SELECT tl.*,
    u.first_name || ' ' || u.last_name as user_name
FROM tickets.ticket_timeline tl
    LEFT JOIN auth.users u ON tl.user_id = u.id
WHERE tl.ticket_id = $1
    AND tl.tenant_id = $2
ORDER BY tl.created_at ASC;
-- Status transitions
-- name: CloseTicket :exec
UPDATE tickets.tickets
SET status = 'closed',
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2
    AND status = 'completed';
-- name: CancelTicket :exec
UPDATE tickets.tickets
SET status = 'cancelled',
    resolution = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- name: StartTicket :exec
UPDATE tickets.tickets
SET status = 'in_progress',
    started_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;
-- Technician workload
-- name: GetTechniciansWorkload :many
SELECT u.id as technician_id,
    u.first_name || ' ' || u.last_name as technician_name,
    u.email as technician_email,
    COUNT(t.id) as active_tickets,
    COUNT(t.id) FILTER (
        WHERE t.priority = 'urgent'
    ) as urgent_tickets,
    COUNT(t.id) FILTER (
        WHERE t.priority = 'high'
    ) as high_tickets
FROM auth.users u
    INNER JOIN auth.user_roles ur ON u.id = ur.user_id
    INNER JOIN auth.roles r ON ur.role_id = r.id
    LEFT JOIN tickets.tickets t ON u.id = t.assigned_to
    AND t.status IN ('assigned', 'in_progress')
    AND t.tenant_id = $1
WHERE u.tenant_id = $1
    AND u.is_active = true
    AND r.name IN ('technician', 'Technician', 'Técnico', 'tecnico')
GROUP BY u.id,
    u.first_name,
    u.last_name,
    u.email
ORDER BY active_tickets ASC;
-- Delete
-- name: DeleteTicket :exec
DELETE FROM tickets.tickets
WHERE id = $1
    AND tenant_id = $2;

-- name: UpdateTicketSlaFields :exec
UPDATE tickets.tickets
SET sla_hours = $3,
    sla_deadline = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
    AND tenant_id = $2;

-- name: ListTicketsBySlaStatus :many
SELECT t.*,
    c.company_name as client_name,
    u.first_name || ' ' || u.last_name as assigned_to_name,
    COALESCE(tsi.status::text, 'unknown') as sla_status,
    COALESCE(tpl.coverage_status::text, 'unknown') as coverage_status
FROM tickets.tickets t
LEFT JOIN policies.clients c ON t.client_id = c.id
LEFT JOIN auth.users u ON t.assigned_to = u.id
LEFT JOIN tickets.ticket_sla_instances tsi ON tsi.ticket_id = t.id
LEFT JOIN tickets.ticket_policy_links tpl ON tpl.ticket_id = t.id
WHERE t.tenant_id = $1
    AND COALESCE(tsi.status::text, 'unknown') = $2
ORDER BY t.created_at DESC
LIMIT $3 OFFSET $4;

-- name: ListTicketsByCoverageStatus :many
SELECT t.*,
    c.company_name as client_name,
    u.first_name || ' ' || u.last_name as assigned_to_name,
    COALESCE(tsi.status::text, 'unknown') as sla_status,
    COALESCE(tpl.coverage_status::text, 'unknown') as coverage_status
FROM tickets.tickets t
LEFT JOIN policies.clients c ON t.client_id = c.id
LEFT JOIN auth.users u ON t.assigned_to = u.id
LEFT JOIN tickets.ticket_sla_instances tsi ON tsi.ticket_id = t.id
LEFT JOIN tickets.ticket_policy_links tpl ON tpl.ticket_id = t.id
WHERE t.tenant_id = $1
    AND COALESCE(tpl.coverage_status::text, 'unknown') = $2
ORDER BY t.created_at DESC
LIMIT $3 OFFSET $4;

-- name: GetTicketWithSlaAndPolicy :one
SELECT t.*,
    c.company_name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    s.name as site_name,
    s.address as site_address,
    s.city as site_city,
    e.serial_number as equipment_serial,
    rep.first_name || ' ' || rep.last_name as reported_by_name,
    rep.email as reported_by_email,
    tech.first_name || ' ' || tech.last_name as assigned_to_name,
    tech.email as assigned_to_email,
    tech.phone as assigned_to_phone,
    p.policy_number,
    p.vendor as policy_vendor,
    p.contract_type as policy_contract_type,
    COALESCE(tpl.coverage_status::text, 'unknown') as coverage_status,
    tsi.id as sla_instance_id,
    sp.name as sla_policy_name,
    COALESCE(tsi.status::text, 'unknown') as sla_status,
    tsi.due_response_at,
    tsi.due_resolution_at,
    tsi.responded_at,
    tsi.resolved_at,
    tsi.breached_response,
    tsi.breached_resolution
FROM tickets.tickets t
LEFT JOIN policies.clients c ON t.client_id = c.id
LEFT JOIN policies.sites s ON t.site_id = s.id
LEFT JOIN inventory.equipment e ON t.equipment_id = e.id
LEFT JOIN auth.users rep ON t.reported_by = rep.id
LEFT JOIN auth.users tech ON t.assigned_to = tech.id
LEFT JOIN tickets.ticket_policy_links tpl ON tpl.ticket_id = t.id
LEFT JOIN policies.policies p ON p.id = tpl.policy_id
LEFT JOIN tickets.ticket_sla_instances tsi ON tsi.ticket_id = t.id
LEFT JOIN tickets.sla_policies sp ON sp.id = tsi.sla_policy_id
WHERE t.id = $1
    AND t.tenant_id = $2
LIMIT 1;
