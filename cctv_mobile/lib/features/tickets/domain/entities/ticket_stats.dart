import 'package:equatable/equatable.dart';

class TicketStats extends Equatable {
  final int total;
  final int openCount;
  final int assignedCount;
  final int inProgressCount;
  final int pendingPartsCount;
  final int pendingClientCount;
  final int completedCount;
  final int closedCount;
  final int cancelledCount;
  final int urgentCount;
  final int highCount;
  final int preventiveCount;
  final int correctiveCount;

  const TicketStats({
    required this.total,
    required this.openCount,
    required this.assignedCount,
    required this.inProgressCount,
    required this.pendingPartsCount,
    required this.pendingClientCount,
    required this.completedCount,
    required this.closedCount,
    required this.cancelledCount,
    required this.urgentCount,
    required this.highCount,
    required this.preventiveCount,
    required this.correctiveCount,
  });

  int get activeCount => openCount + assignedCount + inProgressCount;
  int get pendingCount => pendingPartsCount + pendingClientCount;

  @override
  List<Object?> get props => [
    total,
    openCount,
    assignedCount,
    inProgressCount,
    pendingPartsCount,
    pendingClientCount,
    completedCount,
    closedCount,
    cancelledCount,
    urgentCount,
    highCount,
    preventiveCount,
    correctiveCount,
  ];
}
