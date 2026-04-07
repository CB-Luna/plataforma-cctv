import '../../domain/entities/permission_entity.dart';

class PermissionModel extends PermissionEntity {
  const PermissionModel({
    required super.id,
    required super.code,
    super.description,
    super.module,
    required super.createdAt,
  });

  factory PermissionModel.fromJson(Map<String, dynamic> json) {
    return PermissionModel(
      id: json['id'] as String,
      code: json['code'] as String,
      description: json['description'] as String?,
      module: json['module'] as String?,
      createdAt: json['created_at'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'description': description,
      'module': module,
      'created_at': createdAt,
    };
  }
}
