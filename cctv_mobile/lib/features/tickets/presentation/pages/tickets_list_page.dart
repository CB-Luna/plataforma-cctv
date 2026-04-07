import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
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
  String? _selectedStatus;
  String? _selectedPriority;

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
    if (_isBottom) {
      final state = context.read<TicketsBloc>().state;
      if (!state.hasReachedMax && !state.isLoadingMore) {
        context.read<TicketsBloc>().add(
          LoadTickets(status: _selectedStatus, priority: _selectedPriority),
        );
      }
    }
  }

  bool get _isBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= (maxScroll * 0.9);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Tickets'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterBottomSheet,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<TicketsBloc>().add(
                LoadTickets(
                  refresh: true,
                  status: _selectedStatus,
                  priority: _selectedPriority,
                ),
              );
            },
          ),
        ],
      ),
      body: BlocConsumer<TicketsBloc, TicketsState>(
        listener: (context, state) {
          if (state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: theme.colorScheme.error,
                action: SnackBarAction(
                  label: 'Cerrar',
                  textColor: theme.colorScheme.onError,
                  onPressed: () {
                    context.read<TicketsBloc>().add(const ClearError());
                  },
                ),
              ),
            );
          }
        },
        builder: (context, state) {
          return Column(
            children: [
              if (state.stats != null) _buildStatsBar(state, theme),
              if (_selectedStatus != null || _selectedPriority != null)
                _buildActiveFilters(theme),
              Expanded(child: _buildTicketsList(state, theme)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatsBar(TicketsState state, ThemeData theme) {
    final stats = state.stats!;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        border: Border(
          bottom: BorderSide(color: theme.colorScheme.outlineVariant),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem(
            'Activos',
            stats.activeCount.toString(),
            Colors.blue,
            theme,
          ),
          _buildStatItem(
            'Urgentes',
            stats.urgentCount.toString(),
            Colors.red,
            theme,
          ),
          _buildStatItem(
            'En Progreso',
            stats.inProgressCount.toString(),
            Colors.orange,
            theme,
          ),
          _buildStatItem(
            'Resueltos',
            stats.completedCount.toString(),
            Colors.green,
            theme,
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    String label,
    String value,
    Color color,
    ThemeData theme,
  ) {
    return Column(
      children: [
        Text(
          value,
          style: theme.textTheme.titleLarge?.copyWith(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Widget _buildActiveFilters(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          const Icon(Icons.filter_alt, size: 16),
          const SizedBox(width: 8),
          const Text('Filtros: '),
          if (_selectedStatus != null)
            Chip(
              label: Text(_getStatusLabel(_selectedStatus!)),
              onDeleted: () {
                setState(() => _selectedStatus = null);
                context.read<TicketsBloc>().add(
                  LoadTickets(refresh: true, priority: _selectedPriority),
                );
              },
              deleteIconColor: theme.colorScheme.onSurfaceVariant,
              visualDensity: VisualDensity.compact,
            ),
          if (_selectedPriority != null) ...[
            const SizedBox(width: 8),
            Chip(
              label: Text(_getPriorityLabel(_selectedPriority!)),
              onDeleted: () {
                setState(() => _selectedPriority = null);
                context.read<TicketsBloc>().add(
                  LoadTickets(refresh: true, status: _selectedStatus),
                );
              },
              deleteIconColor: theme.colorScheme.onSurfaceVariant,
              visualDensity: VisualDensity.compact,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTicketsList(TicketsState state, ThemeData theme) {
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
              color: theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              'No hay tickets',
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Los tickets asignados aparecerán aquí',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        context.read<TicketsBloc>().add(
          LoadTickets(
            refresh: true,
            status: _selectedStatus,
            priority: _selectedPriority,
          ),
        );
      },
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.only(top: 8, bottom: 80),
        itemCount: state.hasReachedMax
            ? state.tickets.length
            : state.tickets.length + 1,
        itemBuilder: (context, index) {
          if (index >= state.tickets.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
            );
          }

          final ticket = state.tickets[index];
          return TicketCard(
            ticket: ticket,
            onTap: () {
              context.push('/tickets/${ticket.id}');
            },
          );
        },
      ),
    );
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return DraggableScrollableSheet(
              initialChildSize: 0.5,
              minChildSize: 0.3,
              maxChildSize: 0.8,
              expand: false,
              builder: (context, scrollController) {
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.outlineVariant,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Filtrar Tickets',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Estado',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: [
                          _buildFilterChip(
                            'Todos',
                            _selectedStatus == null,
                            () => setModalState(() => _selectedStatus = null),
                          ),
                          _buildFilterChip(
                            'Abiertos',
                            _selectedStatus == 'open',
                            () => setModalState(() => _selectedStatus = 'open'),
                          ),
                          _buildFilterChip(
                            'En Progreso',
                            _selectedStatus == 'in_progress',
                            () => setModalState(
                              () => _selectedStatus = 'in_progress',
                            ),
                          ),
                          _buildFilterChip(
                            'Pendientes',
                            _selectedStatus == 'pending_parts',
                            () => setModalState(
                              () => _selectedStatus = 'pending_parts',
                            ),
                          ),
                          _buildFilterChip(
                            'Resueltos',
                            _selectedStatus == 'resolved',
                            () => setModalState(
                              () => _selectedStatus = 'resolved',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Prioridad',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: [
                          _buildFilterChip(
                            'Todas',
                            _selectedPriority == null,
                            () => setModalState(() => _selectedPriority = null),
                          ),
                          _buildFilterChip(
                            'Urgente',
                            _selectedPriority == 'urgent',
                            () => setModalState(
                              () => _selectedPriority = 'urgent',
                            ),
                            color: Colors.red,
                          ),
                          _buildFilterChip(
                            'Alta',
                            _selectedPriority == 'high',
                            () =>
                                setModalState(() => _selectedPriority = 'high'),
                            color: Colors.orange,
                          ),
                          _buildFilterChip(
                            'Media',
                            _selectedPriority == 'medium',
                            () => setModalState(
                              () => _selectedPriority = 'medium',
                            ),
                            color: Colors.blue,
                          ),
                          _buildFilterChip(
                            'Baja',
                            _selectedPriority == 'low',
                            () =>
                                setModalState(() => _selectedPriority = 'low'),
                            color: Colors.green,
                          ),
                        ],
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setModalState(() {
                                  _selectedStatus = null;
                                  _selectedPriority = null;
                                });
                              },
                              child: const Text('Limpiar'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: FilledButton(
                              onPressed: () {
                                setState(() {});
                                Navigator.pop(context);
                                this.context.read<TicketsBloc>().add(
                                  LoadTickets(
                                    refresh: true,
                                    status: _selectedStatus,
                                    priority: _selectedPriority,
                                  ),
                                );
                              },
                              child: const Text('Aplicar'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _buildFilterChip(
    String label,
    bool selected,
    VoidCallback onTap, {
    Color? color,
  }) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: color?.withValues(alpha: 0.2),
      checkmarkColor: color,
    );
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'open':
        return 'Abiertos';
      case 'in_progress':
        return 'En Progreso';
      case 'pending_parts':
        return 'Pendientes';
      case 'resolved':
        return 'Resueltos';
      default:
        return status;
    }
  }

  String _getPriorityLabel(String priority) {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority;
    }
  }
}
