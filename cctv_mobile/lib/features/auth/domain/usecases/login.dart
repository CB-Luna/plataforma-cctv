import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/company_entity.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class LoginParams {
  final String? tenantId;
  final String email;
  final String password;

  LoginParams({
    this.tenantId,
    required this.email,
    required this.password,
  });
}

class Login {
  final AuthRepository repository;

  Login(this.repository);

  Future<
    Either<
      Failure,
      ({UserEntity user, String token, List<CompanyEntity> companies})
    >
  >
  call(
    LoginParams params,
  ) {
    return repository.login(
      tenantId: params.tenantId,
      email: params.email,
      password: params.password,
    );
  }
}
