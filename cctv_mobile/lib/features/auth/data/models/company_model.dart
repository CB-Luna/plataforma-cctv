import '../../../../core/utils/media_url_helper.dart';
import '../../domain/entities/company_entity.dart';

class CompanyModel extends CompanyEntity {
  const CompanyModel({
    required super.id,
    required super.name,
    super.slug,
    super.logoUrl,
    super.primaryColor,
    super.secondaryColor,
    super.tertiaryColor,
    required super.isActive,
  });

  factory CompanyModel.fromJson(Map<String, dynamic> json) {
    return CompanyModel(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Empresa',
      slug: json['slug'] as String?,
      logoUrl: MediaUrlHelper.normalize(json['logo_url'] as String?),
      primaryColor: json['primary_color'] as String?,
      secondaryColor: json['secondary_color'] as String?,
      tertiaryColor: json['tertiary_color'] as String?,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}
