import 'package:equatable/equatable.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/entities/role_entity.dart';
import '../../domain/entities/permission_entity.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthState extends Equatable {
  final AuthStatus status;
  final UserEntity? user;
  final List<RoleEntity> roles;
  final List<PermissionEntity> permissions;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.roles = const [],
    this.permissions = const [],
    this.errorMessage,
  });

  AuthState copyWith({
    AuthStatus? status,
    UserEntity? user,
    List<RoleEntity>? roles,
    List<PermissionEntity>? permissions,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      roles: roles ?? this.roles,
      permissions: permissions ?? this.permissions,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, user, roles, permissions, errorMessage];
}
