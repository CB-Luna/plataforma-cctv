import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class LoginRequested extends AuthEvent {
  final String tenantId;
  final String email;
  final String password;

  const LoginRequested({
    required this.tenantId,
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [tenantId, email, password];
}

class RegisterRequested extends AuthEvent {
  final String tenantId;
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  final String? phone;

  const RegisterRequested({
    required this.tenantId,
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
    this.phone,
  });

  @override
  List<Object?> get props => [
    tenantId,
    email,
    password,
    firstName,
    lastName,
    phone,
  ];
}

class LogoutRequested extends AuthEvent {
  const LogoutRequested();
}

class CheckAuthStatus extends AuthEvent {
  const CheckAuthStatus();
}

class GetCurrentUserRequested extends AuthEvent {
  const GetCurrentUserRequested();
}
