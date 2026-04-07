import 'package:equatable/equatable.dart';

abstract class TicketsEvent extends Equatable {
  const TicketsEvent();

  @override
  List<Object?> get props => [];
}

class LoadTickets extends TicketsEvent {
  final String? status;
  final String? type;
  final String? priority;
  final bool refresh;

  const LoadTickets({
    this.status,
    this.type,
    this.priority,
    this.refresh = false,
  });

  @override
  List<Object?> get props => [status, type, priority, refresh];
}

class LoadTicketDetail extends TicketsEvent {
  final String ticketId;

  const LoadTicketDetail(this.ticketId);

  @override
  List<Object?> get props => [ticketId];
}

class LoadTicketTimeline extends TicketsEvent {
  final String ticketId;

  const LoadTicketTimeline(this.ticketId);

  @override
  List<Object?> get props => [ticketId];
}

class LoadTicketComments extends TicketsEvent {
  final String ticketId;

  const LoadTicketComments(this.ticketId);

  @override
  List<Object?> get props => [ticketId];
}

class AddComment extends TicketsEvent {
  final String ticketId;
  final String comment;
  final bool isInternal;

  const AddComment({
    required this.ticketId,
    required this.comment,
    this.isInternal = false,
  });

  @override
  List<Object?> get props => [ticketId, comment, isInternal];
}

class StartTicket extends TicketsEvent {
  final String ticketId;

  const StartTicket(this.ticketId);

  @override
  List<Object?> get props => [ticketId];
}

class ChangeTicketStatus extends TicketsEvent {
  final String ticketId;
  final String newStatus;
  final String? reason;

  const ChangeTicketStatus({
    required this.ticketId,
    required this.newStatus,
    this.reason,
  });

  @override
  List<Object?> get props => [ticketId, newStatus, reason];
}

class CloseTicket extends TicketsEvent {
  final String ticketId;
  final String resolution;
  final List<String>? evidenceUrls;
  final String? signatureUrl;

  const CloseTicket({
    required this.ticketId,
    required this.resolution,
    this.evidenceUrls,
    this.signatureUrl,
  });

  @override
  List<Object?> get props => [ticketId, resolution, evidenceUrls, signatureUrl];
}

class UploadEvidence extends TicketsEvent {
  final String ticketId;
  final String filePath;
  final String category;

  const UploadEvidence({
    required this.ticketId,
    required this.filePath,
    this.category = 'evidence',
  });

  @override
  List<Object?> get props => [ticketId, filePath, category];
}

class LoadTicketStats extends TicketsEvent {
  const LoadTicketStats();
}

class ClearError extends TicketsEvent {
  const ClearError();
}
