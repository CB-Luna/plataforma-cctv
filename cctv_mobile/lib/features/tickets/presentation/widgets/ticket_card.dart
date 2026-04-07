import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../domain/entities/ticket.dart';

class TicketCard extends StatelessWidget {
  final Ticket ticket;
  final VoidCallback? onTap;

  const TicketCard({super.key, required this.ticket, this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: _getPriorityColor(ticket.priority).withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _getPriorityColor(
                        ticket.priority,
                      ).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      ticket.ticketNumber,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: _getPriorityColor(ticket.priority),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _buildPriorityBadge(ticket.priority),
                  const Spacer(),
                  if (ticket.slaStatus != null) ...[
                    _buildMiniBadge(
                      _getSlaLabel(ticket.slaStatus!),
                      _getSlaColor(ticket.slaStatus!),
                    ),
                    const SizedBox(width: 6),
                  ],
                  if (ticket.coverageStatus != null) ...[
                    _buildMiniBadge(
                      _getCoverageLabel(ticket.coverageStatus!),
                      _getCoverageColor(ticket.coverageStatus!),
                    ),
                    const SizedBox(width: 6),
                  ],
                  _buildStatusBadge(ticket.status, theme),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                ticket.title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (ticket.description != null) ...[
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
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.business,
                    size: 16,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      ticket.clientName ?? 'Sin cliente',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    timeago.format(ticket.createdAt, locale: 'es'),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              if (ticket.siteName != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.location_on,
                      size: 16,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        ticket.siteName!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildTypeBadge(ticket.type, theme),
                  const Spacer(),
                  if (ticket.assignedToName != null)
                    Row(
                      children: [
                        Icon(
                          Icons.person,
                          size: 16,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          ticket.assignedToName!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriorityBadge(String priority) {
    final color = _getPriorityColor(priority);
    IconData icon;

    switch (priority) {
      case 'urgent':
        icon = Icons.warning_amber_rounded;
        break;
      case 'high':
        icon = Icons.arrow_upward;
        break;
      case 'medium':
        icon = Icons.remove;
        break;
      case 'low':
        icon = Icons.arrow_downward;
        break;
      default:
        icon = Icons.remove;
    }

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Icon(icon, size: 16, color: color),
    );
  }

  Widget _buildStatusBadge(String status, ThemeData theme) {
    final color = _getStatusColor(status);
    final label = _getStatusLabel(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildTypeBadge(String type, ThemeData theme) {
    final label = _getTypeLabel(type);
    final icon = _getTypeIcon(type);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(width: 4),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Widget _buildMiniBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'urgent':
        return Colors.red;
      case 'high':
        return Colors.orange;
      case 'medium':
        return Colors.blue;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'open':
        return Colors.blue;
      case 'assigned':
        return Colors.purple;
      case 'in_progress':
        return Colors.orange;
      case 'pending_parts':
      case 'pending_client':
        return Colors.amber;
      case 'resolved':
        return Colors.teal;
      case 'closed':
        return Colors.green;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'open':
        return 'Abierto';
      case 'assigned':
        return 'Asignado';
      case 'in_progress':
        return 'En Progreso';
      case 'pending_parts':
        return 'Esp. Partes';
      case 'pending_client':
        return 'Esp. Cliente';
      case 'resolved':
        return 'Resuelto';
      case 'closed':
        return 'Cerrado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  String _getSlaLabel(String value) {
    switch (value) {
      case 'ok':
        return 'SLA OK';
      case 'at_risk':
        return 'SLA Riesgo';
      case 'breached':
        return 'SLA Vencido';
      default:
        return 'SLA N/A';
    }
  }

  Color _getSlaColor(String value) {
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

  String _getCoverageLabel(String value) {
    switch (value) {
      case 'covered':
        return 'Cubierto';
      case 'partial':
        return 'Parcial';
      case 'not_covered':
        return 'No cubierto';
      default:
        return 'Sin cobertura';
    }
  }

  Color _getCoverageColor(String value) {
    switch (value) {
      case 'covered':
        return Colors.green;
      case 'partial':
        return Colors.orange;
      case 'not_covered':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getTypeLabel(String type) {
    switch (type) {
      case 'corrective':
        return 'Correctivo';
      case 'preventive':
        return 'Preventivo';
      case 'installation':
        return 'Instalación';
      case 'consultation':
        return 'Consulta';
      default:
        return type;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'corrective':
        return Icons.build;
      case 'preventive':
        return Icons.schedule;
      case 'installation':
        return Icons.add_box;
      case 'consultation':
        return Icons.help_outline;
      default:
        return Icons.work;
    }
  }
}
