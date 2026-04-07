import 'package:equatable/equatable.dart';

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

  bool get isUrgent => priority == 'urgent';
  bool get isHighPriority => priority == 'high';
  bool get isOpen => status == 'open';
  bool get isInProgress => status == 'in_progress';
  bool get isClosed => status == 'closed' || status == 'resolved';

  String get priorityLabel {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'open':
        return 'Abierto';
      case 'assigned':
        return 'Asignado';
      case 'in_progress':
        return 'En Progreso';
      case 'pending_parts':
        return 'Esperando Partes';
      case 'pending_client':
        return 'Esperando Cliente';
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

  String get typeLabel {
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
