import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class RegisterParams {
  final String tenantId;
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  final String? phone;

  RegisterParams({
    required this.tenantId,
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
    this.phone,
  });
}

class Register {
  final AuthRepository repository;

  Register(this.repository);

  Future<Either<Failure, UserEntity>> call(RegisterParams params) {
    return repository.register(
      tenantId: params.tenantId,
      email: params.email,
      password: params.password,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
    );
  }
}
