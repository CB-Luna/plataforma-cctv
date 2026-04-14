class TicketCatalog {
  const TicketCatalog._();

  static String canonicalPriority(String priority) {
    switch (priority) {
      case 'urgent':
        return 'critical';
      default:
        return priority;
    }
  }

  static String canonicalStatus(String status) {
    switch (status) {
      case 'resolved':
        return 'completed';
      default:
        return status;
    }
  }

  static bool isUrgentPriority(String priority) {
    return canonicalPriority(priority) == 'critical';
  }

  static bool isHighPriority(String priority) {
    final canonical = canonicalPriority(priority);
    return canonical == 'critical' || canonical == 'high';
  }

  static bool isClosedStatus(String status) {
    final canonical = canonicalStatus(status);
    return canonical == 'completed' ||
        canonical == 'closed' ||
        canonical == 'cancelled';
  }

  static bool canStartStatus(String status) {
    final canonical = canonicalStatus(status);
    return canonical == 'open' || canonical == 'assigned';
  }

  static bool canCompleteStatus(String status) {
    final canonical = canonicalStatus(status);
    return canonical == 'in_progress' ||
        canonical == 'pending_parts' ||
        canonical == 'pending_approval' ||
        canonical == 'on_hold';
  }

  static String priorityLabel(String priority) {
    switch (canonicalPriority(priority)) {
      case 'critical':
        return 'Critica';
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

  static String statusLabel(String status) {
    switch (canonicalStatus(status)) {
      case 'open':
        return 'Abierto';
      case 'assigned':
        return 'Asignado';
      case 'in_progress':
        return 'En progreso';
      case 'pending_parts':
        return 'Esperando partes';
      case 'pending_approval':
        return 'Esperando autorizacion';
      case 'pending_client':
        return 'Esperando cliente';
      case 'on_hold':
        return 'En espera';
      case 'completed':
        return 'Completado';
      case 'closed':
        return 'Cerrado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  static String typeLabel(String type) {
    switch (type) {
      case 'corrective':
        return 'Correctivo';
      case 'preventive':
        return 'Preventivo';
      case 'emergency':
        return 'Emergencia';
      case 'installation':
        return 'Instalacion';
      case 'uninstallation':
        return 'Desinstalacion';
      case 'inspection':
        return 'Inspeccion';
      case 'consultation':
        return 'Consulta';
      default:
        return type;
    }
  }

  static String nextActionLabel(String status) {
    switch (canonicalStatus(status)) {
      case 'open':
        return 'Revisar y tomar ticket';
      case 'assigned':
        return 'Iniciar atencion';
      case 'in_progress':
        return 'Continuar diagnostico';
      case 'pending_parts':
        return 'Esperar refaccion o seguimiento';
      case 'pending_approval':
        return 'Esperar autorizacion';
      case 'pending_client':
        return 'Coordinar con cliente';
      case 'on_hold':
        return 'Retomar cuando se libere';
      case 'completed':
      case 'closed':
        return 'Atencion finalizada';
      case 'cancelled':
        return 'Ticket cancelado';
      default:
        return 'Revisar ticket';
    }
  }
}
