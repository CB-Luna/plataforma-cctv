import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../domain/entities/ticket_detail.dart';

class TimelineWidget extends StatelessWidget {
  final List<TimelineEntry> entries;

  const TimelineWidget({super.key, required this.entries});

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('No hay eventos en el historial'),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: entries.length,
      itemBuilder: (context, index) {
        final entry = entries[index];
        final isLast = index == entries.length - 1;

        return _TimelineItem(entry: entry, isLast: isLast);
      },
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final TimelineEntry entry;
  final bool isLast;

  const _TimelineItem({required this.entry, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _getEventColor(entry.eventType);
    final icon = _getEventIcon(entry.eventType);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 60,
            child: Column(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                    border: Border.all(color: color, width: 2),
                  ),
                  child: Icon(icon, size: 18, color: color),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: theme.colorScheme.outlineVariant,
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.eventTypeLabel,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (entry.description != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      entry.description!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  if (entry.oldValue != null && entry.newValue != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            entry.oldValue!,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: Colors.red,
                            ),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 8),
                          child: Icon(Icons.arrow_forward, size: 14),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            entry.newValue!,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: Colors.green,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (entry.userName != null) ...[
                        Icon(
                          Icons.person_outline,
                          size: 14,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          entry.userName!,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      Icon(
                        Icons.access_time,
                        size: 14,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        timeago.format(entry.createdAt, locale: 'es'),
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getEventColor(String eventType) {
    switch (eventType) {
      case 'created':
        return Colors.blue;
      case 'status_change':
        return Colors.orange;
      case 'assignment':
        return Colors.purple;
      case 'comment':
        return Colors.teal;
      default:
        return Colors.grey;
    }
  }

  IconData _getEventIcon(String eventType) {
    switch (eventType) {
      case 'created':
        return Icons.add_circle_outline;
      case 'status_change':
        return Icons.swap_horiz;
      case 'assignment':
        return Icons.person_add_outlined;
      case 'comment':
        return Icons.comment_outlined;
      default:
        return Icons.circle_outlined;
    }
  }
}
