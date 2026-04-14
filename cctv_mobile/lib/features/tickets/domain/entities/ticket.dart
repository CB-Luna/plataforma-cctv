import 'package:equatable/equatable.dart';
import 'ticket_catalog.dart';

class Ticket extends Equatable {
  final String id;
  final String tenantId;
  final String ticketNumber;
  final String? clientId;
  final String? siteId;
  final String? equipmentId;
  final String type;
  final String priority;
  final String status;
  final String title;
  final String? description;
  final String? assignedTo;
  final String? reportedBy;
  final String? clientName;
  final String? siteName;
  final String? assignedToName;
  final String? policyId;
  final String? policyNumber;
  final String? coverageStatus;
  final String? slaStatus;
  final bool? breachedSla;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Ticket({
    required this.id,
    required this.tenantId,
    required this.ticketNumber,
    this.clientId,
    this.siteId,
    this.equipmentId,
    required this.type,
    required this.priority,
    required this.status,
    required this.title,
    this.description,
    this.assignedTo,
    this.reportedBy,
    this.clientName,
    this.siteName,
    this.assignedToName,
    this.policyId,
    this.policyNumber,
    this.coverageStatus,
    this.slaStatus,
    this.breachedSla,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isUrgent => TicketCatalog.isUrgentPriority(priority);
  bool get isHighPriority => TicketCatalog.isHighPriority(priority);
  bool get isOpen => TicketCatalog.canonicalStatus(status) == 'open';
  bool get isInProgress => TicketCatalog.canonicalStatus(status) == 'in_progress';
  bool get isClosed => TicketCatalog.isClosedStatus(status);

  String get priorityLabel => TicketCatalog.priorityLabel(priority);
  String get statusLabel => TicketCatalog.statusLabel(status);
  String get typeLabel => TicketCatalog.typeLabel(type);
  String get nextActionLabel => TicketCatalog.nextActionLabel(status);

  @override
  List<Object?> get props => [
    id,
    tenantId,
    ticketNumber,
    clientId,
    siteId,
    equipmentId,
    type,
    priority,
    status,
    title,
    description,
    assignedTo,
    reportedBy,
    clientName,
    siteName,
    assignedToName,
    policyId,
    policyNumber,
    coverageStatus,
    slaStatus,
    breachedSla,
    createdAt,
    updatedAt,
  ];
}
