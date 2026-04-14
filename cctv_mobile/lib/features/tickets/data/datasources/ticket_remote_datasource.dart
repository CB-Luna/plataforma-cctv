import 'package:dio/dio.dart';
import '../models/ticket_detail_model.dart';
import '../models/ticket_model.dart';
import '../models/ticket_stats_model.dart';

abstract class TicketRemoteDataSource {
  Future<List<TicketModel>> getTickets({
    String? status,
    String? type,
    String? priority,
    int limit = 20,
    int offset = 0,
  });

  Future<TicketDetailModel> getTicketDetail(String ticketId);

  Future<List<TimelineEntryModel>> getTicketTimeline(String ticketId);

  Future<List<TicketCommentModel>> getTicketComments(String ticketId);

  Future<TicketCommentModel> addComment(
    String ticketId,
    String comment, {
    bool isInternal = false,
  });

  Future<void> changeStatus(
    String ticketId,
    String newStatus, {
    String? reason,
  });

  Future<void> startTicket(String ticketId);

  Future<void> closeTicket(
    String ticketId, {
    required String resolution,
    List<String>? evidenceUrls,
    String? signatureUrl,
  });

  Future<TicketStatsModel> getTicketStats();

  Future<String> uploadEvidence(
    String ticketId,
    String filePath,
    String category,
  );
}

class TicketRemoteDataSourceImpl implements TicketRemoteDataSource {
  final Dio dio;

  TicketRemoteDataSourceImpl({required this.dio});

  @override
  Future<List<TicketModel>> getTickets({
    String? status,
    String? type,
    String? priority,
    int limit = 20,
    int offset = 0,
  }) async {
    final queryParams = <String, dynamic>{'limit': limit, 'offset': offset};

    if (status != null) {
      queryParams['status'] = status;
    }
    if (type != null) {
      queryParams['type'] = type;
    }
    if (priority != null) {
      queryParams['priority'] = priority;
    }

    final response = await dio.get(
      '/api/v1/tickets',
      queryParameters: queryParams,
    );

    final data = response.data as List<dynamic>;
    return data
        .map((json) => TicketModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<TicketDetailModel> getTicketDetail(String ticketId) async {
    final response = await dio.get('/api/v1/tickets/$ticketId');
    return TicketDetailModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<List<TimelineEntryModel>> getTicketTimeline(String ticketId) async {
    final response = await dio.get('/api/v1/tickets/$ticketId/timeline');
    final data = response.data as List<dynamic>;
    return data
        .map(
          (json) => TimelineEntryModel.fromJson(json as Map<String, dynamic>),
        )
        .toList();
  }

  @override
  Future<List<TicketCommentModel>> getTicketComments(String ticketId) async {
    final response = await dio.get('/api/v1/tickets/$ticketId/comments');
    final data = response.data as List<dynamic>;
    return data
        .map(
          (json) => TicketCommentModel.fromJson(json as Map<String, dynamic>),
        )
        .toList();
  }

  @override
  Future<TicketCommentModel> addComment(
    String ticketId,
    String comment, {
    bool isInternal = false,
  }) async {
    final response = await dio.post(
      '/api/v1/tickets/$ticketId/comments',
      data: {'comment': comment, 'is_internal': isInternal},
    );
    return TicketCommentModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<void> changeStatus(
    String ticketId,
    String newStatus, {
    String? reason,
  }) async {
    final payload = <String, dynamic>{'status': newStatus};
    if (reason != null && reason.trim().isNotEmpty) {
      payload['reason'] = reason;
    }

    await dio.patch('/api/v1/tickets/$ticketId/status', data: payload);
  }

  @override
  Future<void> startTicket(String ticketId) async {
    await changeStatus(ticketId, 'in_progress');
  }

  @override
  Future<void> closeTicket(
    String ticketId, {
    required String resolution,
    List<String>? evidenceUrls,
    String? signatureUrl,
  }) async {
    // The current backend status endpoint only persists the transition itself.
    // Resolution, evidence and signature are handled from mobile as comments/uploads.
    await dio.patch(
      '/api/v1/tickets/$ticketId/status',
      data: const {'status': 'completed'},
    );
  }

  @override
  Future<TicketStatsModel> getTicketStats() async {
    final response = await dio.get('/api/v1/tickets/stats');
    return TicketStatsModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<String> uploadEvidence(
    String ticketId,
    String filePath,
    String category,
  ) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
      'category': category,
      'related_entity_type': 'tickets',
      'related_entity_id': ticketId,
    });

    final response = await dio.post('/api/v1/storage/upload', data: formData);
    final data = response.data as Map<String, dynamic>;
    return data['storage_url'] as String? ?? data['id'] as String;
  }
}
