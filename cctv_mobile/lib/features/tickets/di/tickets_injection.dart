import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import '../data/datasources/ticket_remote_datasource.dart';
import '../data/repositories/ticket_repository_impl.dart';
import '../domain/repositories/ticket_repository.dart';
import '../presentation/bloc/tickets_bloc.dart';

void registerTicketsDependencies(GetIt sl) {
  // BLoC
  sl.registerFactory<TicketsBloc>(() => TicketsBloc(repository: sl()));

  // Repository
  sl.registerLazySingleton<TicketRepository>(
    () => TicketRepositoryImpl(remoteDataSource: sl()),
  );

  // Data sources
  sl.registerLazySingleton<TicketRemoteDataSource>(
    () => TicketRemoteDataSourceImpl(dio: sl<Dio>()),
  );
}
