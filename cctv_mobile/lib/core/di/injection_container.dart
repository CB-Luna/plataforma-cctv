import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../network/api_client.dart';
import '../constants/api_constants.dart';
import '../constants/storage_keys.dart';
import '../../features/auth/data/datasources/auth_local_datasource.dart';
import '../../features/auth/data/datasources/auth_remote_datasource.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/get_current_user.dart';
import '../../features/auth/domain/usecases/login.dart';
import '../../features/auth/domain/usecases/logout.dart';
import '../../features/auth/domain/usecases/register.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/tickets/data/datasources/ticket_remote_datasource.dart';
import '../../features/tickets/data/repositories/ticket_repository_impl.dart';
import '../../features/tickets/domain/repositories/ticket_repository.dart';
import '../../features/tickets/presentation/bloc/tickets_bloc.dart';

final sl = GetIt.instance;

Future<void> init() async {
  // External
  final sharedPreferences = await SharedPreferences.getInstance();
  sl.registerLazySingleton(() => sharedPreferences);

  const secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );
  sl.registerLazySingleton(() => secureStorage);

  // Core
  sl.registerLazySingleton(() => ApiClient(secureStorage: sl()));

  // Data sources
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(apiClient: sl()),
  );
  sl.registerLazySingleton<AuthLocalDataSource>(
    () => AuthLocalDataSourceImpl(secureStorage: sl(), sharedPreferences: sl()),
  );

  // Repositories
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(remoteDataSource: sl(), localDataSource: sl()),
  );

  // Use cases
  sl.registerLazySingleton(() => Login(sl()));
  sl.registerLazySingleton(() => Register(sl()));
  sl.registerLazySingleton(() => Logout(sl()));
  sl.registerLazySingleton(() => GetCurrentUser(sl()));

  // Blocs
  sl.registerFactory(
    () => AuthBloc(
      login: sl(),
      register: sl(),
      logout: sl(),
      getCurrentUser: sl(),
    ),
  );

  // Tickets Feature
  _registerTicketsFeature();
}

void _registerTicketsFeature() {
  // Dio instance for tickets (reuses ApiClient configuration)
  if (!sl.isRegistered<Dio>()) {
    sl.registerLazySingleton<Dio>(() {
      final dio = Dio(
        BaseOptions(
          baseUrl: ApiConstants.baseUrl,
          connectTimeout: const Duration(
            milliseconds: ApiConstants.connectTimeout,
          ),
          receiveTimeout: const Duration(
            milliseconds: ApiConstants.receiveTimeout,
          ),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) async {
            final secureStorage = sl<FlutterSecureStorage>();
            final token = await secureStorage.read(
              key: StorageKeys.accessToken,
            );
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
            handler.next(options);
          },
        ),
      );

      return dio;
    });
  }

  // Data sources
  sl.registerLazySingleton<TicketRemoteDataSource>(
    () => TicketRemoteDataSourceImpl(dio: sl<Dio>()),
  );

  // Repository
  sl.registerLazySingleton<TicketRepository>(
    () => TicketRepositoryImpl(remoteDataSource: sl()),
  );

  // BLoC
  sl.registerFactory<TicketsBloc>(() => TicketsBloc(repository: sl()));
}
