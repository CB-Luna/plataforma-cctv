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
  late final TabController _tabController;
  final TextEditingController _commentController = TextEditingController();
  bool _isInternalComment = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadTicketData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  void _loadTicketData() {
    context.read<TicketsBloc>().add(LoadTicketDetail(widget.ticketId));
    context.read<TicketsBloc>().add(LoadTicketTimeline(widget.ticketId));
    context.read<TicketsBloc>().add(LoadTicketComments(widget.ticketId));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<TicketsBloc, TicketsState>(
      listener: (context, state) {
        if (state.errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.errorMessage!)),
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
              _buildHeader(ticket),
              TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'Resumen'),
                  Tab(text: 'Bitacora'),
                  Tab(text: 'Comentarios'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildSummaryTab(ticket),
                    _buildTimelineTab(state),
                    _buildCommentsTab(state),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: _buildBottomActions(ticket),
        );
      },
    );
  }

  Widget _buildHeader(TicketDetail ticket) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.35,
        ),
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).colorScheme.outlineVariant,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              TicketStatusBadge(status: ticket.status, large: true),
              PriorityBadge(priority: ticket.priority),
              if (ticket.slaStatus != null)
                _tag(_slaLabel(ticket.slaStatus!), _slaColor(ticket.slaStatus!)),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            ticket.title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            ticket.nextActionLabel,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            '${ticket.clientName ?? "Sin cliente"} - ${ticket.siteName ?? "Sin sitio"}',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryTab(TicketDetail ticket) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionCard(
          title: 'Resumen operativo',
          icon: Icons.assignment_outlined,
          children: [
            _infoRow('Tipo', ticket.typeLabel),
            _infoRow('Prioridad', ticket.priorityLabel),
            _infoRow('Estado', ticket.statusLabel),
            _infoRow('Siguiente paso', ticket.nextActionLabel),
            if (ticket.description != null && ticket.description!.isNotEmpty)
              _infoRow('Descripcion', ticket.description!),
          ],
        ),
        const SizedBox(height: 16),
        _sectionCard(
          title: 'Ubicacion',
          icon: Icons.location_on_outlined,
          children: [
            _infoRow('Sitio', ticket.siteName ?? 'No disponible'),
            _infoRow('Direccion', ticket.fullAddress.isEmpty ? 'No disponible' : ticket.fullAddress),
            if (ticket.fullAddress.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: OutlinedButton.icon(
                    onPressed: () => _openExternalMap(ticket.fullAddress),
                    icon: const Icon(Icons.route_outlined),
                    label: const Text('Abrir ruta'),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        _sectionCard(
          title: 'Equipo y asignacion',
          icon: Icons.build_circle_outlined,
          children: [
            _infoRow('Serial', ticket.equipmentSerial ?? 'No disponible'),
            _infoRow('Tecnico', ticket.assignedToName ?? 'Sin asignar'),
            if (ticket.assignedToPhone != null)
              _linkRow('Llamar tecnico', ticket.assignedToPhone!, 'tel:${ticket.assignedToPhone!}'),
            if (ticket.assignedToEmail != null)
              _linkRow('Email tecnico', ticket.assignedToEmail!, 'mailto:${ticket.assignedToEmail!}'),
          ],
        ),
        const SizedBox(height: 16),
        _sectionCard(
          title: 'Cliente y contacto',
          icon: Icons.support_agent_outlined,
          children: [
            _infoRow('Cliente', ticket.clientName ?? 'No disponible'),
            if (ticket.clientPhone != null)
              _linkRow('Telefono', ticket.clientPhone!, 'tel:${ticket.clientPhone!}'),
            if (ticket.clientEmail != null)
              _linkRow('Email', ticket.clientEmail!, 'mailto:${ticket.clientEmail!}'),
            if (ticket.reportedByName != null)
              _infoRow('Reportado por', ticket.reportedByName!),
          ],
        ),
        const SizedBox(height: 16),
        _sectionCard(
          title: 'SLA y cobertura',
          icon: Icons.timer_outlined,
          children: [
            if (ticket.slaPolicyName != null)
              _infoRow('Politica SLA', ticket.slaPolicyName!),
            if (ticket.slaStatus != null)
              _infoRow('Estado SLA', _slaLabel(ticket.slaStatus!)),
            if (ticket.slaDeadline != null)
              _infoRow('Vencimiento', _formatExactDate(ticket.slaDeadline!)),
            if (ticket.coverageStatus != null)
              _infoRow('Cobertura', _coverageLabel(ticket.coverageStatus!)),
            if (ticket.policyNumber != null)
              _infoRow('Poliza', ticket.policyNumber!),
          ],
        ),
        if (ticket.resolution != null && ticket.resolution!.isNotEmpty) ...[
          const SizedBox(height: 16),
          _sectionCard(
            title: 'Resolucion registrada',
            icon: Icons.task_alt_outlined,
            children: [_infoRow('Detalle', ticket.resolution!)],
          ),
        ],
      ],
    );
  }

  Widget _sectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
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

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Widget _linkRow(String label, String value, String url) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => _launchUrl(url),
              child: Text(
                value,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineTab(TicketsState state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: TimelineWidget(entries: state.timeline),
    );
  }

  Widget _buildCommentsTab(TicketsState state) {
    return Column(
      children: [
        Expanded(
          child: state.comments.isEmpty
              ? Center(
                  child: Text(
                    'Sin comentarios',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.comments.length,
                  itemBuilder: (context, index) {
                    final comment = state.comments[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      elevation: 0,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    comment.userName ?? 'Usuario',
                                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                if (comment.isInternal)
                                  _tag('Interno', Colors.amber.shade800),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              timeago.format(comment.createdAt, locale: 'es'),
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
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
            color: Theme.of(context).colorScheme.surface,
            border: Border(
              top: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
            ),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  FilterChip(
                    label: const Text('Comentario interno'),
                    selected: _isInternalComment,
                    onSelected: (value) => setState(() => _isInternalComment = value),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      decoration: InputDecoration(
                        hintText: 'Escribe un comentario operativo...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
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
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBottomActions(TicketDetail ticket) {
    if (ticket.isClosed) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            if (ticket.canStart)
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _startTicket(ticket),
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('Iniciar'),
                ),
              )
            else ...[
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showStatusChangeDialog(ticket),
                  icon: const Icon(Icons.sync_alt_outlined),
                  label: const Text('Estado'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: ticket.canClose ? () => context.push('/tickets/${ticket.id}/close') : null,
                  icon: const Icon(Icons.task_alt_outlined),
                  label: const Text('Completar'),
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
      builder: (dialogContext) => AlertDialog(
        title: const Text('Iniciar ticket'),
        content: const Text('Se marcara el ticket como en progreso.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.read<TicketsBloc>().add(StartTicket(ticket.id));
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
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Actualizar estado',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.precision_manufacturing_outlined),
                title: const Text('Esperando partes'),
                onTap: () {
                  Navigator.pop(context);
                  _changeStatus('pending_parts');
                },
              ),
              ListTile(
                leading: const Icon(Icons.approval_outlined),
                title: const Text('Esperando autorizacion'),
                onTap: () {
                  Navigator.pop(context);
                  _changeStatus('pending_approval');
                },
              ),
              ListTile(
                leading: const Icon(Icons.pause_circle_outline),
                title: const Text('En espera'),
                onTap: () {
                  Navigator.pop(context);
                  _changeStatus('on_hold');
                },
              ),
              ListTile(
                leading: const Icon(Icons.cancel_outlined, color: Colors.red),
                title: const Text('Cancelar ticket'),
                onTap: () {
                  Navigator.pop(context);
                  _showCancelDialog();
                },
              ),
            ],
          ),
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
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cancelar ticket'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Indica el motivo de la cancelacion.'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Motivo...',
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Volver'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.read<TicketsBloc>().add(
                ChangeTicketStatus(
                  ticketId: widget.ticketId,
                  newStatus: 'cancelled',
                  reason: reasonController.text.trim(),
                ),
              );
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Cancelar ticket'),
          ),
        ],
      ),
    );
  }

  void _sendComment() {
    final comment = _commentController.text.trim();
    if (comment.isEmpty) {
      return;
    }

    context.read<TicketsBloc>().add(
      AddComment(
        ticketId: widget.ticketId,
        comment: comment,
        isInternal: _isInternalComment,
      ),
    );
    _commentController.clear();
    setState(() => _isInternalComment = false);
  }

  Widget _tag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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

  Future<void> _openExternalMap(String address) async {
    final encoded = Uri.encodeComponent(address);
    await _launchUrl('https://www.google.com/maps/search/?api=1&query=$encoded');
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
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

  String _slaLabel(String value) {
    switch (value) {
      case 'ok':
        return 'OK';
      case 'at_risk':
        return 'En riesgo';
      case 'breached':
        return 'Vencido';
      default:
        return 'Sin definir';
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
}
