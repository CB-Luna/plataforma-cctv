-- internal/database/queries/dashboard.sql
-- Queries para el dashboard principal y estadísticas

-- ==================== ESTADÍSTICAS DE TICKETS ====================

-- name: GetDashboardTicketStats :one
-- Obtiene estadísticas generales de tickets por tenant
SELECT 
    COUNT(*) FILTER (WHERE status = 'open') as open_count,
    COUNT(*) FILTER (WHERE status = 'assigned') as assigned_count,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    COUNT(*) FILTER (WHERE priority = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
    COUNT(*) FILTER (WHERE type = 'preventive') as preventive_count,
    COUNT(*) FILTER (WHERE type = 'corrective') as corrective_count,
    COUNT(*) FILTER (WHERE type = 'emergency') as emergency_count,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE sla_met = true) as sla_met_count,
    COUNT(*) FILTER (WHERE sla_met = false) as sla_missed_count
FROM tickets.tickets
WHERE tenant_id = $1;

-- name: GetTicketsTrend :many
-- Obtiene tendencia de tickets de los últimos N días
SELECT 
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE status IN ('open', 'assigned', 'in_progress')) as opened,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) as total
FROM tickets.tickets
WHERE tenant_id = $1 
    AND created_at >= CURRENT_DATE - $2::int
GROUP BY DATE(created_at)
ORDER BY date;

-- name: GetTicketsByTechnician :many
-- Tickets asignados por técnico
SELECT 
    u.id as technician_id,
    u.first_name || ' ' || u.last_name as technician_name,
    COUNT(*) FILTER (WHERE t.status IN ('open', 'assigned', 'in_progress')) as active_tickets,
    COUNT(*) FILTER (WHERE t.status = 'completed') as completed_tickets,
    COUNT(*) as total_tickets,
    COALESCE(AVG(t.rating)::numeric, 0) as avg_rating
FROM auth.users u
LEFT JOIN tickets.tickets t ON t.assigned_to = u.id
WHERE u.tenant_id = $1
GROUP BY u.id, u.first_name, u.last_name
HAVING COUNT(t.id) > 0
ORDER BY active_tickets DESC;

-- ==================== ESTADÍSTICAS DE CLIENTES ====================

-- name: GetClientStats :one
-- Estadísticas de clientes
SELECT 
    COUNT(*) as total_clients,
    COUNT(*) FILTER (WHERE is_active = true) as active_clients,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_clients
FROM policies.clients
WHERE tenant_id = $1;

-- ==================== ESTADÍSTICAS DE PÓLIZAS ====================

-- name: GetPolicyStats :one
-- Estadísticas de pólizas
SELECT 
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE status = 'active') as active_policies,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_policies,
    COUNT(*) FILTER (WHERE status = 'suspended') as suspended_policies,
    COUNT(*) FILTER (WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) as expiring_soon,
    COALESCE(SUM(monthly_payment), 0) as total_monthly_revenue
FROM policies.policies
WHERE tenant_id = $1;

-- ==================== ESTADÍSTICAS DE FACTURACIÓN ====================

-- name: GetInvoiceStats :one
-- Estadísticas de facturación
SELECT 
    COUNT(*) as total_invoices,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
    COALESCE(SUM(total) FILTER (WHERE status = 'pending'), 0) as pending_amount,
    COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as paid_amount,
    COALESCE(SUM(balance) FILTER (WHERE status = 'overdue'), 0) as overdue_amount,
    COALESCE(SUM(total) FILTER (WHERE DATE_TRUNC('month', issue_date) = DATE_TRUNC('month', CURRENT_DATE)), 0) as current_month_total,
    COALESCE(SUM(total) FILTER (WHERE DATE_TRUNC('month', issue_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')), 0) as last_month_total
FROM billing.invoices
WHERE tenant_id = $1;

-- ==================== ESTADÍSTICAS DE USUARIOS ====================

-- name: GetUserStats :one
-- Estadísticas de usuarios
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
    COUNT(*) FILTER (WHERE last_login_at >= CURRENT_DATE) as logged_in_today,
    COUNT(*) FILTER (WHERE last_login_at >= CURRENT_DATE - 7) as logged_in_week,
    COUNT(*) FILTER (WHERE last_login_at >= CURRENT_DATE - 30) as logged_in_month
FROM auth.users
WHERE tenant_id = $1;

-- name: GetDashboardUsersByRole :many
-- Usuarios por rol (para dashboard)
SELECT 
    r.name as role_name,
    COUNT(ur.user_id) as user_count
FROM auth.roles r
LEFT JOIN auth.user_roles ur ON r.id = ur.role_id
LEFT JOIN auth.users u ON ur.user_id = u.id AND u.is_active = true
WHERE (r.tenant_id = $1 OR r.is_system = true)
GROUP BY r.id, r.name
ORDER BY user_count DESC;

-- ==================== ESTADÍSTICAS DE INVENTARIO ====================

-- name: GetInventoryStats :one
-- Estadísticas de inventario
SELECT 
    (SELECT COUNT(*) FROM inventory.nvr_servers n WHERE n.tenant_id = $1) as total_nvrs,
    (SELECT COUNT(*) FROM inventory.nvr_servers n WHERE n.tenant_id = $1 AND n.status = 'active') as active_nvrs,
    (SELECT COUNT(*) FROM inventory.cameras c WHERE c.tenant_id = $1) as total_cameras,
    (SELECT COUNT(*) FROM inventory.cameras c WHERE c.tenant_id = $1 AND c.status = 'active') as active_cameras,
    (SELECT COALESCE(SUM(n.total_storage_tb), 0) FROM inventory.nvr_servers n WHERE n.tenant_id = $1) as total_storage_tb;

-- ==================== RESUMEN EJECUTIVO (DASHBOARD PRINCIPAL) ====================

-- name: GetDashboardSummary :one
-- Resumen ejecutivo para el dashboard principal
SELECT 
    -- Tickets
    (SELECT COUNT(*) FROM tickets.tickets t WHERE t.tenant_id = $1 AND t.status IN ('open', 'assigned', 'in_progress')) as open_tickets,
    (SELECT COUNT(*) FROM tickets.tickets t WHERE t.tenant_id = $1 AND t.priority = 'critical' AND t.status NOT IN ('completed', 'cancelled')) as critical_tickets,
    (SELECT COALESCE(
        ROUND(100.0 * COUNT(*) FILTER (WHERE t.sla_met = true) / NULLIF(COUNT(*) FILTER (WHERE t.sla_met IS NOT NULL), 0), 1),
        100
    ) FROM tickets.tickets t WHERE t.tenant_id = $1 AND t.created_at >= CURRENT_DATE - 30) as sla_compliance_pct,
    (SELECT COUNT(*) FROM tickets.ticket_sla_instances tsi WHERE tsi.tenant_id = $1 AND tsi.status = 'ok') as sla_ok_tickets,
    (SELECT COUNT(*) FROM tickets.ticket_sla_instances tsi WHERE tsi.tenant_id = $1 AND tsi.status = 'at_risk') as sla_at_risk_tickets,
    (SELECT COUNT(*) FROM tickets.ticket_sla_instances tsi WHERE tsi.tenant_id = $1 AND tsi.status = 'breached') as sla_breached_tickets,
    
    -- Clientes
    (SELECT COUNT(*) FROM policies.clients c WHERE c.tenant_id = $1 AND c.is_active = true) as active_clients,
    
    -- Pólizas
    (SELECT COUNT(*) FROM policies.policies p WHERE p.tenant_id = $1 AND p.status = 'active') as active_policies,
    (SELECT COUNT(*) FROM policies.policies p WHERE p.tenant_id = $1 AND p.status = 'active' AND p.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) as policies_expiring_soon,
    
    -- Facturación
    (SELECT COALESCE(SUM(i.balance), 0) FROM billing.invoices i WHERE i.tenant_id = $1 AND i.status = 'overdue') as overdue_amount,
    (SELECT COALESCE(SUM(i.total), 0) FROM billing.invoices i WHERE i.tenant_id = $1 AND DATE_TRUNC('month', i.issue_date) = DATE_TRUNC('month', CURRENT_DATE)) as current_month_revenue,
    
    -- Usuarios
    (SELECT COUNT(*) FROM auth.users u WHERE u.tenant_id = $1 AND u.is_active = true) as active_users,
    (SELECT COUNT(*) FROM auth.users u WHERE u.tenant_id = $1 AND u.last_login_at >= CURRENT_DATE) as users_online_today,
    
    -- Inventario
    (SELECT COUNT(*) FROM inventory.nvr_servers n WHERE n.tenant_id = $1 AND n.status = 'active') as active_nvrs,
    (SELECT COUNT(*) FROM inventory.cameras c WHERE c.tenant_id = $1 AND c.status = 'active') as active_cameras,
    (SELECT COALESCE(SUM(n.total_storage_tb), 0) FROM inventory.nvr_servers n WHERE n.tenant_id = $1) as total_storage_tb,
    
    -- Storage
    (SELECT COALESCE(SUM(f.file_size), 0) FROM storage.files f WHERE f.tenant_id = $1) as total_file_size_bytes;

-- name: GetDashboardSlaMetrics :one
SELECT
    COUNT(*) FILTER (WHERE tsi.status = 'ok') AS ok_count,
    COUNT(*) FILTER (WHERE tsi.status = 'at_risk') AS at_risk_count,
    COUNT(*) FILTER (WHERE tsi.status = 'breached') AS breached_count,
    COUNT(*) FILTER (WHERE tsi.status = 'unknown') AS unknown_count,
    COUNT(*) AS total_count
FROM tickets.ticket_sla_instances tsi
WHERE tsi.tenant_id = $1;
