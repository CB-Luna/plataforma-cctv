import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/user_model.dart';
import '../models/role_model.dart';
import '../models/permission_model.dart';

abstract class AuthRemoteDataSource {
  Future<({UserModel user, String token})> login({
    required String tenantId,
    required String email,
    required String password,
  });

  Future<UserModel> register({
    required String tenantId,
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  });

  Future<void> logout();

  Future<
    ({UserModel user, List<RoleModel> roles, List<PermissionModel> permissions})
  >
  getCurrentUser();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<({UserModel user, String token})> login({
    required String tenantId,
    required String email,
    required String password,
  }) async {
    final response = await apiClient.post(
      ApiConstants.login,
      data: {'tenant_id': tenantId, 'email': email, 'password': password},
    );

    final data = response.data as Map<String, dynamic>;
    final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
    final token = data['access_token'] as String;

    return (user: user, token: token);
  }

  @override
  Future<UserModel> register({
    required String tenantId,
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    final response = await apiClient.post(
      ApiConstants.register,
      data: {
        'tenant_id': tenantId,
        'email': email,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
        'phone': ?phone,
      },
    );

    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<void> logout() async {
    await apiClient.post(ApiConstants.logout);
  }

  @override
  Future<
    ({UserModel user, List<RoleModel> roles, List<PermissionModel> permissions})
  >
  getCurrentUser() async {
    final response = await apiClient.get(ApiConstants.me);
    final data = response.data as Map<String, dynamic>;

    final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);

    final rolesJson = data['roles'] as List<dynamic>? ?? [];
    final roles = rolesJson
        .map((r) => RoleModel.fromJson(r as Map<String, dynamic>))
        .toList();

    final permissionsJson = data['permissions'] as List<dynamic>? ?? [];
    final permissions = permissionsJson
        .map((p) => PermissionModel.fromJson(p as Map<String, dynamic>))
        .toList();

    return (user: user, roles: roles, permissions: permissions);
  }
}
