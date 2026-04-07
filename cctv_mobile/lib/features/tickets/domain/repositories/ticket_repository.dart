import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/ticket.dart';
import '../entities/ticket_detail.dart';
import '../entities/ticket_stats.dart';

abstract class TicketRepository {
  Future<Either<Failure, List<Ticket>>> getTickets({
    String? status,
    String? type,
    String? priority,
    int limit = 20,
    int offset = 0,
  });

  Future<Either<Failure, TicketDetail>> getTicketDetail(String ticketId);

  Future<Either<Failure, List<TimelineEntry>>> getTicketTimeline(
    String ticketId,
  );

  Future<Either<Failure, List<TicketComment>>> getTicketComments(
    String ticketId,
  );

  Future<Either<Failure, TicketComment>> addComment(
    String ticketId,
    String comment, {
    bool isInternal = false,
  });

  Future<Either<Failure, void>> changeStatus(
    String ticketId,
    String newStatus, {
    String? reason,
  });

  Future<Either<Failure, void>> startTicket(String ticketId);

  Future<Either<Failure, void>> closeTicket(
    String ticketId, {
    required String resolution,
    List<String>? evidenceUrls,
    String? signatureUrl,
  });

  Future<Either<Failure, TicketStats>> getTicketStats();

  Future<Either<Failure, String>> uploadEvidence(
    String ticketId,
    String filePath,
    String category,
  );
}
