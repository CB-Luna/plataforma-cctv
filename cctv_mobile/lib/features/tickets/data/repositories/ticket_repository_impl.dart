import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/ticket.dart';
import '../../domain/entities/ticket_detail.dart';
import '../../domain/entities/ticket_stats.dart';
import '../../domain/repositories/ticket_repository.dart';
import '../datasources/ticket_remote_datasource.dart';

class TicketRepositoryImpl implements TicketRepository {
  final TicketRemoteDataSource remoteDataSource;

  TicketRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<Ticket>>> getTickets({
    String? status,
    String? type,
    String? priority,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final tickets = await remoteDataSource.getTickets(
        status: status,
        type: type,
        priority: priority,
        limit: limit,
        offset: offset,
      );
      return Right(tickets);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, TicketDetail>> getTicketDetail(String ticketId) async {
    try {
      final ticket = await remoteDataSource.getTicketDetail(ticketId);
      return Right(ticket);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<TimelineEntry>>> getTicketTimeline(
    String ticketId,
  ) async {
    try {
      final timeline = await remoteDataSource.getTicketTimeline(ticketId);
      return Right(timeline);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<TicketComment>>> getTicketComments(
    String ticketId,
  ) async {
    try {
      final comments = await remoteDataSource.getTicketComments(ticketId);
      return Right(comments);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, TicketComment>> addComment(
    String ticketId,
    String comment, {
    bool isInternal = false,
  }) async {
    try {
      final newComment = await remoteDataSource.addComment(
        ticketId,
        comment,
        isInternal: isInternal,
      );
      return Right(newComment);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> changeStatus(
    String ticketId,
    String newStatus, {
    String? reason,
  }) async {
    try {
      await remoteDataSource.changeStatus(ticketId, newStatus, reason: reason);
      return const Right(null);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> startTicket(String ticketId) async {
    try {
      await remoteDataSource.startTicket(ticketId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> closeTicket(
    String ticketId, {
    required String resolution,
    List<String>? evidenceUrls,
    String? signatureUrl,
  }) async {
    try {
      await remoteDataSource.closeTicket(
        ticketId,
        resolution: resolution,
        evidenceUrls: evidenceUrls,
        signatureUrl: signatureUrl,
      );
      return const Right(null);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, TicketStats>> getTicketStats() async {
    try {
      final stats = await remoteDataSource.getTicketStats();
      return Right(stats);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, String>> uploadEvidence(
    String ticketId,
    String filePath,
    String category,
  ) async {
    try {
      final url = await remoteDataSource.uploadEvidence(
        ticketId,
        filePath,
        category,
      );
      return Right(url);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  Failure _handleDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const NetworkFailure('Tiempo de conexión agotado');
      case DioExceptionType.connectionError:
        return const NetworkFailure('Error de conexión. Verifique su red.');
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        String message = 'Error del servidor';
        final data = e.response?.data;
        if (data is Map<String, dynamic>) {
          message =
              data['error'] as String? ?? data['message'] as String? ?? message;
        }
        if (statusCode == 401) {
          return AuthFailure(message);
        } else if (statusCode == 404) {
          return NotFoundFailure(message);
        } else if (statusCode == 403) {
          return const AuthFailure('No tiene permisos para esta acción');
        }
        return ServerFailure(message);
      default:
        return ServerFailure(e.message ?? 'Error desconocido');
    }
  }
}
