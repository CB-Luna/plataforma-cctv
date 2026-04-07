import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/constants/storage_keys.dart';

abstract class AuthLocalDataSource {
  Future<void> saveToken(String token);
  Future<String?> getToken();
  Future<void> saveUserId(String userId);
  Future<String?> getUserId();
  Future<void> saveTenantId(String tenantId);
  Future<String?> getTenantId();
  Future<void> setLoggedIn(bool value);
  Future<bool> isLoggedIn();
  Future<void> clearAll();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  final FlutterSecureStorage secureStorage;
  final SharedPreferences sharedPreferences;

  AuthLocalDataSourceImpl({
    required this.secureStorage,
    required this.sharedPreferences,
  });

  @override
  Future<void> saveToken(String token) async {
    await secureStorage.write(key: StorageKeys.accessToken, value: token);
  }

  @override
  Future<String?> getToken() async {
    return await secureStorage.read(key: StorageKeys.accessToken);
  }

  @override
  Future<void> saveUserId(String userId) async {
    await secureStorage.write(key: StorageKeys.userId, value: userId);
  }

  @override
  Future<String?> getUserId() async {
    return await secureStorage.read(key: StorageKeys.userId);
  }

  @override
  Future<void> saveTenantId(String tenantId) async {
    await secureStorage.write(key: StorageKeys.tenantId, value: tenantId);
  }

  @override
  Future<String?> getTenantId() async {
    return await secureStorage.read(key: StorageKeys.tenantId);
  }

  @override
  Future<void> setLoggedIn(bool value) async {
    await sharedPreferences.setBool(StorageKeys.isLoggedIn, value);
  }

  @override
  Future<bool> isLoggedIn() async {
    return sharedPreferences.getBool(StorageKeys.isLoggedIn) ?? false;
  }

  @override
  Future<void> clearAll() async {
    await secureStorage.delete(key: StorageKeys.accessToken);
    await secureStorage.delete(key: StorageKeys.refreshToken);
    await secureStorage.delete(key: StorageKeys.userId);
    await secureStorage.delete(key: StorageKeys.tenantId);
    await sharedPreferences.remove(StorageKeys.isLoggedIn);
  }
}
