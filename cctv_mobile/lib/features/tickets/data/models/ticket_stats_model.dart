import '../../domain/entities/ticket_stats.dart';

class TicketStatsModel extends TicketStats {
  const TicketStatsModel({
    required super.total,
    required super.openCount,
    required super.assignedCount,
    required super.inProgressCount,
    required super.pendingPartsCount,
    required super.pendingApprovalCount,
    required super.onHoldCount,
    required super.completedCount,
    required super.cancelledCount,
    required super.criticalCount,
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
      pendingApprovalCount: json['pending_approval_count'] as int? ?? 0,
      onHoldCount: json['on_hold_count'] as int? ?? 0,
      completedCount: json['completed_count'] as int? ?? 0,
      cancelledCount: json['cancelled_count'] as int? ?? 0,
      criticalCount:
          (json['critical_count'] as int?) ?? (json['urgent_count'] as int?) ?? 0,
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
      'pending_approval_count': pendingApprovalCount,
      'on_hold_count': onHoldCount,
      'completed_count': completedCount,
      'cancelled_count': cancelledCount,
      'critical_count': criticalCount,
      'high_count': highCount,
      'preventive_count': preventiveCount,
      'corrective_count': correctiveCount,
    };
  }
}
