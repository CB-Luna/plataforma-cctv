# SymTickets CCTV - App Móvil

Aplicación móvil Flutter para el sistema de gestión de tickets CCTV.

## Arquitectura

La aplicación sigue **Clean Architecture** con las siguientes capas:

```
lib/
├── core/                    # Funcionalidades compartidas
│   ├── constants/           # Constantes de la app
│   ├── di/                  # Inyección de dependencias (GetIt)
│   ├── error/               # Manejo de errores y excepciones
│   ├── network/             # Cliente HTTP (Dio)
│   ├── router/              # Navegación (GoRouter)
│   └── theme/               # Tema y colores
│
└── features/                # Módulos de la app
    ├── auth/                # Autenticación
    │   ├── data/            # Capa de datos
    │   │   ├── datasources/ # Fuentes de datos (remote/local)
    │   │   ├── models/      # Modelos de datos
    │   │   └── repositories/# Implementación de repositorios
    │   ├── domain/          # Capa de dominio
    │   │   ├── entities/    # Entidades de negocio
    │   │   ├── repositories/# Contratos de repositorios
    │   │   └── usecases/    # Casos de uso
    │   └── presentation/    # Capa de presentación
    │       ├── bloc/        # BLoC (estado)
    │       └── pages/       # Pantallas
    │
    └── home/                # Pantalla principal
        └── presentation/
            └── pages/
```

## Dependencias Principales

- **flutter_bloc**: Gestión de estado
- **get_it**: Inyección de dependencias
- **dio**: Cliente HTTP
- **go_router**: Navegación
- **flutter_secure_storage**: Almacenamiento seguro de tokens
- **dartz**: Programación funcional (Either)
- **equatable**: Comparación de objetos

## Configuración

### 1. URL del Servidor

Editar `lib/core/constants/api_constants.dart`:

```dart
class ApiConstants {
  static const String baseUrl = 'http://TU_IP:8080/api/v1';
  // ...
}
```

### 2. Tenant ID

Editar `lib/core/constants/app_constants.dart`:

```dart
class AppConstants {
  static const String defaultTenantId = 'TU_TENANT_ID';
  // ...
}
```

## Ejecución

```bash
# Obtener dependencias
flutter pub get

# Ejecutar en modo debug
flutter run

# Ejecutar en iOS
flutter run -d ios

# Ejecutar en Android
flutter run -d android

# Analizar código
flutter analyze

# Build para producción
flutter build apk --release  # Android
flutter build ios --release  # iOS
```

## Endpoints del Servidor Go

La app se conecta a los siguientes endpoints:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/register` | Registrar usuario |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/me` | Obtener usuario actual |

## Funcionalidades

- [x] Login con email y contraseña
- [x] Registro de nuevos usuarios
- [x] Logout
- [x] Perfil de usuario con roles
- [x] Dashboard con resumen
- [ ] Gestión de tickets (próximamente)
- [ ] Escaneo de equipos QR (próximamente)
