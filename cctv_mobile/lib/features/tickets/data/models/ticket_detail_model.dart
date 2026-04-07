import '../../domain/entities/ticket_detail.dart';

class TicketDetailModel extends TicketDetail {
  const TicketDetailModel({
    required super.id,
    required super.tenantId,
    required super.ticketNumber,
    super.clientId,
    super.siteId,
    required super.type,
    required super.priority,
    required super.status,
    required super.title,
    super.description,
    super.assignedTo,
    super.reportedBy,
    super.clientName,
    super.clientEmail,
    super.clientPhone,
    super.siteName,
    super.siteAddress,
    super.siteCity,
    super.equipmentSerial,
    super.reportedByName,
    super.reportedByEmail,
    super.assignedToName,
    super.assignedToEmail,
    super.assignedToPhone,
    super.scheduledDate,
    super.startedAt,
    super.completedAt,
    super.slaHours,
    super.slaDeadline,
    super.slaMet,
    super.policyId,
    super.policyNumber,
    super.policyVendor,
    super.policyContractType,
    super.coverageStatus,
    super.slaStatus,
    super.slaPolicyName,
    super.dueResponseAt,
    super.dueResolutionAt,
    super.respondedAt,
    super.resolvedAt,
    super.breachedResponse,
    super.breachedResolution,
    super.timeToResponseMinutes,
    super.timeToResolutionMinutes,
    super.resolution,
    super.rating,
    super.ratingComment,
    required super.createdAt,
    required super.updatedAt,
  });

  factory TicketDetailModel.fromJson(Map<String, dynamic> json) {
    final policy = json['policy'] is Map<String, dynamic>
        ? json['policy'] as Map<String, dynamic>
        : null;
    final sla = json['sla'] is Map<String, dynamic>
        ? json['sla'] as Map<String, dynamic>
        : null;

    return TicketDetailModel(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      ticketNumber: json['ticket_number'] as String,
      clientId: json['client_id'] as String?,
      siteId: json['site_id'] as String?,
      type: json['type'] as String? ?? 'corrective',
      priority: json['priority'] as String? ?? 'medium',
      status: json['status'] as String? ?? 'open',
      title: json['title'] as String,
      description: json['description'] as String?,
      assignedTo: json['assigned_to'] as String?,
      reportedBy: json['reported_by'] as String?,
      clientName: json['client_name'] as String?,
      clientEmail: json['client_email'] as String?,
      clientPhone: json['client_phone'] as String?,
      siteName: json['site_name'] as String?,
      siteAddress: json['site_address'] as String?,
      siteCity: json['site_city'] as String?,
      equipmentSerial: json['equipment_serial'] as String?,
      reportedByName: json['reported_by_name'] as String?,
      reportedByEmail: json['reported_by_email'] as String?,
      assignedToName: json['assigned_to_name'] as String?,
      assignedToEmail: json['assigned_to_email'] as String?,
      assignedToPhone: json['assigned_to_phone'] as String?,
      scheduledDate: json['scheduled_date'] != null
          ? DateTime.parse(json['scheduled_date'] as String)
          : null,
      startedAt: json['started_at'] != null
          ? DateTime.parse(json['started_at'] as String)
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'] as String)
          : null,
      slaHours: json['sla_hours'] as int?,
      slaDeadline: json['sla_deadline'] != null
          ? DateTime.parse(json['sla_deadline'] as String)
          : null,
      slaMet: json['sla_met'] as bool?,
      policyId: (policy?['policy_id'] ?? json['policy_id']) as String?,
      policyNumber:
          (policy?['policy_number'] ?? json['policy_number']) as String?,
      policyVendor:
          (policy?['policy_vendor'] ?? json['policy_vendor']) as String?,
      policyContractType:
          (policy?['policy_contract_type'] ?? json['policy_contract_type'])
              as String?,
      coverageStatus:
          (policy?['coverage_status'] ?? json['coverage_status']) as String?,
      slaStatus: (sla?['sla_status'] ?? json['sla_status']) as String?,
      slaPolicyName: sla?['sla_policy_name'] as String?,
      dueResponseAt: sla?['due_response_at'] != null
          ? DateTime.parse(sla!['due_response_at'] as String)
          : null,
      dueResolutionAt: sla?['due_resolution_at'] != null
          ? DateTime.parse(sla!['due_resolution_at'] as String)
          : null,
      respondedAt: sla?['responded_at'] != null
          ? DateTime.parse(sla!['responded_at'] as String)
          : null,
      resolvedAt: sla?['resolved_at'] != null
          ? DateTime.parse(sla!['resolved_at'] as String)
          : null,
      breachedResponse: sla?['breached_response'] as bool?,
      breachedResolution: sla?['breached_resolution'] as bool?,
      timeToResponseMinutes: sla?['time_to_response_minutes'] as int?,
      timeToResolutionMinutes: sla?['time_to_resolution_minutes'] as int?,
      resolution: json['resolution'] as String?,
      rating: json['rating'] as int?,
      ratingComment: json['rating_comment'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tenant_id': tenantId,
      'ticket_number': ticketNumber,
      'client_id': clientId,
      'site_id': siteId,
      'type': type,
      'priority': priority,
      'status': status,
      'title': title,
      'description': description,
      'assigned_to': assignedTo,
      'reported_by': reportedBy,
      'client_name': clientName,
      'client_email': clientEmail,
      'client_phone': clientPhone,
      'site_name': siteName,
      'site_address': siteAddress,
      'site_city': siteCity,
      'equipment_serial': equipmentSerial,
      'reported_by_name': reportedByName,
      'reported_by_email': reportedByEmail,
      'assigned_to_name': assignedToName,
      'assigned_to_email': assignedToEmail,
      'assigned_to_phone': assignedToPhone,
      'scheduled_date': scheduledDate?.toIso8601String(),
      'started_at': startedAt?.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
      'sla_hours': slaHours,
      'sla_deadline': slaDeadline?.toIso8601String(),
      'sla_met': slaMet,
      'policy_id': policyId,
      'policy_number': policyNumber,
      'policy_vendor': policyVendor,
      'policy_contract_type': policyContractType,
      'coverage_status': coverageStatus,
      'sla_status': slaStatus,
      'sla_policy_name': slaPolicyName,
      'due_response_at': dueResponseAt?.toIso8601String(),
      'due_resolution_at': dueResolutionAt?.toIso8601String(),
      'responded_at': respondedAt?.toIso8601String(),
      'resolved_at': resolvedAt?.toIso8601String(),
      'breached_response': breachedResponse,
      'breached_resolution': breachedResolution,
      'time_to_response_minutes': timeToResponseMinutes,
      'time_to_resolution_minutes': timeToResolutionMinutes,
      'resolution': resolution,
      'rating': rating,
      'rating_comment': ratingComment,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

class TimelineEntryModel extends TimelineEntry {
  const TimelineEntryModel({
    required super.id,
    required super.eventType,
    super.description,
    super.userName,
    super.oldValue,
    super.newValue,
    required super.createdAt,
  });

  factory TimelineEntryModel.fromJson(Map<String, dynamic> json) {
    return TimelineEntryModel(
      id: json['id'] as String,
      eventType: json['event_type'] as String,
      description: json['description'] as String?,
      userName: json['user_name'] as String?,
      oldValue: json['old_value'] as String?,
      newValue: json['new_value'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'event_type': eventType,
      'description': description,
      'user_name': userName,
      'old_value': oldValue,
      'new_value': newValue,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

class TicketCommentModel extends TicketComment {
  const TicketCommentModel({
    required super.id,
    required super.comment,
    super.userName,
    required super.isInternal,
    required super.createdAt,
  });

  factory TicketCommentModel.fromJson(Map<String, dynamic> json) {
    return TicketCommentModel(
      id: json['id'] as String,
      comment: json['comment'] as String,
      userName: json['user_name'] as String?,
      isInternal: json['is_internal'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'comment': comment,
      'user_name': userName,
      'is_internal': isInternal,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
