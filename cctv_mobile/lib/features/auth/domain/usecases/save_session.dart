import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class SaveSessionParams {
  final String token;
  final UserEntity user;

  SaveSessionParams({required this.token, required this.user});
}

class SaveSession {
  final AuthRepository repository;

  SaveSession(this.repository);

  Future<void> call(SaveSessionParams params) {
    return repository.saveSession(token: params.token, user: params.user);
  }
}
