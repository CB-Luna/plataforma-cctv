import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/entities/role_entity.dart';
import '../../domain/entities/permission_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_datasource.dart';
import '../datasources/auth_remote_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final AuthLocalDataSource localDataSource;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
  });

  @override
  Future<Either<Failure, ({UserEntity user, String token})>> login({
    required String tenantId,
    required String email,
    required String password,
  }) async {
    try {
      final result = await remoteDataSource.login(
        tenantId: tenantId,
        email: email,
        password: password,
      );

      await localDataSource.saveToken(result.token);
      await localDataSource.saveUserId(result.user.id);
      await localDataSource.saveTenantId(result.user.tenantId);
      await localDataSource.setLoggedIn(true);

      return Right((user: result.user, token: result.token));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on AuthException catch (e) {
      return Left(AuthFailure(e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserEntity>> register({
    required String tenantId,
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    try {
      final user = await remoteDataSource.register(
        tenantId: tenantId,
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
      );

      return Right(user);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await remoteDataSource.logout();
      await localDataSource.clearAll();
      return const Right(null);
    } catch (e) {
      await localDataSource.clearAll();
      return const Right(null);
    }
  }

  @override
  Future<
    Either<
      Failure,
      ({
        UserEntity user,
        List<RoleEntity> roles,
        List<PermissionEntity> permissions,
      })
    >
  >
  getCurrentUser() async {
    try {
      final result = await remoteDataSource.getCurrentUser();
      return Right((
        user: result.user,
        roles: result.roles,
        permissions: result.permissions,
      ));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on AuthException catch (e) {
      await localDataSource.clearAll();
      return Left(AuthFailure(e.message));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<bool> isLoggedIn() async {
    return await localDataSource.isLoggedIn();
  }
}
