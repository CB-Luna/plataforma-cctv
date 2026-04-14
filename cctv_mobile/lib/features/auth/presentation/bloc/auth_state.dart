import 'package:equatable/equatable.dart';
import '../../domain/entities/company_entity.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/entities/role_entity.dart';
import '../../domain/entities/permission_entity.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  companySelectionRequired,
  error,
}

const _authStateNoChange = Object();

class AuthState extends Equatable {
  final AuthStatus status;
  final UserEntity? user;
  final List<RoleEntity> roles;
  final List<PermissionEntity> permissions;
  final List<CompanyEntity> companies;
  final CompanyEntity? activeCompany;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.roles = const [],
    this.permissions = const [],
    this.companies = const [],
    this.activeCompany,
    this.errorMessage,
  });

  AuthState copyWith({
    AuthStatus? status,
    Object? user = _authStateNoChange,
    List<RoleEntity>? roles,
    List<PermissionEntity>? permissions,
    List<CompanyEntity>? companies,
    Object? activeCompany = _authStateNoChange,
    Object? errorMessage = _authStateNoChange,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: identical(user, _authStateNoChange) ? this.user : user as UserEntity?,
      roles: roles ?? this.roles,
      permissions: permissions ?? this.permissions,
      companies: companies ?? this.companies,
      activeCompany: identical(activeCompany, _authStateNoChange)
          ? this.activeCompany
          : activeCompany as CompanyEntity?,
      errorMessage: identical(errorMessage, _authStateNoChange)
          ? this.errorMessage
          : errorMessage as String?,
    );
  }

  @override
  List<Object?> get props => [
    status,
    user,
    roles,
    permissions,
    companies,
    activeCompany,
    errorMessage,
  ];
}
