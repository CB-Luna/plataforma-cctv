import '../../domain/entities/user_entity.dart';
import '../../../../core/utils/media_url_helper.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.tenantId,
    required super.email,
    required super.firstName,
    required super.lastName,
    super.phone,
    super.avatarUrl,
    required super.isActive,
    required super.emailVerified,
    super.lastLoginAt,
    required super.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      email: json['email'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      phone: json['phone'] as String?,
      avatarUrl: MediaUrlHelper.normalize(json['avatar_url'] as String?),
      isActive: json['is_active'] as bool? ?? true,
      emailVerified: json['email_verified'] as bool? ?? false,
      lastLoginAt: json['last_login_at'] as String?,
      createdAt: json['created_at'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tenant_id': tenantId,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      'avatar_url': avatarUrl,
      'is_active': isActive,
      'email_verified': emailVerified,
      'last_login_at': lastLoginAt,
      'created_at': createdAt,
    };
  }
}
