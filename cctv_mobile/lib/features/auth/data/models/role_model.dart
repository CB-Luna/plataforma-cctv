import '../../domain/entities/role_entity.dart';

class RoleModel extends RoleEntity {
  const RoleModel({
    required super.id,
    super.tenantId,
    required super.name,
    super.description,
    required super.isSystem,
    required super.createdAt,
  });

  factory RoleModel.fromJson(Map<String, dynamic> json) {
    return RoleModel(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String?,
      name: json['name'] as String,
      description: json['description'] as String?,
      isSystem: json['is_system'] as bool? ?? false,
      createdAt: json['created_at'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tenant_id': tenantId,
      'name': name,
      'description': description,
      'is_system': isSystem,
      'created_at': createdAt,
    };
  }
}
