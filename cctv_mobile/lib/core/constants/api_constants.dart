import 'package:flutter/foundation.dart';

class ApiConstants {
  static const String _baseUrlOverride = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );
  static const String _androidEmulatorBaseUrl = 'http://10.0.2.2:8088/api/v1';
  static const String _localBaseUrl = 'http://127.0.0.1:8088/api/v1';

  static String get baseUrl {
    if (_baseUrlOverride.isNotEmpty) {
      return _baseUrlOverride;
    }

    if (kIsWeb) {
      return _localBaseUrl;
    }

    return switch (defaultTargetPlatform) {
      TargetPlatform.android => _androidEmulatorBaseUrl,
      _ => _localBaseUrl,
    };
  }

  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';

  // User endpoints
  static const String users = '/users';

  // Timeouts
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
}
