import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String tenantId;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final String? avatarUrl;
  final bool isActive;
  final bool emailVerified;
  final String? lastLoginAt;
  final String createdAt;

  const UserEntity({
    required this.id,
    required this.tenantId,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    this.avatarUrl,
    required this.isActive,
    required this.emailVerified,
    this.lastLoginAt,
    required this.createdAt,
  });

  String get fullName => '$firstName $lastName';

  @override
  List<Object?> get props => [
    id,
    tenantId,
    email,
    firstName,
    lastName,
    phone,
    avatarUrl,
    isActive,
    emailVerified,
    lastLoginAt,
    createdAt,
  ];
}
