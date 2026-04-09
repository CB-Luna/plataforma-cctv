# Plan de Mejora: Configurador de Settings

> Generado a partir del analisis de la referencia de diseno (Core Associates CRM) y el estado actual de `cctv_web/src/app/(dashboard)/settings/`.

## Estado actual

| Tab | Lineas | Tipo | Calidad |
|-----|--------|------|---------|
| Temas (general-tab) | 480 | Interactivo - Editor 3 columnas | Alta |
| Usuarios | 166 | DataTable + CRUD | Funcional |
| Roles y Permisos | 148 | DataTable + CRUD | Funcional |
| IA del sistema | 282 | DataTable + CRUD + Stats | Buena |
| Storage | 185 | DataTable + CRUD + Stats | Funcional |
| **Servicios y paquetes** | 136 | **Solo lectura** | Informacional |
| **Plantillas de menu** | 529 | Master-detail + CRUD | Buena |
| Empresas | 781 | Master-detail + CRUD + Onboarding | Alta |

## Problema dominante

La tab de **Servicios y paquetes** es puramente informacional: muestra planes predefinidos, una matriz estatica de servicios por plan y un catalogo de servicios sin interaccion.

La tab de **Plantillas de menu** es funcional pero carece de un resumen visual rapido del estado y las estadisticas de uso.

## Referencia de diseno analizada

Del configurador CRM se identificaron patrones clave:

1. **TemasTab**: Editor de temas con 3 columnas, presets categorizados, preview en vivo con dashboard/table mode, dark mode toggle, server CRUD
2. **RolesAdminTab**: Sub-tabs internas (Plantillas, Permisos y Menu, Asignaciones)
3. **PermisosMenuPanel**: Permisos agrupados por modulo con iconos/colores por accion, ordenamiento drag-and-drop
4. **PlantillasPanel**: CRUD de templates con icon picker, color swatches, asignacion de tema por rol
5. **UsuariosTab**: DataTable completa con avatar upload, password reset, creation form

## Fases de mejora

### Fase 1: Servicios y paquetes interactivo (Prioridad ALTA)

**Objetivo**: Transformar la tab de un panel informacional a un configurador interactivo.

**Pasos**:
1. Agregar header con StatsCards (total servicios, operativos, en desarrollo, tenants con pack enterprise)
2. Convertir la seccion de planes en cards seleccionables con accion de aplicar a un tenant
3. Agregar seccion de asignacion rapida: elegir tenant y togglear servicios individuales
4. Mostrar vista agrupada por estado de servicio (operativo, parcial, en desarrollo)
5. Integrar la persistencia via `updateTenant()` con `settings.enabled_services`

**Backend existente**: `PUT /tenants/{id}` con `settings` generico — suficiente para persistir.

**Componentes a reutilizar**: StatsCard, Badge, ServiceBadges, Card, Checkbox

### Fase 2: Mejora visual de Plantillas de menu (Prioridad MEDIA)

**Objetivo**: Agregar contexto visual y mejorar la experiencia de la tab existente.

**Pasos**:
1. Agregar StatsCards al inicio (total plantillas, total items en catalogo, tenants sin asignar)
2. Mejorar las cards de plantilla con indicadores visuales de cobertura
3. Agregar counter de items seleccionados vs total en la card de composicion

### Fase 3: Mejoras futuras (backlog)

> Estas mejoras dependen de endpoints de backend que aun no existen o no son prioritarios.

- **Temas**: Dark mode toggle en preview, tipografia customizable, upload de logo desde la tab
- **Usuarios**: Stats cards (total, activos, ultimo login), avatar upload inline
- **Roles**: Sub-tabs (como referencia RolesAdminTab) — requiere backend mas granular de permisos
- **Ordenamiento drag-and-drop en menu**: Similar a referencia PermisosMenuPanel

## Criterio de aceptacion

- [ ] services-packages-tab tiene interacciones reales (no solo lectura)
- [ ] Stats cards en services-packages con datos reales de tenants
- [ ] Plan aplicable a tenant con persistencia via updateTenant
- [ ] menu-templates-tab tiene stats cards informativos
- [ ] Build exitoso sin errores
- [ ] E2E existentes pasan (14/14)

## Decisiones tecnicas

- No crear endpoints nuevos — usar `PUT /tenants/{id}` existente
- `parseTenantProductProfile()` ya existe para leer el perfil de producto
- Persistencia de servicios via `settings.enabled_services` y `settings.package_profile`
- Reutilizar `ServiceBadges`, `StatsCard` y patrones de `tenants-tab.tsx`
