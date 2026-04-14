import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../domain/entities/ticket.dart';
import '../../domain/entities/ticket_catalog.dart';

class TicketCard extends StatelessWidget {
  final Ticket ticket;
  final VoidCallback? onTap;

  const TicketCard({super.key, required this.ticket, this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final priorityColor = _priorityColor(ticket.priority);
    final statusColor = _statusColor(ticket.status);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: priorityColor.withValues(alpha: 0.25),
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: priorityColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      ticket.ticketNumber,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: priorityColor,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _buildPill(
                    label: ticket.priorityLabel,
                    color: priorityColor,
                    icon: _priorityIcon(ticket.priority),
                  ),
                  const Spacer(),
                  _buildPill(
                    label: ticket.statusLabel,
                    color: statusColor,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                ticket.title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (ticket.description != null && ticket.description!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  ticket.description!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 14),
              Wrap(
                runSpacing: 8,
                spacing: 12,
                children: [
                  _buildInlineInfo(
                    context,
                    icon: Icons.business_outlined,
                    text: ticket.clientName ?? 'Cliente no definido',
                  ),
                  _buildInlineInfo(
                    context,
                    icon: Icons.location_on_outlined,
                    text: ticket.siteName ?? 'Sitio no definido',
                  ),
                  _buildInlineInfo(
                    context,
                    icon: Icons.schedule_outlined,
                    text: timeago.format(ticket.updatedAt, locale: 'es'),
                  ),
                  _buildInlineInfo(
                    context,
                    icon: _typeIcon(ticket.type),
                    text: ticket.typeLabel,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest.withValues(
                    alpha: 0.45,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Icon(
                      ticket.isClosed ? Icons.check_circle_outline : Icons.play_circle_outline,
                      color: ticket.isClosed ? Colors.green : theme.colorScheme.primary,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        ticket.nextActionLabel,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (ticket.slaStatus != null)
                      _buildPill(
                        label: _slaLabel(ticket.slaStatus!),
                        color: _slaColor(ticket.slaStatus!),
                      ),
                  ],
                ),
              ),
              if (ticket.assignedToName != null && ticket.assignedToName!.isNotEmpty) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(
                      Icons.badge_outlined,
                      size: 16,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Asignado a ${ticket.assignedToName}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInlineInfo(
    BuildContext context, {
    required IconData icon,
    required String text,
  }) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 140,
      child: Row(
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPill({
    required String label,
    required Color color,
    IconData? icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Color _priorityColor(String value) {
    switch (TicketCatalog.canonicalPriority(value)) {
      case 'critical':
        return Colors.red;
      case 'high':
        return Colors.deepOrange;
      case 'medium':
        return Colors.blue;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Color _statusColor(String value) {
    switch (TicketCatalog.canonicalStatus(value)) {
      case 'open':
        return Colors.blue;
      case 'assigned':
        return Colors.indigo;
      case 'in_progress':
        return Colors.orange;
      case 'pending_parts':
      case 'pending_approval':
      case 'pending_client':
      case 'on_hold':
        return Colors.amber.shade800;
      case 'completed':
      case 'closed':
        return Colors.green;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  Color _slaColor(String value) {
    switch (value) {
      case 'ok':
        return Colors.green;
      case 'at_risk':
        return Colors.orange;
      case 'breached':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _slaLabel(String value) {
    switch (value) {
      case 'ok':
        return 'SLA OK';
      case 'at_risk':
        return 'SLA Riesgo';
      case 'breached':
        return 'SLA Vencido';
      default:
        return 'SLA';
    }
  }

  IconData _priorityIcon(String value) {
    switch (TicketCatalog.canonicalPriority(value)) {
      case 'critical':
        return Icons.priority_high_rounded;
      case 'high':
        return Icons.arrow_upward_rounded;
      case 'medium':
        return Icons.remove_rounded;
      case 'low':
        return Icons.arrow_downward_rounded;
      default:
        return Icons.circle_outlined;
    }
  }

  IconData _typeIcon(String value) {
    switch (value) {
      case 'corrective':
        return Icons.build_outlined;
      case 'preventive':
        return Icons.event_repeat_outlined;
      case 'emergency':
        return Icons.crisis_alert_outlined;
      case 'installation':
        return Icons.construction_outlined;
      case 'inspection':
        return Icons.fact_check_outlined;
      default:
        return Icons.work_outline;
    }
  }
}
