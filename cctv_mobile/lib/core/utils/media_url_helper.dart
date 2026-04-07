import '../constants/api_constants.dart';

class MediaUrlHelper {
  static String? normalize(String? url) {
    if (url == null || url.isEmpty) return null;

    final trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    final serverBase = ApiConstants.baseUrl.replaceFirst('/api/v1', '');
    if (trimmed.startsWith('/')) {
      return '$serverBase$trimmed';
    }

    return '$serverBase/$trimmed';
  }
}
