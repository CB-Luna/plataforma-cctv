import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../domain/entities/ticket.dart';
import '../../domain/entities/ticket_catalog.dart';
import '../bloc/tickets_bloc.dart';
import '../bloc/tickets_event.dart';
import '../bloc/tickets_state.dart';
import '../widgets/ticket_card.dart';

class TicketsListPage extends StatefulWidget {
  const TicketsListPage({super.key});

  @override
  State<TicketsListPage> createState() => _TicketsListPageState();
}

class _TicketsListPageState extends State<TicketsListPage> {
  final ScrollController _scrollController = ScrollController();
  String _queueView = 'all';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    context.read<TicketsBloc>().add(const LoadTickets(refresh: true));
    context.read<TicketsBloc>().add(const LoadTicketStats());
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) {
      return;
    }

    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    if (currentScroll >= (maxScroll * 0.9)) {
      final state = context.read<TicketsBloc>().state;
      if (!state.hasReachedMax && !state.isLoadingMore) {
        context.read<TicketsBloc>().add(const LoadTickets());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cola operativa'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<TicketsBloc>().add(const LoadTickets(refresh: true));
              context.read<TicketsBloc>().add(const LoadTicketStats());
            },
          ),
        ],
      ),
      body: BlocConsumer<TicketsBloc, TicketsState>(
        listener: (context, state) {
          if (state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.errorMessage!)),
            );
            context.read<TicketsBloc>().add(const ClearError());
          }
        },
        builder: (context, state) {
          final filteredTickets = _filterTickets(state.tickets);

          if (state.status == TicketsStatus.loading && state.tickets.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<TicketsBloc>().add(const LoadTickets(refresh: true));
              context.read<TicketsBloc>().add(const LoadTicketStats());
            },
            child: ListView(
              controller: _scrollController,
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
                  'Prioriza lo critico, revisa riesgo SLA y entra al detalle para ejecutar trabajo de campo.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                _buildStatsRow(state),
                const SizedBox(height: 16),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _queueChip('all', 'Todos'),
                      _queueChip('critical', 'Criticos'),
                      _queueChip('active', 'En curso'),
                      _queueChip('pending', 'En espera'),
                      _queueChip('completed', 'Completados'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (filteredTickets.isEmpty)
                  Card(
                    elevation: 0,
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Icon(
                            Icons.inbox_outlined,
                            size: 40,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No hay tickets para este filtro',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Cambia de vista o actualiza la cola para ver nuevos tickets.',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ...filteredTickets.map(
                    (ticket) => TicketCard(
                      ticket: ticket,
                      onTap: () => context.push('/tickets/${ticket.id}'),
                    ),
                  ),
                if (!state.hasReachedMax)
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatsRow(TicketsState state) {
    final stats = state.stats;

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _statPill('Activos ${stats?.activeCount ?? 0}', Colors.blue),
        _statPill('Criticos ${stats?.criticalCount ?? 0}', Colors.red),
        _statPill('En progreso ${stats?.inProgressCount ?? 0}', Colors.orange),
        _statPill('En espera ${stats?.pendingCount ?? 0}', Colors.amber.shade800),
      ],
    );
  }

  Widget _queueChip(String view, String label) {
    final selected = _queueView == view;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => setState(() => _queueView = view),
      ),
    );
  }

  Widget _statPill(String label, Color color) {
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

  List<Ticket> _filterTickets(List<Ticket> tickets) {
    switch (_queueView) {
      case 'critical':
        return tickets
            .where((ticket) => TicketCatalog.canonicalPriority(ticket.priority) == 'critical')
            .toList();
      case 'active':
        return tickets.where((ticket) {
          final status = TicketCatalog.canonicalStatus(ticket.status);
          return status == 'assigned' || status == 'in_progress';
        }).toList();
      case 'pending':
        return tickets.where((ticket) {
          final status = TicketCatalog.canonicalStatus(ticket.status);
          return status == 'pending_parts' ||
              status == 'pending_approval' ||
              status == 'pending_client' ||
              status == 'on_hold';
        }).toList();
      case 'completed':
        return tickets
            .where((ticket) => TicketCatalog.isClosedStatus(ticket.status))
            .toList();
      default:
        return tickets;
    }
  }
}
