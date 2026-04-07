import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';
import '../entities/role_entity.dart';
import '../entities/permission_entity.dart';

abstract class AuthRepository {
  Future<Either<Failure, ({UserEntity user, String token})>> login({
    required String tenantId,
    required String email,
    required String password,
  });

  Future<Either<Failure, UserEntity>> register({
    required String tenantId,
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  });

  Future<Either<Failure, void>> logout();

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
  getCurrentUser();

  Future<bool> isLoggedIn();
}
