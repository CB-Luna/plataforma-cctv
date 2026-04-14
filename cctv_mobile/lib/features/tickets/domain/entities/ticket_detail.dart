import 'package:equatable/equatable.dart';
import 'ticket_catalog.dart';

class TicketDetail extends Equatable {
  final String id;
  final String tenantId;
  final String ticketNumber;
  final String? clientId;
  final String? siteId;
  final String type;
  final String priority;
  final String status;
  final String title;
  final String? description;
  final String? assignedTo;
  final String? reportedBy;
  final String? clientName;
  final String? clientEmail;
  final String? clientPhone;
  final String? siteName;
  final String? siteAddress;
  final String? siteCity;
  final String? equipmentSerial;
  final String? reportedByName;
  final String? reportedByEmail;
  final String? assignedToName;
  final String? assignedToEmail;
  final String? assignedToPhone;
  final DateTime? scheduledDate;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final int? slaHours;
  final DateTime? slaDeadline;
  final bool? slaMet;
  final String? policyId;
  final String? policyNumber;
  final String? policyVendor;
  final String? policyContractType;
  final String? coverageStatus;
  final String? slaStatus;
  final String? slaPolicyName;
  final DateTime? dueResponseAt;
  final DateTime? dueResolutionAt;
  final DateTime? respondedAt;
  final DateTime? resolvedAt;
  final bool? breachedResponse;
  final bool? breachedResolution;
  final int? timeToResponseMinutes;
  final int? timeToResolutionMinutes;
  final String? resolution;
  final int? rating;
  final String? ratingComment;
  final DateTime createdAt;
  final DateTime updatedAt;

  const TicketDetail({
    required this.id,
    required this.tenantId,
    required this.ticketNumber,
    this.clientId,
    this.siteId,
    required this.type,
    required this.priority,
    required this.status,
    required this.title,
    this.description,
    this.assignedTo,
    this.reportedBy,
    this.clientName,
    this.clientEmail,
    this.clientPhone,
    this.siteName,
    this.siteAddress,
    this.siteCity,
    this.equipmentSerial,
    this.reportedByName,
    this.reportedByEmail,
    this.assignedToName,
    this.assignedToEmail,
    this.assignedToPhone,
    this.scheduledDate,
    this.startedAt,
    this.completedAt,
    this.slaHours,
    this.slaDeadline,
    this.slaMet,
    this.policyId,
    this.policyNumber,
    this.policyVendor,
    this.policyContractType,
    this.coverageStatus,
    this.slaStatus,
    this.slaPolicyName,
    this.dueResponseAt,
    this.dueResolutionAt,
    this.respondedAt,
    this.resolvedAt,
    this.breachedResponse,
    this.breachedResolution,
    this.timeToResponseMinutes,
    this.timeToResolutionMinutes,
    this.resolution,
    this.rating,
    this.ratingComment,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isUrgent => TicketCatalog.isUrgentPriority(priority);
  bool get isHighPriority => TicketCatalog.isHighPriority(priority);
  bool get isOpen => TicketCatalog.canonicalStatus(status) == 'open';
  bool get isInProgress => TicketCatalog.canonicalStatus(status) == 'in_progress';
  bool get isClosed => TicketCatalog.isClosedStatus(status);
  bool get canStart => TicketCatalog.canStartStatus(status);
  bool get canClose => TicketCatalog.canCompleteStatus(status);

  String get priorityLabel => TicketCatalog.priorityLabel(priority);
  String get statusLabel => TicketCatalog.statusLabel(status);
  String get typeLabel => TicketCatalog.typeLabel(type);
  String get nextActionLabel => TicketCatalog.nextActionLabel(status);

  String get fullAddress {
    final parts = <String>[];
    if (siteAddress != null && siteAddress!.isNotEmpty) {
      parts.add(siteAddress!);
    }
    if (siteCity != null && siteCity!.isNotEmpty) {
      parts.add(siteCity!);
    }
    return parts.join(', ');
  }

  @override
  List<Object?> get props => [
    id,
    tenantId,
    ticketNumber,
    clientId,
    siteId,
    type,
    priority,
    status,
    title,
    description,
    assignedTo,
    reportedBy,
    clientName,
    clientEmail,
    clientPhone,
    siteName,
    siteAddress,
    siteCity,
    equipmentSerial,
    reportedByName,
    reportedByEmail,
    assignedToName,
    assignedToEmail,
    assignedToPhone,
    scheduledDate,
    startedAt,
    completedAt,
    slaHours,
    slaDeadline,
    slaMet,
    policyId,
    policyNumber,
    policyVendor,
    policyContractType,
    coverageStatus,
    slaStatus,
    slaPolicyName,
    dueResponseAt,
    dueResolutionAt,
    respondedAt,
    resolvedAt,
    breachedResponse,
    breachedResolution,
    timeToResponseMinutes,
    timeToResolutionMinutes,
    resolution,
    rating,
    ratingComment,
    createdAt,
    updatedAt,
  ];
}

class TimelineEntry extends Equatable {
  final String id;
  final String eventType;
  final String? description;
  final String? userName;
  final String? oldValue;
  final String? newValue;
  final DateTime createdAt;

  const TimelineEntry({
    required this.id,
    required this.eventType,
    this.description,
    this.userName,
    this.oldValue,
    this.newValue,
    required this.createdAt,
  });

  String get eventTypeLabel {
    switch (eventType) {
      case 'created':
        return 'Creado';
      case 'status_change':
        return 'Cambio de estado';
      case 'assignment':
        return 'Asignacion';
      case 'comment':
        return 'Comentario';
      default:
        return eventType;
    }
  }

  @override
  List<Object?> get props => [
    id,
    eventType,
    description,
    userName,
    oldValue,
    newValue,
    createdAt,
  ];
}

class TicketComment extends Equatable {
  final String id;
  final String comment;
  final String? userName;
  final bool isInternal;
  final DateTime createdAt;

  const TicketComment({
    required this.id,
    required this.comment,
    this.userName,
    required this.isInternal,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, comment, userName, isInternal, createdAt];
}
