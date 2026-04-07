import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:signature/signature.dart';
import 'package:path_provider/path_provider.dart';
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
  String? _signatureUrl;

  @override
  void dispose() {
    _resolutionController.dispose();
    _signatureController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return BlocConsumer<TicketsBloc, TicketsState>(
      listener: (context, state) {
        if (state.status == TicketsStatus.loaded &&
            state.selectedTicket?.status == 'resolved') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ticket cerrado exitosamente'),
              backgroundColor: Colors.green,
            ),
          );
          context.go('/tickets');
        }

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
        return Scaffold(
          appBar: AppBar(title: const Text('Cerrar Ticket')),
          body: Form(
            key: _formKey,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTicketInfo(state, theme),
                  const SizedBox(height: 24),
                  _buildResolutionSection(theme),
                  const SizedBox(height: 24),
                  _buildEvidenceSection(state, theme),
                  const SizedBox(height: 24),
                  _buildSignatureSection(theme),
                  const SizedBox(height: 32),
                  _buildSubmitButton(state, theme),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildTicketInfo(TicketsState state, ThemeData theme) {
    final ticket = state.selectedTicket;
    if (ticket == null) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.confirmation_number,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  ticket.ticketNumber,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(ticket.title, style: theme.textTheme.bodyLarge),
            const SizedBox(height: 4),
            Text(
              '${ticket.clientName ?? "N/A"} - ${ticket.siteName ?? "N/A"}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResolutionSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.description, color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            Text(
              'Resolución',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const Text(' *', style: TextStyle(color: Colors.red)),
          ],
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _resolutionController,
          decoration: InputDecoration(
            hintText: 'Describe el trabajo realizado y la solución aplicada...',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            filled: true,
          ),
          maxLines: 5,
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'Por favor describe la resolución del ticket';
            }
            if (value.trim().length < 20) {
              return 'La descripción debe tener al menos 20 caracteres';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildEvidenceSection(TicketsState state, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.photo_camera, color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            Text(
              'Evidencia Fotográfica',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_photos.isEmpty && state.uploadedEvidenceUrls.isEmpty)
          _buildEmptyPhotos(theme)
        else
          _buildPhotoGrid(state, theme),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _isUploading ? null : _takePhoto,
                icon: const Icon(Icons.camera_alt),
                label: const Text('Tomar Foto'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _isUploading ? null : _pickFromGallery,
                icon: const Icon(Icons.photo_library),
                label: const Text('Galería'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildEmptyPhotos(ThemeData theme) {
    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.outlineVariant,
          style: BorderStyle.solid,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.add_photo_alternate_outlined,
              size: 40,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 8),
            Text(
              'Agrega fotos de evidencia',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoGrid(TicketsState state, ThemeData theme) {
    final allPhotos = [
      ..._photos.map((p) => {'type': 'local', 'file': p}),
      ...state.uploadedEvidenceUrls.map((u) => {'type': 'url', 'url': u}),
    ];

    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: allPhotos.length,
        itemBuilder: (context, index) {
          final photo = allPhotos[index];

          return Container(
            width: 120,
            height: 120,
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: theme.colorScheme.outlineVariant),
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(11),
                  child: photo['type'] == 'local'
                      ? Image.file(
                          File((photo['file'] as XFile).path),
                          fit: BoxFit.cover,
                        )
                      : Image.network(
                          photo['url'] as String,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              const Center(child: Icon(Icons.broken_image)),
                        ),
                ),
                if (photo['type'] == 'local')
                  Positioned(
                    top: 4,
                    right: 4,
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _photos.removeAt(index);
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close,
                          size: 16,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                if (_isUploading && photo['type'] == 'local')
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Center(
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSignatureSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.draw, color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            Text(
              'Firma del Cliente',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          height: 200,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(11),
            child: Signature(
              controller: _signatureController,
              backgroundColor: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            TextButton.icon(
              onPressed: () {
                _signatureController.clear();
                setState(() => _signatureUrl = null);
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Limpiar'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSubmitButton(TicketsState state, ThemeData theme) {
    final isLoading = state.status == TicketsStatus.loading || _isUploading;

    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        onPressed: isLoading ? null : _submitClose,
        icon: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : const Icon(Icons.check_circle),
        label: Text(isLoading ? 'Procesando...' : 'Cerrar Ticket'),
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          backgroundColor: Colors.green,
        ),
      ),
    );
  }

  Future<void> _takePhoto() async {
    try {
      final photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 80,
      );
      if (photo != null) {
        setState(() => _photos.add(photo));
        await _uploadPhoto(photo);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al tomar foto: $e')));
      }
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final photos = await _picker.pickMultiImage(imageQuality: 80);
      if (photos.isNotEmpty) {
        setState(() => _photos.addAll(photos));
        for (final photo in photos) {
          await _uploadPhoto(photo);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al seleccionar fotos: $e')),
        );
      }
    }
  }

  Future<void> _uploadPhoto(XFile photo) async {
    setState(() => _isUploading = true);

    context.read<TicketsBloc>().add(
      UploadEvidence(
        ticketId: widget.ticketId,
        filePath: photo.path,
        category: 'evidence',
      ),
    );

    setState(() => _isUploading = false);
  }

  Future<String?> _saveSignature() async {
    if (_signatureController.isEmpty) return null;

    try {
      final Uint8List? data = await _signatureController.toPngBytes();
      if (data == null) return null;

      final tempDir = await getTemporaryDirectory();
      final file = File(
        '${tempDir.path}/signature_${DateTime.now().millisecondsSinceEpoch}.png',
      );
      await file.writeAsBytes(data);

      if (mounted) {
        context.read<TicketsBloc>().add(
          UploadEvidence(
            ticketId: widget.ticketId,
            filePath: file.path,
            category: 'signature',
          ),
        );
      }

      return file.path;
    } catch (e) {
      debugPrint('Error saving signature: $e');
      return null;
    }
  }

  Future<void> _submitClose() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isUploading = true);

    await _saveSignature();

    if (mounted) {
      final state = context.read<TicketsBloc>().state;

      context.read<TicketsBloc>().add(
        CloseTicket(
          ticketId: widget.ticketId,
          resolution: _resolutionController.text.trim(),
          evidenceUrls: state.uploadedEvidenceUrls.isNotEmpty
              ? state.uploadedEvidenceUrls
              : null,
          signatureUrl: _signatureUrl,
        ),
      );
    }

    setState(() => _isUploading = false);
  }
}
