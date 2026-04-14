import 'package:flutter/material.dart';
import '../../domain/entities/ticket_catalog.dart';

class TicketStatusBadge extends StatelessWidget {
  final String status;
  final bool large;

  const TicketStatusBadge({
    super.key,
    required this.status,
    this.large = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(status);
    final label = TicketCatalog.statusLabel(status);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: large ? 12 : 8,
        vertical: large ? 6 : 4,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(large ? 16 : 12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: large ? 10 : 8,
            height: large ? 10 : 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          SizedBox(width: large ? 8 : 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: large ? 14 : 12,
            ),
          ),
        ],
      ),
    );
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
}

class PriorityBadge extends StatelessWidget {
  final String priority;
  final bool showLabel;

  const PriorityBadge({
    super.key,
    required this.priority,
    this.showLabel = true,
  });

  @override
  Widget build(BuildContext context) {
    final color = _priorityColor(priority);
    final label = TicketCatalog.priorityLabel(priority);
    final icon = _priorityIcon(priority);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          if (showLabel) ...[
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ],
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
}
