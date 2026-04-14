import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/domain/entities/company_entity.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../../tickets/domain/entities/ticket.dart';
import '../../../tickets/domain/entities/ticket_catalog.dart';
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
      builder: (context, authState) {
        return Scaffold(
          appBar: AppBar(
            title: Text(authState.activeCompany?.name ?? AppConstants.appName),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Notificaciones de campo en preparacion'),
                    ),
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.logout_outlined),
                onPressed: () => _showLogoutDialog(context),
              ),
            ],
          ),
          body: IndexedStack(
            index: _currentIndex,
            children: [
              _buildOperationalHome(authState),
              _buildTicketsTab(),
              _buildProfileSection(authState),
            ],
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _currentIndex,
            onDestinationSelected: (index) => setState(() => _currentIndex = index),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home),
                label: 'Inicio',
              ),
              NavigationDestination(
                icon: Icon(Icons.confirmation_number_outlined),
                selectedIcon: Icon(Icons.confirmation_number),
                label: 'Tickets',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person),
                label: 'Perfil',
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildOperationalHome(AuthState authState) {
    return BlocBuilder<TicketsBloc, TicketsState>(
      builder: (context, ticketsState) {
        final tickets = _relevantTickets(authState, ticketsState.tickets);
        final nextTicket = _nextTicket(tickets);
        final brandColor = _companyColor(authState.activeCompany);

        return RefreshIndicator(
          onRefresh: () async {
            context.read<AuthBloc>().add(const GetCurrentUserRequested());
            context.read<TicketsBloc>().add(const LoadTicketStats());
            context.read<TicketsBloc>().add(const LoadTickets(refresh: true));
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [brandColor, brandColor.withValues(alpha: 0.78)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: Colors.white.withValues(alpha: 0.18),
                      child: Text(
                        authState.activeCompany?.initials ?? 'TM',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            authState.user != null
                                ? 'Hola, ${authState.user!.firstName}'
                                : 'Operacion de campo',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            authState.activeCompany?.name ?? AppConstants.appName,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.88),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _headerPill(_technicianStatus(tickets)),
                              _headerPill('${tickets.length} tickets visibles'),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              _buildNextAction(context, ticketsState, nextTicket),
              const SizedBox(height: 20),
              _buildStatsGrid(context, ticketsState),
              const SizedBox(height: 20),
              Text(
                'Accesos operativos',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.55,
                children: [
                  _actionCard(
                    icon: Icons.confirmation_number_outlined,
                    title: 'Mis tickets',
                    subtitle: 'Abrir la cola operativa',
                    onTap: () => setState(() => _currentIndex = 1),
                  ),
                  _actionCard(
                    icon: Icons.route_outlined,
                    title: 'Ruta',
                    subtitle: nextTicket == null
                        ? 'Sin visita prioritaria'
                        : 'Abrir ticket prioritario',
                    onTap: nextTicket == null
                        ? null
                        : () => context.push('/tickets/${nextTicket.id}'),
                  ),
                  _actionCard(
                    icon: Icons.camera_alt_outlined,
                    title: 'Evidencia',
                    subtitle: nextTicket == null
                        ? 'Sin ticket activo'
                        : 'Ir a captura y cierre',
                    onTap: nextTicket == null
                        ? null
                        : () => context.push('/tickets/${nextTicket.id}'),
                  ),
                  _actionCard(
                    icon: Icons.person_outline,
                    title: 'Perfil',
                    subtitle: 'Revisar empresa y roles',
                    onTap: () => setState(() => _currentIndex = 2),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Cola prioritaria',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _currentIndex = 1),
                    child: const Text('Ver todo'),
                  ),
                ],
              ),
              if (ticketsState.status == TicketsStatus.loading && tickets.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (tickets.isEmpty)
                _emptyCard(
                  icon: Icons.task_alt_outlined,
                  title: 'Sin tickets activos',
                  message: 'Cuando te asignen trabajo aparecera aqui con prioridad y siguiente paso.',
                )
              else
                ...tickets.take(4).map(
                  (ticket) => TicketCard(
                    ticket: ticket,
                    onTap: () => context.push('/tickets/${ticket.id}'),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNextAction(
    BuildContext context,
    TicketsState ticketsState,
    Ticket? nextTicket,
  ) {
    if (ticketsState.status == TicketsStatus.loading && nextTicket == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    if (nextTicket == null) {
      return _emptyCard(
        icon: Icons.flag_outlined,
        title: 'Proxima accion',
        message: 'No hay un ticket activo para atender por el momento.',
      );
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.42,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Proxima accion',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _metricChip(nextTicket.priorityLabel, _priorityColor(nextTicket.priority)),
              _metricChip(nextTicket.statusLabel, _statusColor(nextTicket.status)),
              if (nextTicket.slaStatus != null)
                _metricChip(_slaLabel(nextTicket.slaStatus!), _slaColor(nextTicket.slaStatus!)),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            nextTicket.title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            nextTicket.nextActionLabel,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Text('${nextTicket.clientName ?? "Sin cliente"} - ${nextTicket.siteName ?? "Sin sitio"}'),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => context.push('/tickets/${nextTicket.id}'),
                  icon: const Icon(Icons.visibility_outlined),
                  label: const Text('Ver detalle'),
                ),
              ),
              if (TicketCatalog.canStartStatus(nextTicket.status)) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      context.read<TicketsBloc>().add(StartTicket(nextTicket.id));
                      context.push('/tickets/${nextTicket.id}');
                    },
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: const Text('Iniciar'),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(BuildContext context, TicketsState state) {
    final stats = state.stats;
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.65,
      children: [
        _statCard(context, 'Activos', stats?.activeCount.toString() ?? '0', Colors.blue),
        _statCard(context, 'Criticos', stats?.criticalCount.toString() ?? '0', Colors.red),
        _statCard(context, 'En progreso', stats?.inProgressCount.toString() ?? '0', Colors.orange),
        _statCard(context, 'En espera', stats?.pendingCount.toString() ?? '0', Colors.amber.shade800),
      ],
    );
  }

  Widget _buildTicketsTab() {
    return BlocBuilder<TicketsBloc, TicketsState>(
      builder: (context, state) {
        if (state.status == TicketsStatus.loading && state.tickets.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        return RefreshIndicator(
          onRefresh: () async {
            context.read<TicketsBloc>().add(const LoadTickets(refresh: true));
            context.read<TicketsBloc>().add(const LoadTicketStats());
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
            children: [
              Text(
                'Tickets',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'La cola operativa del tenant vive aqui. Entra al detalle para estado, comentarios, evidencia y cierre.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _metricChip('${state.stats?.criticalCount ?? 0} criticos', Colors.red),
                  _metricChip('${state.stats?.inProgressCount ?? 0} en progreso', Colors.orange),
                  _metricChip('${state.stats?.pendingCount ?? 0} en espera', Colors.amber.shade800),
                ],
              ),
              const SizedBox(height: 16),
              if (state.tickets.isEmpty)
                _emptyCard(
                  icon: Icons.inbox_outlined,
                  title: 'No hay tickets disponibles',
                  message: 'Cuando existan tickets del tenant se mostraran aqui.',
                )
              else
                ...state.tickets.map(
                  (ticket) => TicketCard(
                    ticket: ticket,
                    onTap: () => context.push('/tickets/${ticket.id}'),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProfileSection(AuthState state) {
    if (state.user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 20),
          CircleAvatar(
            radius: 48,
            backgroundColor: AppColors.primary,
            child: Text(
              state.user!.firstName[0].toUpperCase(),
              style: const TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            state.user!.fullName,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            state.user!.email,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 20),
          Card(
            child: Column(
              children: [
                _profileItem(Icons.apartment_outlined, 'Empresa', state.activeCompany?.name ?? 'N/A'),
                const Divider(height: 1),
                _profileItem(Icons.phone_outlined, 'Telefono', state.user!.phone ?? 'No registrado'),
                const Divider(height: 1),
                _profileItem(
                  Icons.verified_outlined,
                  'Estado',
                  state.user!.isActive ? 'Activo' : 'Inactivo',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard(BuildContext context, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.45,
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(Icons.insights_outlined, color: color),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _actionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback? onTap,
  }) {
    return Card(
      elevation: 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                child: Icon(icon, color: AppColors.primary),
              ),
              const Spacer(),
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _emptyCard({
    required IconData icon,
    required String title,
    required String message,
  }) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(icon, size: 40, color: Theme.of(context).colorScheme.onSurfaceVariant),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _profileItem(IconData icon, String title, String value) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary),
      title: Text(title),
      trailing: Text(
        value,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _headerPill(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _metricChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }

  List<Ticket> _relevantTickets(AuthState authState, List<Ticket> tickets) {
    final userId = authState.user?.id;
    final scoped = userId == null
        ? tickets
        : tickets.where((ticket) => ticket.assignedTo == userId).toList();
    final source = scoped.isEmpty ? tickets : scoped;
    final sorted = [...source];
    sorted.sort((a, b) {
      final priority = _priorityRank(a.priority).compareTo(_priorityRank(b.priority));
      if (priority != 0) return priority;
      return b.updatedAt.compareTo(a.updatedAt);
    });
    return sorted;
  }

  Ticket? _nextTicket(List<Ticket> tickets) {
    for (final ticket in tickets) {
      if (!ticket.isClosed) {
        return ticket;
      }
    }
    return tickets.isNotEmpty ? tickets.first : null;
  }

  int _priorityRank(String priority) {
    switch (TicketCatalog.canonicalPriority(priority)) {
      case 'critical':
        return 0;
      case 'high':
        return 1;
      case 'medium':
        return 2;
      case 'low':
        return 3;
      default:
        return 4;
    }
  }

  String _technicianStatus(List<Ticket> tickets) {
    if (tickets.any((ticket) => TicketCatalog.canonicalStatus(ticket.status) == 'in_progress')) {
      return 'En sitio';
    }
    if (tickets.any((ticket) => const {
          'pending_parts',
          'pending_approval',
          'pending_client',
          'on_hold',
        }.contains(TicketCatalog.canonicalStatus(ticket.status)))) {
      return 'En espera';
    }
    if (tickets.isNotEmpty) {
      return 'Disponible con tickets';
    }
    return 'Disponible';
  }

  Color _priorityColor(String value) {
    switch (TicketCatalog.canonicalPriority(value)) {
      case 'critical':
        return Colors.red;
      case 'high':
        return Colors.deepOrange;
      case 'medium':
        return Colors.blue;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Color _statusColor(String value) {
    switch (TicketCatalog.canonicalStatus(value)) {
      case 'open':
        return Colors.blue;
      case 'assigned':
        return Colors.indigo;
      case 'in_progress':
        return Colors.orange;
      case 'pending_parts':
      case 'pending_approval':
      case 'pending_client':
      case 'on_hold':
        return Colors.amber.shade800;
      case 'completed':
      case 'closed':
        return Colors.green;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _slaLabel(String value) {
    switch (value) {
      case 'ok':
        return 'SLA OK';
      case 'at_risk':
        return 'SLA Riesgo';
      case 'breached':
        return 'SLA Vencido';
      default:
        return 'SLA';
    }
  }

  Color _slaColor(String value) {
    switch (value) {
      case 'ok':
        return Colors.green;
      case 'at_risk':
        return Colors.orange;
      case 'breached':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _companyColor(CompanyEntity? company) {
    final raw = company?.primaryColor;
    if (raw == null || raw.isEmpty) return AppColors.primary;
    final sanitized = raw.replaceAll('#', '');
    final normalized = sanitized.length == 6 ? 'FF$sanitized' : sanitized;
    final value = int.tryParse(normalized, radix: 16);
    return value == null ? AppColors.primary : Color(value);
  }

  void _showLogoutDialog(BuildContext context) {
    final authBloc = context.read<AuthBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cerrar sesion'),
        content: const Text('Se cerrara la sesion actual en este dispositivo.'),
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
            child: const Text('Cerrar sesion'),
          ),
        ],
      ),
    );
  }
}
