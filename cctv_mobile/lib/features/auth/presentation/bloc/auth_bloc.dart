import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/company_entity.dart';
import '../../domain/usecases/get_current_user.dart';
import '../../domain/usecases/login.dart';
import '../../domain/usecases/logout.dart';
import '../../domain/usecases/register.dart';
import '../../domain/usecases/save_session.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final Login login;
  final SaveSession saveSession;
  final Register register;
  final Logout logout;
  final GetCurrentUser getCurrentUser;

  AuthBloc({
    required this.login,
    required this.saveSession,
    required this.register,
    required this.logout,
    required this.getCurrentUser,
  }) : super(const AuthState()) {
    on<LoginRequested>(_onLoginRequested);
    on<RegisterRequested>(_onRegisterRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<GetCurrentUserRequested>(_onGetCurrentUserRequested);
    on<CheckAuthStatus>(_onCheckAuthStatus);
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));

    final result = await login(
      LoginParams(
        tenantId: event.tenantId,
        email: event.email,
        password: event.password,
      ),
    );

    await result.fold(
      (failure) async {
        emit(
          state.copyWith(
            status: AuthStatus.error,
            errorMessage: failure.message,
            user: null,
            companies: const [],
            activeCompany: null,
          ),
        );
      },
      (data) async {
        final activeCompany = _resolveActiveCompany(
          data.companies,
          data.user.tenantId,
        );

        if (event.tenantId == null && data.companies.length > 1) {
          emit(
            state.copyWith(
              status: AuthStatus.companySelectionRequired,
              user: data.user,
              companies: data.companies,
              activeCompany: activeCompany,
              errorMessage: null,
            ),
          );
          return;
        }

        await saveSession(
          SaveSessionParams(token: data.token, user: data.user),
        );

        emit(
          state.copyWith(
            status: AuthStatus.authenticated,
            user: data.user,
            companies: data.companies,
            activeCompany: activeCompany,
            errorMessage: null,
          ),
        );
      },
    );
  }

  Future<void> _onRegisterRequested(
    RegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));

    final result = await register(
      RegisterParams(
        tenantId: event.tenantId,
        email: event.email,
        password: event.password,
        firstName: event.firstName,
        lastName: event.lastName,
        phone: event.phone,
      ),
    );

    result.fold(
      (failure) => emit(
        state.copyWith(status: AuthStatus.error, errorMessage: failure.message),
      ),
      (_) => emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: null,
          user: null,
          activeCompany: null,
        ),
      ),
    );
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));

    await logout();

    emit(const AuthState(status: AuthStatus.unauthenticated));
  }

  Future<void> _onGetCurrentUserRequested(
    GetCurrentUserRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));

    final result = await getCurrentUser();

    result.fold(
      (failure) => emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: failure.message,
          user: null,
          companies: const [],
          activeCompany: null,
        ),
      ),
      (data) {
        final activeCompany = _resolveActiveCompany(
          data.companies,
          data.user.tenantId,
        );

        emit(
          state.copyWith(
            status: AuthStatus.authenticated,
            user: data.user,
            roles: data.roles,
            permissions: data.permissions,
            companies: data.companies,
            activeCompany: activeCompany,
            errorMessage: null,
          ),
        );
      },
    );
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));

    final result = await getCurrentUser();

    result.fold(
      (_) => emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          user: null,
          companies: const [],
          activeCompany: null,
          errorMessage: null,
        ),
      ),
      (data) {
        final activeCompany = _resolveActiveCompany(
          data.companies,
          data.user.tenantId,
        );

        emit(
          state.copyWith(
            status: AuthStatus.authenticated,
            user: data.user,
            roles: data.roles,
            permissions: data.permissions,
            companies: data.companies,
            activeCompany: activeCompany,
            errorMessage: null,
          ),
        );
      },
    );
  }

  CompanyEntity? _resolveActiveCompany(
    List<CompanyEntity> companies,
    String tenantId,
  ) {
    for (final company in companies) {
      if (company.id == tenantId) {
        return company;
      }
    }

    if (companies.isEmpty) {
      return null;
    }

    return companies.first;
  }
}
