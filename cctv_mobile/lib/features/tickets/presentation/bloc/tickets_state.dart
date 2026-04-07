import 'package:equatable/equatable.dart';
import '../../domain/entities/ticket.dart';
import '../../domain/entities/ticket_detail.dart';
import '../../domain/entities/ticket_stats.dart';

enum TicketsStatus { initial, loading, loaded, error }

class TicketsState extends Equatable {
  final TicketsStatus status;
  final List<Ticket> tickets;
  final TicketDetail? selectedTicket;
  final List<TimelineEntry> timeline;
  final List<TicketComment> comments;
  final TicketStats? stats;
  final List<String> uploadedEvidenceUrls;
  final String? errorMessage;
  final String? filterStatus;
  final String? filterType;
  final String? filterPriority;
  final bool isLoadingMore;
  final bool hasReachedMax;
  final int currentPage;

  const TicketsState({
    this.status = TicketsStatus.initial,
    this.tickets = const [],
    this.selectedTicket,
    this.timeline = const [],
    this.comments = const [],
    this.stats,
    this.uploadedEvidenceUrls = const [],
    this.errorMessage,
    this.filterStatus,
    this.filterType,
    this.filterPriority,
    this.isLoadingMore = false,
    this.hasReachedMax = false,
    this.currentPage = 0,
  });

  TicketsState copyWith({
    TicketsStatus? status,
    List<Ticket>? tickets,
    TicketDetail? selectedTicket,
    List<TimelineEntry>? timeline,
    List<TicketComment>? comments,
    TicketStats? stats,
    List<String>? uploadedEvidenceUrls,
    String? errorMessage,
    String? filterStatus,
    String? filterType,
    String? filterPriority,
    bool? isLoadingMore,
    bool? hasReachedMax,
    int? currentPage,
    bool clearSelectedTicket = false,
    bool clearError = false,
  }) {
    return TicketsState(
      status: status ?? this.status,
      tickets: tickets ?? this.tickets,
      selectedTicket: clearSelectedTicket
          ? null
          : (selectedTicket ?? this.selectedTicket),
      timeline: timeline ?? this.timeline,
      comments: comments ?? this.comments,
      stats: stats ?? this.stats,
      uploadedEvidenceUrls: uploadedEvidenceUrls ?? this.uploadedEvidenceUrls,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      filterStatus: filterStatus ?? this.filterStatus,
      filterType: filterType ?? this.filterType,
      filterPriority: filterPriority ?? this.filterPriority,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasReachedMax: hasReachedMax ?? this.hasReachedMax,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [
    status,
    tickets,
    selectedTicket,
    timeline,
    comments,
    stats,
    uploadedEvidenceUrls,
    errorMessage,
    filterStatus,
    filterType,
    filterPriority,
    isLoadingMore,
    hasReachedMax,
    currentPage,
  ];
}
