import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../../tickets/presentation/bloc/tickets_bloc.dart';
import '../../../tickets/presentation/bloc/tickets_event.dart';
import '../../../tickets/presentation/bloc/tickets_state.dart';
import '../../../tickets/presentation/widgets/ticket_card.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    context.read<AuthBloc>().add(const GetCurrentUserRequested());
    context.read<TicketsBloc>().add(const LoadTicketStats());
    context.read<TicketsBloc>().add(const LoadTickets(refresh: true));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.unauthenticated) {
          context.go('/login');
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('SymTickets CCTV'),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.logout),
                onPressed: () {
                  _showLogoutDialog(context);
                },
              ),
            ],
          ),
          body: IndexedStack(
            index: _currentIndex,
            children: [
              _buildDashboard(context, state),
              _buildTicketsTab(),
              _buildProfileSection(context, state),
            ],
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _currentIndex,
            onDestinationSelected: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.dashboard_outlined),
                selectedIcon: Icon(Icons.dashboard),
                label: 'Inicio',
              ),
              NavigationDestination(
                icon: Icon(Icons.confirmation_number_outlined),
                selectedIcon: Icon(Icons.confirmation_number),
                label: 'Tickets',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outlined),
                selectedIcon: Icon(Icons.person),
                label: 'Perfil',
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDashboard(BuildContext context, AuthState authState) {
    return BlocBuilder<TicketsBloc, TicketsState>(
      builder: (context, ticketsState) {
        final stats = ticketsState.stats;
        final recentTickets = ticketsState.tickets.take(3).toList();

        return RefreshIndicator(
          onRefresh: () async {
            context.read<AuthBloc>().add(const GetCurrentUserRequested());
            context.read<TicketsBloc>().add(const LoadTicketStats());
            context.read<TicketsBloc>().add(const LoadTickets(refresh: true));
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (authState.user != null)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 30,
                            backgroundColor: AppColors.primary,
                            child: Text(
                              authState.user!.firstName[0].toUpperCase(),
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '¡Hola, ${authState.user!.firstName}!',
                                  style: Theme.of(context).textTheme.titleLarge
                                      ?.copyWith(fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  authState.user!.email,
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 24),
                Text(
                  'Resumen de Tickets',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.3,
                  children: [
                    _buildStatCard(
                      context,
                      icon: Icons.confirmation_number,
                      title: 'Activos',
                      value: stats?.activeCount.toString() ?? '0',
                      color: AppColors.info,
                      onTap: () => context.go('/tickets'),
                    ),
                    _buildStatCard(
                      context,
                      icon: Icons.warning_amber,
                      title: 'Urgentes',
                      value: stats?.urgentCount.toString() ?? '0',
                      color: Colors.red,
                      onTap: () => context.go('/tickets'),
                    ),
                    _buildStatCard(
                      context,
                      icon: Icons.play_circle,
                      title: 'En Progreso',
                      value: stats?.inProgressCount.toString() ?? '0',
                      color: Colors.orange,
                      onTap: () => context.go('/tickets'),
                    ),
                    _buildStatCard(
                      context,
                      icon: Icons.check_circle,
                      title: 'Completados',
                      value: stats?.completedCount.toString() ?? '0',
                      color: AppColors.success,
                      onTap: () => context.go('/tickets'),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Tickets Recientes',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.go('/tickets'),
                      child: const Text('Ver todos'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (ticketsState.status == TicketsStatus.loading &&
                    recentTickets.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (ticketsState.errorMessage != null &&
                    recentTickets.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.cloud_off,
                              size: 48,
                              color: AppColors.textSecondary,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              ticketsState.errorMessage!,
                              style: TextStyle(color: AppColors.textSecondary),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            FilledButton.icon(
                              onPressed: () {
                                context.read<TicketsBloc>().add(
                                  const LoadTickets(refresh: true),
                                );
                              },
                              icon: const Icon(Icons.refresh),
                              label: const Text('Reintentar'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else if (recentTickets.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.inbox_outlined,
                              size: 48,
                              color: AppColors.textSecondary,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No hay tickets asignados',
                              style: TextStyle(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  ...recentTickets.map(
                    (ticket) => TicketCard(
                      ticket: ticket,
                      onTap: () => context.push('/tickets/${ticket.id}'),
                    ),
                  ),
                const SizedBox(height: 24),
                Text(
                  'Acciones Rápidas',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                _buildQuickAction(
                  context,
                  icon: Icons.list_alt,
                  title: 'Ver Todos los Tickets',
                  subtitle: 'Lista completa de tickets asignados',
                  onTap: () => context.go('/tickets'),
                ),
                _buildQuickAction(
                  context,
                  icon: Icons.qr_code_scanner,
                  title: 'Escanear Equipo',
                  subtitle: 'Escanear código QR de equipo',
                  onTap: () {},
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String value,
    required Color color,
    VoidCallback? onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 28),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAction(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
          child: Icon(icon, color: AppColors.primary),
        ),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Widget _buildTicketsTab() {
    return BlocBuilder<TicketsBloc, TicketsState>(
      builder: (context, state) {
        if (state.status == TicketsStatus.loading && state.tickets.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (state.tickets.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.inbox_outlined,
                  size: 64,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(height: 16),
                const Text(
                  'No hay tickets asignados',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Los tickets aparecerán aquí cuando te sean asignados',
                  style: TextStyle(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () {
                    context.read<TicketsBloc>().add(
                      const LoadTickets(refresh: true),
                    );
                  },
                  icon: const Icon(Icons.refresh),
                  label: const Text('Actualizar'),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            context.read<TicketsBloc>().add(const LoadTickets(refresh: true));
          },
          child: ListView.builder(
            padding: const EdgeInsets.only(top: 8, bottom: 80),
            itemCount: state.tickets.length,
            itemBuilder: (context, index) {
              final ticket = state.tickets[index];
              return TicketCard(
                ticket: ticket,
                onTap: () => context.push('/tickets/${ticket.id}'),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildProfileSection(BuildContext context, AuthState state) {
    if (state.user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 20),
          CircleAvatar(
            radius: 50,
            backgroundColor: AppColors.primary,
            child: Text(
              state.user!.firstName[0].toUpperCase(),
              style: const TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            state.user!.fullName,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            state.user!.email,
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                _buildProfileItem(
                  icon: Icons.email_outlined,
                  title: 'Correo',
                  value: state.user!.email,
                ),
                const Divider(height: 1),
                _buildProfileItem(
                  icon: Icons.phone_outlined,
                  title: 'Teléfono',
                  value: state.user!.phone ?? 'No registrado',
                ),
                const Divider(height: 1),
                _buildProfileItem(
                  icon: Icons.verified_outlined,
                  title: 'Estado',
                  value: state.user!.isActive ? 'Activo' : 'Inactivo',
                  valueColor: state.user!.isActive
                      ? AppColors.success
                      : AppColors.error,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (state.roles.isNotEmpty)
            Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Roles',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const Divider(height: 1),
                  ...state.roles.map(
                    (role) => ListTile(
                      leading: const Icon(Icons.badge_outlined),
                      title: Text(role.name),
                      subtitle: role.description != null
                          ? Text(role.description!)
                          : null,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildProfileItem({
    required IconData icon,
    required String title,
    required String value,
    Color? valueColor,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary),
      title: Text(title),
      trailing: Text(
        value,
        style: TextStyle(
          color: valueColor ?? AppColors.textPrimary,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    final authBloc = context.read<AuthBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cerrar Sesión'),
        content: const Text('¿Estás seguro de que deseas cerrar sesión?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              authBloc.add(const LogoutRequested());
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Cerrar Sesión'),
          ),
        ],
      ),
    );
  }
}
