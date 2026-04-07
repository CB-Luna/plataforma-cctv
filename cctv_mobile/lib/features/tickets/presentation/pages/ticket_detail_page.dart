import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:url_launcher/url_launcher.dart';
import '../../domain/entities/ticket_detail.dart';
import '../bloc/tickets_bloc.dart';
import '../bloc/tickets_event.dart';
import '../bloc/tickets_state.dart';
import '../widgets/ticket_status_badge.dart';
import '../widgets/timeline_widget.dart';

class TicketDetailPage extends StatefulWidget {
  final String ticketId;

  const TicketDetailPage({super.key, required this.ticketId});

  @override
  State<TicketDetailPage> createState() => _TicketDetailPageState();
}

class _TicketDetailPageState extends State<TicketDetailPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadTicketData();
  }

  void _loadTicketData() {
    context.read<TicketsBloc>().add(LoadTicketDetail(widget.ticketId));
    context.read<TicketsBloc>().add(LoadTicketTimeline(widget.ticketId));
    context.read<TicketsBloc>().add(LoadTicketComments(widget.ticketId));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return BlocConsumer<TicketsBloc, TicketsState>(
      listener: (context, state) {
        if (state.errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage!),
              backgroundColor: theme.colorScheme.error,
            ),
          );
          context.read<TicketsBloc>().add(const ClearError());
        }
      },
      builder: (context, state) {
        final ticket = state.selectedTicket;

        if (state.status == TicketsStatus.loading && ticket == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        if (ticket == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: Text('Ticket no encontrado')),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(ticket.ticketNumber),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadTicketData,
              ),
            ],
          ),
          body: Column(
            children: [
              _buildHeader(ticket, theme),
              TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'Detalles'),
                  Tab(text: 'Historial'),
                  Tab(text: 'Comentarios'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildDetailsTab(ticket, theme),
                    _buildTimelineTab(state, theme),
                    _buildCommentsTab(state, theme),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: _buildBottomActions(ticket, theme),
        );
      },
    );
  }

  Widget _buildHeader(TicketDetail ticket, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        border: Border(
          bottom: BorderSide(color: theme.colorScheme.outlineVariant),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              TicketStatusBadge(status: ticket.status, large: true),
              const SizedBox(width: 12),
              PriorityBadge(priority: ticket.priority),
              const Spacer(),
              Text(
                ticket.typeLabel,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            ticket.title,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          if (ticket.description != null) ...[
            const SizedBox(height: 8),
            Text(
              ticket.description!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailsTab(TicketDetail ticket, ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSection('Cliente', Icons.business, [
            _buildInfoRow('Nombre', ticket.clientName ?? 'N/A'),
            if (ticket.clientEmail != null)
              _buildInfoRow('Email', ticket.clientEmail!, isLink: true),
            if (ticket.clientPhone != null)
              _buildInfoRow('Teléfono', ticket.clientPhone!, isPhone: true),
          ], theme),
          const SizedBox(height: 16),
          _buildSection('Ubicación', Icons.location_on, [
            _buildInfoRow('Sitio', ticket.siteName ?? 'N/A'),
            if (ticket.fullAddress.isNotEmpty)
              _buildInfoRow('Dirección', ticket.fullAddress),
          ], theme),
          if (ticket.equipmentSerial != null) ...[
            const SizedBox(height: 16),
            _buildSection('Equipo', Icons.videocam, [
              _buildInfoRow('Serial', ticket.equipmentSerial!),
            ], theme),
          ],
          const SizedBox(height: 16),
          _buildSection('Asignación', Icons.person, [
            _buildInfoRow('Técnico', ticket.assignedToName ?? 'Sin asignar'),
            if (ticket.assignedToEmail != null)
              _buildInfoRow('Email', ticket.assignedToEmail!),
            if (ticket.assignedToPhone != null)
              _buildInfoRow('Teléfono', ticket.assignedToPhone!, isPhone: true),
          ], theme),
          const SizedBox(height: 16),
          _buildSection('Tiempos', Icons.schedule, [
            _buildInfoRow(
              'Creado',
              timeago.format(ticket.createdAt, locale: 'es'),
            ),
            if (ticket.startedAt != null)
              _buildInfoRow(
                'Iniciado',
                timeago.format(ticket.startedAt!, locale: 'es'),
              ),
            if (ticket.completedAt != null)
              _buildInfoRow(
                'Completado',
                timeago.format(ticket.completedAt!, locale: 'es'),
              ),
            if (ticket.slaDeadline != null)
              _buildInfoRow(
                'SLA',
                _formatSlaDeadline(ticket.slaDeadline!, ticket.slaMet),
                valueColor: _getSlaColor(ticket.slaDeadline!, ticket.slaMet),
              ),
          ], theme),
          if (ticket.policyId != null || ticket.policyNumber != null) ...[
            const SizedBox(height: 16),
            _buildSection('Póliza', Icons.policy, [
              _buildInfoRow('ID', ticket.policyId ?? 'N/A'),
              _buildInfoRow('Número', ticket.policyNumber ?? 'N/A'),
              _buildInfoRow('Proveedor', ticket.policyVendor ?? 'N/A'),
              _buildInfoRow(
                'Tipo contrato',
                ticket.policyContractType ?? 'N/A',
              ),
              _buildInfoRow(
                'Cobertura',
                _coverageLabel(ticket.coverageStatus ?? 'unknown'),
                valueColor: _coverageColor(ticket.coverageStatus ?? 'unknown'),
              ),
            ], theme),
          ],
          if (ticket.slaStatus != null || ticket.slaPolicyName != null) ...[
            const SizedBox(height: 16),
            _buildSection('SLA', Icons.timer, [
              _buildInfoRow('Política', ticket.slaPolicyName ?? 'N/A'),
              _buildInfoRow(
                'Estado',
                _slaStatusLabel(ticket.slaStatus ?? 'unknown'),
                valueColor: _slaStatusColor(ticket.slaStatus ?? 'unknown'),
              ),
              if (ticket.dueResponseAt != null)
                _buildInfoRow(
                  'Límite respuesta',
                  _formatExactDate(ticket.dueResponseAt!),
                ),
              if (ticket.dueResolutionAt != null)
                _buildInfoRow(
                  'Límite resolución',
                  _formatExactDate(ticket.dueResolutionAt!),
                ),
            ], theme),
          ],
          if (ticket.resolution != null) ...[
            const SizedBox(height: 16),
            _buildSection('Resolución', Icons.check_circle, [
              _buildInfoRow('Descripción', ticket.resolution!),
            ], theme),
          ],
        ],
      ),
    );
  }

  Widget _buildSection(
    String title,
    IconData icon,
    List<Widget> children,
    ThemeData theme,
  ) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value, {
    bool isLink = false,
    bool isPhone = false,
    Color? valueColor,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: isLink || isPhone
                ? GestureDetector(
                    onTap: () =>
                        _launchUrl(isPhone ? 'tel:$value' : 'mailto:$value'),
                    child: Text(
                      value,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontSize: 14,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  )
                : Text(
                    value,
                    style: TextStyle(
                      fontSize: 14,
                      color: valueColor,
                      fontWeight: valueColor != null ? FontWeight.bold : null,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineTab(TicketsState state, ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: TimelineWidget(entries: state.timeline),
    );
  }

  Widget _buildCommentsTab(TicketsState state, ThemeData theme) {
    return Column(
      children: [
        Expanded(
          child: state.comments.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.chat_bubble_outline,
                        size: 48,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Sin comentarios',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.comments.length,
                  itemBuilder: (context, index) {
                    final comment = state.comments[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 16,
                                  backgroundColor:
                                      theme.colorScheme.primaryContainer,
                                  child: Text(
                                    (comment.userName ?? 'U')[0].toUpperCase(),
                                    style: TextStyle(
                                      color:
                                          theme.colorScheme.onPrimaryContainer,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        comment.userName ?? 'Usuario',
                                        style: theme.textTheme.labelLarge
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                      Text(
                                        timeago.format(
                                          comment.createdAt,
                                          locale: 'es',
                                        ),
                                        style: theme.textTheme.labelSmall
                                            ?.copyWith(
                                              color: theme
                                                  .colorScheme
                                                  .onSurfaceVariant,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (comment.isInternal)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.amber.withValues(
                                        alpha: 0.2,
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text(
                                      'Interno',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Colors.amber,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(comment.comment),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            border: Border(
              top: BorderSide(color: theme.colorScheme.outlineVariant),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _commentController,
                  decoration: InputDecoration(
                    hintText: 'Escribe un comentario...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  maxLines: null,
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _sendComment,
                icon: const Icon(Icons.send),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBottomActions(TicketDetail ticket, ThemeData theme) {
    if (ticket.isClosed) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            if (ticket.canStart) ...[
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _startTicket(ticket),
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('Iniciar'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ] else if (ticket.canClose) ...[
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showStatusChangeDialog(ticket),
                  icon: const Icon(Icons.pause),
                  label: const Text('Cambiar Estado'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _goToCloseTicket(ticket),
                  icon: const Icon(Icons.check),
                  label: const Text('Cerrar Ticket'),
                  style: FilledButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _startTicket(TicketDetail ticket) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Iniciar Ticket'),
        content: const Text(
          '¿Estás seguro de que deseas iniciar el trabajo en este ticket?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              this.context.read<TicketsBloc>().add(StartTicket(ticket.id));
            },
            child: const Text('Iniciar'),
          ),
        ],
      ),
    );
  }

  void _showStatusChangeDialog(TicketDetail ticket) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Cambiar Estado',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.hourglass_empty, color: Colors.amber),
              title: const Text('Esperando Partes'),
              onTap: () {
                Navigator.pop(context);
                _changeStatus('pending_parts');
              },
            ),
            ListTile(
              leading: const Icon(Icons.person_outline, color: Colors.orange),
              title: const Text('Esperando Cliente'),
              onTap: () {
                Navigator.pop(context);
                _changeStatus('pending_client');
              },
            ),
            ListTile(
              leading: const Icon(Icons.cancel_outlined, color: Colors.red),
              title: const Text('Cancelar Ticket'),
              onTap: () {
                Navigator.pop(context);
                _showCancelDialog();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _changeStatus(String status) {
    context.read<TicketsBloc>().add(
      ChangeTicketStatus(ticketId: widget.ticketId, newStatus: status),
    );
  }

  void _showCancelDialog() {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancelar Ticket'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Por favor, indica el motivo de la cancelación:'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                hintText: 'Motivo...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Volver'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              this.context.read<TicketsBloc>().add(
                ChangeTicketStatus(
                  ticketId: widget.ticketId,
                  newStatus: 'cancelled',
                  reason: reasonController.text,
                ),
              );
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Cancelar Ticket'),
          ),
        ],
      ),
    );
  }

  void _goToCloseTicket(TicketDetail ticket) {
    context.push('/tickets/${ticket.id}/close');
  }

  void _sendComment() {
    final comment = _commentController.text.trim();
    if (comment.isEmpty) return;

    context.read<TicketsBloc>().add(
      AddComment(ticketId: widget.ticketId, comment: comment),
    );
    _commentController.clear();
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  String _formatExactDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$day/$month/${date.year} $hour:$minute';
  }

  String _coverageLabel(String value) {
    switch (value) {
      case 'covered':
        return 'Cubierto';
      case 'partial':
        return 'Parcial';
      case 'not_covered':
        return 'No cubierto';
      default:
        return 'Sin definir';
    }
  }

  Color _coverageColor(String value) {
    switch (value) {
      case 'covered':
        return Colors.green;
      case 'partial':
        return Colors.orange;
      case 'not_covered':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _slaStatusLabel(String value) {
    switch (value) {
      case 'ok':
        return 'OK';
      case 'at_risk':
        return 'En riesgo';
      case 'breached':
        return 'Vencido';
      default:
        return 'Desconocido';
    }
  }

  Color _slaStatusColor(String value) {
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

  String _formatSlaDeadline(DateTime deadline, bool? slaMet) {
    if (slaMet == true) {
      return 'Cumplido';
    } else if (slaMet == false) {
      return 'Vencido';
    } else if (deadline.isBefore(DateTime.now())) {
      return 'Vencido - ${timeago.format(deadline, locale: 'es')}';
    } else {
      return 'Vence ${timeago.format(deadline, locale: 'es')}';
    }
  }

  Color? _getSlaColor(DateTime deadline, bool? slaMet) {
    if (slaMet == true) return Colors.green;
    if (slaMet == false || deadline.isBefore(DateTime.now())) return Colors.red;
    if (deadline.difference(DateTime.now()).inHours < 4) return Colors.orange;
    return null;
  }
}
