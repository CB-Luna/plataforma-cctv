import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:signature/signature.dart';
import '../../domain/entities/ticket_catalog.dart';
import '../bloc/tickets_bloc.dart';
import '../bloc/tickets_event.dart';
import '../bloc/tickets_state.dart';

class TicketClosePage extends StatefulWidget {
  final String ticketId;

  const TicketClosePage({super.key, required this.ticketId});

  @override
  State<TicketClosePage> createState() => _TicketClosePageState();
}

class _TicketClosePageState extends State<TicketClosePage> {
  final _formKey = GlobalKey<FormState>();
  final _resolutionController = TextEditingController();
  final _signatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
    exportBackgroundColor: Colors.white,
  );
  final List<XFile> _photos = [];
  final ImagePicker _picker = ImagePicker();

  bool _isUploading = false;
  bool _closeRequested = false;

  @override
  void dispose() {
    _resolutionController.dispose();
    _signatureController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<TicketsBloc, TicketsState>(
      listener: (context, state) {
        final status = state.selectedTicket?.status;
        if (_closeRequested &&
            status != null &&
            TicketCatalog.isClosedStatus(status)) {
          _closeRequested = false;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ticket completado desde movil'),
              backgroundColor: Colors.green,
            ),
          );
          context.go('/tickets/${widget.ticketId}');
        }

        if (state.errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.errorMessage!)),
          );
          context.read<TicketsBloc>().add(const ClearError());
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(title: const Text('Completar ticket')),
          body: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildTicketInfo(state),
                const SizedBox(height: 16),
                _buildNoticeCard(),
                const SizedBox(height: 16),
                _buildResolutionSection(),
                const SizedBox(height: 20),
                _buildEvidenceSection(state),
                const SizedBox(height: 20),
                _buildSignatureSection(),
                const SizedBox(height: 28),
                _buildSubmitButton(state),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTicketInfo(TicketsState state) {
    final ticket = state.selectedTicket;
    if (ticket == null) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              ticket.ticketNumber,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(ticket.title),
            const SizedBox(height: 6),
            Text(
              '${ticket.clientName ?? "Sin cliente"} - ${ticket.siteName ?? "Sin sitio"}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoticeCard() {
    return Card(
      elevation: 0,
      color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(
        alpha: 0.45,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.info_outline,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'La resolucion, evidencia y firma quedaran trazadas desde movil. '
                'El backend actual completa el estado del ticket y la bitacora operativa conserva el detalle.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResolutionSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Resolucion operativa',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _resolutionController,
          maxLines: 5,
          decoration: const InputDecoration(
            hintText: 'Describe el trabajo realizado, diagnostico y resultado final...',
            border: OutlineInputBorder(),
          ),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'Agrega la resolucion del servicio';
            }
            if (value.trim().length < 20) {
              return 'La resolucion debe tener al menos 20 caracteres';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildEvidenceSection(TicketsState state) {
    final uploaded = state.uploadedEvidenceUrls;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Evidencia',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        if (_photos.isEmpty && uploaded.isEmpty)
          Container(
            height: 120,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(
                alpha: 0.35,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                'Todavia no hay fotos cargadas',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          )
        else
          SizedBox(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _photos.length + uploaded.length,
              itemBuilder: (context, index) {
                if (index < _photos.length) {
                  final photo = _photos[index];
                  return Container(
                    width: 120,
                    margin: const EdgeInsets.only(right: 12),
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Image.file(File(photo.path), fit: BoxFit.cover),
                  );
                }

                final url = uploaded[index - _photos.length];
                return Container(
                  width: 120,
                  margin: const EdgeInsets.only(right: 12),
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Image.network(
                    url,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        const Center(child: Icon(Icons.broken_image_outlined)),
                  ),
                );
              },
            ),
          ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _isUploading ? null : _takePhoto,
                icon: const Icon(Icons.camera_alt_outlined),
                label: const Text('Tomar foto'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _isUploading ? null : _pickFromGallery,
                icon: const Icon(Icons.photo_library_outlined),
                label: const Text('Galeria'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSignatureSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Firma de conformidad',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          height: 200,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: Signature(
              controller: _signatureController,
              backgroundColor: Colors.white,
            ),
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton.icon(
            onPressed: () {
              _signatureController.clear();
              setState(() {});
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Limpiar'),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton(TicketsState state) {
    final isBusy = state.status == TicketsStatus.loading || _isUploading;

    return FilledButton.icon(
      onPressed: isBusy ? null : _submitClose,
      icon: isBusy
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : const Icon(Icons.task_alt_outlined),
      label: Text(isBusy ? 'Procesando...' : 'Completar ticket'),
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
      ),
    );
  }

  Future<void> _takePhoto() async {
    final photo = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );
    if (photo == null) {
      return;
    }

    setState(() => _photos.add(photo));
    await _uploadFile(photo.path, 'ticket_evidence');
  }

  Future<void> _pickFromGallery() async {
    final photos = await _picker.pickMultiImage(imageQuality: 80);
    if (photos.isEmpty) {
      return;
    }

    setState(() => _photos.addAll(photos));
    for (final photo in photos) {
      await _uploadFile(photo.path, 'ticket_evidence');
    }
  }

  Future<void> _uploadFile(String filePath, String category) async {
    final bloc = context.read<TicketsBloc>();
    final previousCount = bloc.state.uploadedEvidenceUrls.length;

    setState(() => _isUploading = true);
    bloc.add(
      UploadEvidence(
        ticketId: widget.ticketId,
        filePath: filePath,
        category: category,
      ),
    );

    try {
      await bloc.stream.firstWhere(
        (state) =>
            state.uploadedEvidenceUrls.length > previousCount ||
            state.errorMessage != null,
      ).timeout(const Duration(seconds: 30));
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  Future<String?> _saveSignature() async {
    if (_signatureController.isEmpty) {
      return null;
    }

    final data = await _signatureController.toPngBytes();
    if (data == null) {
      return null;
    }

    final tempDir = await getTemporaryDirectory();
    final file = File(
      '${tempDir.path}/signature_${DateTime.now().millisecondsSinceEpoch}.png',
    );
    await file.writeAsBytes(data);
    if (!mounted) {
      return null;
    }

    final bloc = context.read<TicketsBloc>();
    final previousCount = bloc.state.uploadedEvidenceUrls.length;

    setState(() => _isUploading = true);
    bloc.add(
      UploadEvidence(
        ticketId: widget.ticketId,
        filePath: file.path,
        category: 'ticket_signature',
      ),
    );

    try {
      final nextState = await bloc.stream.firstWhere(
        (state) =>
            state.uploadedEvidenceUrls.length > previousCount ||
            state.errorMessage != null,
      ).timeout(const Duration(seconds: 30));

      if (nextState.uploadedEvidenceUrls.length > previousCount) {
        return nextState.uploadedEvidenceUrls.last;
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }

    return null;
  }

  Future<void> _submitClose() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final bloc = context.read<TicketsBloc>();
    final signatureUrl = await _saveSignature();
    if (!mounted) {
      return;
    }
    final evidenceUrls = bloc.state.uploadedEvidenceUrls;
    final resolution = _resolutionController.text.trim();

    final previousComments = bloc.state.comments.length;
    bloc.add(
      AddComment(
        ticketId: widget.ticketId,
        isInternal: true,
        comment: _buildOperationalComment(
          resolution: resolution,
          evidenceCount: evidenceUrls.length,
          signatureUrl: signatureUrl,
        ),
      ),
    );

    try {
      await bloc.stream.firstWhere(
        (state) => state.comments.length > previousComments || state.errorMessage != null,
      ).timeout(const Duration(seconds: 20));
    } catch (_) {
      // Keep going: status completion is still valuable even if comment ack times out.
    }

    _closeRequested = true;
    bloc.add(
      CloseTicket(
        ticketId: widget.ticketId,
        resolution: resolution,
        evidenceUrls: evidenceUrls.isNotEmpty ? evidenceUrls : null,
        signatureUrl: signatureUrl,
      ),
    );
  }

  String _buildOperationalComment({
    required String resolution,
    required int evidenceCount,
    required String? signatureUrl,
  }) {
    final lines = <String>[
      'Cierre operativo movil',
      'Resolucion: $resolution',
      'Evidencias cargadas: $evidenceCount',
      'Firma cargada: ${signatureUrl != null ? "si" : "no"}',
    ];
    return lines.join('\n');
  }
}
