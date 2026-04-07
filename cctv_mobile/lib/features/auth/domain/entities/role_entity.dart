import 'package:equatable/equatable.dart';

class RoleEntity extends Equatable {
  final String id;
  final String? tenantId;
  final String name;
  final String? description;
  final bool isSystem;
  final String createdAt;

  const RoleEntity({
    required this.id,
    this.tenantId,
    required this.name,
    this.description,
    required this.isSystem,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
    id,
    tenantId,
    name,
    description,
    isSystem,
    createdAt,
  ];
}
