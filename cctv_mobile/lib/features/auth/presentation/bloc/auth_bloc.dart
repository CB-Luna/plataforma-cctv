import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/login.dart';
import '../../domain/usecases/register.dart';
import '../../domain/usecases/logout.dart';
import '../../domain/usecases/get_current_user.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final Login login;
  final Register register;
  final Logout logout;
  final GetCurrentUser getCurrentUser;

  AuthBloc({
    required this.login,
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
    emit(state.copyWith(status: AuthStatus.loading));

    final result = await login(
      LoginParams(
        tenantId: event.tenantId,
        email: event.email,
        password: event.password,
      ),
    );

    result.fold(
      (failure) => emit(
        state.copyWith(status: AuthStatus.error, errorMessage: failure.message),
      ),
      (data) => emit(
        state.copyWith(status: AuthStatus.authenticated, user: data.user),
      ),
    );
  }

  Future<void> _onRegisterRequested(
    RegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));

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
      (user) => emit(state.copyWith(status: AuthStatus.unauthenticated)),
    );
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));

    await logout();

    emit(const AuthState(status: AuthStatus.unauthenticated));
  }

  Future<void> _onGetCurrentUserRequested(
    GetCurrentUserRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));

    final result = await getCurrentUser();

    result.fold(
      (failure) => emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: failure.message,
        ),
      ),
      (data) => emit(
        state.copyWith(
          status: AuthStatus.authenticated,
          user: data.user,
          roles: data.roles,
          permissions: data.permissions,
        ),
      ),
    );
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));

    final result = await getCurrentUser();

    result.fold(
      (failure) => emit(state.copyWith(status: AuthStatus.unauthenticated)),
      (data) => emit(
        state.copyWith(
          status: AuthStatus.authenticated,
          user: data.user,
          roles: data.roles,
          permissions: data.permissions,
        ),
      ),
    );
  }
}
