import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';
import '../entities/role_entity.dart';
import '../entities/permission_entity.dart';
import '../repositories/auth_repository.dart';

class GetCurrentUser {
  final AuthRepository repository;

  GetCurrentUser(this.repository);

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
  call() {
    return repository.getCurrentUser();
  }
}
