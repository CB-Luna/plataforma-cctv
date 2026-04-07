import '../../domain/entities/ticket_stats.dart';

class TicketStatsModel extends TicketStats {
  const TicketStatsModel({
    required super.total,
    required super.openCount,
    required super.assignedCount,
    required super.inProgressCount,
    required super.pendingPartsCount,
    required super.pendingClientCount,
    required super.completedCount,
    required super.closedCount,
    required super.cancelledCount,
    required super.urgentCount,
    required super.highCount,
    required super.preventiveCount,
    required super.correctiveCount,
  });

  factory TicketStatsModel.fromJson(Map<String, dynamic> json) {
    return TicketStatsModel(
      total: json['total'] as int? ?? 0,
      openCount: json['open_count'] as int? ?? 0,
      assignedCount: json['assigned_count'] as int? ?? 0,
      inProgressCount: json['in_progress_count'] as int? ?? 0,
      pendingPartsCount: json['pending_parts_count'] as int? ?? 0,
      pendingClientCount: json['pending_client_count'] as int? ?? 0,
      completedCount: json['completed_count'] as int? ?? 0,
      closedCount: json['closed_count'] as int? ?? 0,
      cancelledCount: json['cancelled_count'] as int? ?? 0,
      urgentCount: json['urgent_count'] as int? ?? 0,
      highCount: json['high_count'] as int? ?? 0,
      preventiveCount: json['preventive_count'] as int? ?? 0,
      correctiveCount: json['corrective_count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'open_count': openCount,
      'assigned_count': assignedCount,
      'in_progress_count': inProgressCount,
      'pending_parts_count': pendingPartsCount,
      'pending_client_count': pendingClientCount,
      'completed_count': completedCount,
      'closed_count': closedCount,
      'cancelled_count': cancelledCount,
      'urgent_count': urgentCount,
      'high_count': highCount,
      'preventive_count': preventiveCount,
      'corrective_count': correctiveCount,
    };
  }
}
