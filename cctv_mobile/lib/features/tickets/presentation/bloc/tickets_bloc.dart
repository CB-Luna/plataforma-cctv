import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/ticket_repository.dart';
import 'tickets_event.dart';
import 'tickets_state.dart';

class TicketsBloc extends Bloc<TicketsEvent, TicketsState> {
  final TicketRepository repository;

  TicketsBloc({required this.repository}) : super(const TicketsState()) {
    on<LoadTickets>(_onLoadTickets);
    on<LoadTicketDetail>(_onLoadTicketDetail);
    on<LoadTicketTimeline>(_onLoadTicketTimeline);
    on<LoadTicketComments>(_onLoadTicketComments);
    on<AddComment>(_onAddComment);
    on<StartTicket>(_onStartTicket);
    on<ChangeTicketStatus>(_onChangeTicketStatus);
    on<CloseTicket>(_onCloseTicket);
    on<UploadEvidence>(_onUploadEvidence);
    on<LoadTicketStats>(_onLoadTicketStats);
    on<ClearError>(_onClearError);
  }

  Future<void> _onLoadTickets(
    LoadTickets event,
    Emitter<TicketsState> emit,
  ) async {
    if (event.refresh) {
      emit(
        state.copyWith(
          status: TicketsStatus.loading,
          currentPage: 0,
          clearError: true,
        ),
      );
    } else if (state.status == TicketsStatus.initial) {
      emit(state.copyWith(status: TicketsStatus.loading));
    }

    final result = await repository.getTickets(
      status: event.status ?? state.filterStatus,
      type: event.type ?? state.filterType,
      priority: event.priority ?? state.filterPriority,
      limit: 20,
      offset: event.refresh ? 0 : state.currentPage * 20,
    );

    result.fold(
      (failure) => emit(
        state.copyWith(
          status: TicketsStatus.loaded,
          errorMessage: failure.message,
        ),
      ),
      (tickets) => emit(
        state.copyWith(
          status: TicketsStatus.loaded,
          tickets: event.refresh ? tickets : [...state.tickets, ...tickets],
          filterStatus: event.status,
          filterType: event.type,
          filterPriority: event.priority,
          hasReachedMax: tickets.length < 20,
          currentPage: event.refresh ? 1 : state.currentPage + 1,
          clearError: true,
        ),
      ),
    );
  }

  Future<void> _onLoadTicketDetail(
    LoadTicketDetail event,
    Emitter<TicketsState> emit,
  ) async {
    emit(state.copyWith(status: TicketsStatus.loading));

    final result = await repository.getTicketDetail(event.ticketId);

    result.fold(
      (failure) => emit(
        state.copyWith(
          status: TicketsStatus.error,
          errorMessage: failure.message,
        ),
      ),
      (ticket) => emit(
        state.copyWith(status: TicketsStatus.loaded, selectedTicket: ticket),
      ),
    );
  }

  Future<void> _onLoadTicketTimeline(
    LoadTicketTimeline event,
    Emitter<TicketsState> emit,
  ) async {
    final result = await repository.getTicketTimeline(event.ticketId);

    result.fold(
      (failure) => emit(state.copyWith(errorMessage: failure.message)),
      (timeline) => emit(state.copyWith(timeline: timeline)),
    );
  }

  Future<void> _onLoadTicketComments(
    LoadTicketComments event,
    Emitter<TicketsState> emit,
  ) async {
    final result = await repository.getTicketComments(event.ticketId);

    result.fold(
      (failure) => emit(state.copyWith(errorMessage: failure.message)),
      (comments) => emit(state.copyWith(comments: comments)),
    );
  }

  Future<void> _onAddComment(
    AddComment event,
    Emitter<TicketsState> emit,
  ) async {
    final result = await repository.addComment(
      event.ticketId,
      event.comment,
      isInternal: event.isInternal,
    );

    result.fold(
      (failure) => emit(state.copyWith(errorMessage: failure.message)),
      (comment) => emit(state.copyWith(comments: [...state.comments, comment])),
    );
  }

  Future<void> _onStartTicket(
    StartTicket event,
    Emitter<TicketsState> emit,
  ) async {
    emit(state.copyWith(status: TicketsStatus.loading));

    final result = await repository.startTicket(event.ticketId);

    result.fold(
      (failure) => emit(
        state.copyWith(
          status: TicketsStatus.error,
          errorMessage: failure.message,
        ),
      ),
      (_) {
        add(LoadTicketDetail(event.ticketId));
        add(const LoadTickets(refresh: true));
      },
    );
  }

  Future<void> _onChangeTicketStatus(
    ChangeTicketStatus event,
    Emitter<TicketsState> emit,
  ) async {
    emit(state.copyWith(status: TicketsStatus.loading));

    final result = await repository.changeStatus(
      event.ticketId,
      event.newStatus,
      reason: event.reason,
    );

    result.fold(
      (failure) => emit(
        state.copyWith(
          status: TicketsStatus.error,
          errorMessage: failure.message,
        ),
      ),
      (_) {
        add(LoadTicketDetail(event.ticketId));
        add(const LoadTickets(refresh: true));
      },
    );
  }

  Future<void> _onCloseTicket(
    CloseTicket event,
    Emitter<TicketsState> emit,
  ) async {
    emit(state.copyWith(status: TicketsStatus.loading));

    final result = await repository.closeTicket(
      event.ticketId,
      resolution: event.resolution,
      evidenceUrls: event.evidenceUrls,
      signatureUrl: event.signatureUrl,
    );

    result.fold(
      (failure) => emit(
        state.copyWith(
          status: TicketsStatus.error,
          errorMessage: failure.message,
        ),
      ),
      (_) {
        emit(
          state.copyWith(
            status: TicketsStatus.loaded,
            uploadedEvidenceUrls: const [],
          ),
        );
        add(LoadTicketDetail(event.ticketId));
        add(const LoadTickets(refresh: true));
      },
    );
  }

  Future<void> _onUploadEvidence(
    UploadEvidence event,
    Emitter<TicketsState> emit,
  ) async {
    final result = await repository.uploadEvidence(
      event.ticketId,
      event.filePath,
      event.category,
    );

    result.fold(
      (failure) => emit(state.copyWith(errorMessage: failure.message)),
      (url) => emit(
        state.copyWith(
          uploadedEvidenceUrls: [...state.uploadedEvidenceUrls, url],
        ),
      ),
    );
  }

  Future<void> _onLoadTicketStats(
    LoadTicketStats event,
    Emitter<TicketsState> emit,
  ) async {
    final result = await repository.getTicketStats();

    result.fold(
      (failure) => emit(state.copyWith(errorMessage: failure.message)),
      (stats) => emit(state.copyWith(stats: stats)),
    );
  }

  void _onClearError(ClearError event, Emitter<TicketsState> emit) {
    emit(state.copyWith(clearError: true));
  }
}
