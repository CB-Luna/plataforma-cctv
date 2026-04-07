import 'package:equatable/equatable.dart';

class PermissionEntity extends Equatable {
  final String id;
  final String code;
  final String? description;
  final String? module;
  final String createdAt;

  const PermissionEntity({
    required this.id,
    required this.code,
    this.description,
    this.module,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, code, description, module, createdAt];
}
