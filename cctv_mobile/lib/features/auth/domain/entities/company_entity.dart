import 'package:equatable/equatable.dart';

class CompanyEntity extends Equatable {
  final String id;
  final String name;
  final String? slug;
  final String? logoUrl;
  final String? primaryColor;
  final String? secondaryColor;
  final String? tertiaryColor;
  final bool isActive;

  const CompanyEntity({
    required this.id,
    required this.name,
    this.slug,
    this.logoUrl,
    this.primaryColor,
    this.secondaryColor,
    this.tertiaryColor,
    required this.isActive,
  });

  String get initials {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return 'TM';

    final parts = trimmed.split(RegExp(r'\s+'));
    if (parts.length == 1) {
      return parts.first.substring(0, parts.first.length >= 2 ? 2 : 1)
          .toUpperCase();
    }

    return '${parts.first[0]}${parts[1][0]}'.toUpperCase();
  }

  @override
  List<Object?> get props => [
    id,
    name,
    slug,
    logoUrl,
    primaryColor,
    secondaryColor,
    tertiaryColor,
    isActive,
  ];
}
