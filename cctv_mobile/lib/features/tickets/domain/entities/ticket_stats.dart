import 'package:equatable/equatable.dart';

class TicketStats extends Equatable {
  final int total;
  final int openCount;
  final int assignedCount;
  final int inProgressCount;
  final int pendingPartsCount;
  final int pendingApprovalCount;
  final int onHoldCount;
  final int completedCount;
  final int cancelledCount;
  final int criticalCount;
  final int highCount;
  final int preventiveCount;
  final int correctiveCount;

  const TicketStats({
    required this.total,
    required this.openCount,
    required this.assignedCount,
    required this.inProgressCount,
    required this.pendingPartsCount,
    required this.pendingApprovalCount,
    required this.onHoldCount,
    required this.completedCount,
    required this.cancelledCount,
    required this.criticalCount,
    required this.highCount,
    required this.preventiveCount,
    required this.correctiveCount,
  });

  int get activeCount => openCount + assignedCount + inProgressCount;
  int get pendingCount => pendingPartsCount + pendingApprovalCount + onHoldCount;

  @override
  List<Object?> get props => [
    total,
    openCount,
    assignedCount,
    inProgressCount,
    pendingPartsCount,
    pendingApprovalCount,
    onHoldCount,
    completedCount,
    cancelledCount,
    criticalCount,
    highCount,
    preventiveCount,
    correctiveCount,
  ];
}
