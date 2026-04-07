import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../di/injection_container.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/tickets/presentation/bloc/tickets_bloc.dart';
import '../../features/tickets/presentation/pages/tickets_list_page.dart';
import '../../features/tickets/presentation/pages/ticket_detail_page.dart';
import '../../features/tickets/presentation/pages/ticket_close_page.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => BlocProvider(
          create: (_) => sl<AuthBloc>(),
          child: const LoginPage(),
        ),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => BlocProvider.value(
          value: BlocProvider.of<AuthBloc>(context, listen: false),
          child: const RegisterPage(),
        ),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => MultiBlocProvider(
          providers: [
            BlocProvider(create: (_) => sl<AuthBloc>()),
            BlocProvider(create: (_) => sl<TicketsBloc>()),
          ],
          child: const HomePage(),
        ),
      ),
      GoRoute(
        path: '/tickets',
        builder: (context, state) => BlocProvider(
          create: (_) => sl<TicketsBloc>(),
          child: const TicketsListPage(),
        ),
      ),
      GoRoute(
        path: '/tickets/:id',
        builder: (context, state) {
          final ticketId = state.pathParameters['id']!;
          return BlocProvider(
            create: (_) => sl<TicketsBloc>(),
            child: TicketDetailPage(ticketId: ticketId),
          );
        },
      ),
      GoRoute(
        path: '/tickets/:id/close',
        builder: (context, state) {
          final ticketId = state.pathParameters['id']!;
          return BlocProvider(
            create: (_) => sl<TicketsBloc>(),
            child: TicketClosePage(ticketId: ticketId),
          );
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Página no encontrada: ${state.uri}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/login'),
              child: const Text('Ir al inicio'),
            ),
          ],
        ),
      ),
    ),
  );
}
