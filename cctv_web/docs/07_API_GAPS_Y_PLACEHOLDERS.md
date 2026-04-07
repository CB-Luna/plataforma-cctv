# 07 — API Gaps y Placeholders

> Fecha: 2026-04-05 | Reconciliado: 2026-04-05
> Estado: RECONCILIADO — GAP-03 eliminado (coordenadas existen), GAP-04/05 reclasificados a MISSING.

---

## Objetivo

Documentar qué módulos del frontend **no tienen endpoint confirmado** en el backend y cómo se manejarán temporalmente hasta que se resuelva.

---

## Clasificación de Gaps

| Tipo | Significado |
|---|---|
| **GAP-MISSING** | El endpoint NO existe ni en main.go ni en Swagger. Se necesita pero no está. |
| **GAP-CONFLICT** | El endpoint aparece en Swagger pero NO está registrado en main.go (o viceversa). Estado incierto. |
| **GAP-PARTIAL** | Existe algo relacionado pero no cubre el caso de uso completo. |
| **PLACEHOLDER** | Módulo frontend que se construirá con datos mock hasta que el gap se resuelva. |

---

## Inventario de Gaps

### GAP-01: Sites CRUD dedicado
| | |
|---|---|
| **Módulo afectado** | Infraestructura → Sucursales (`/infrastructure/sites`) |
| **Situación** | No existe un grupo de endpoints `GET /sites`, `POST /sites`, `PUT /sites/:id`, `DELETE /sites/:id`. La tabla `cctv.sites` existe en la BD (migración 005). Los sites se referencian en floor-plans (`GET /floor-plans/sites`) y posiblemente en clients. |
| **Endpoints disponibles** | `GET /inventory/floor-plans/sites` — retorna lista de sites (pero enfocado a floor-plans). |
| **Estrategia temporal** | **PLACEHOLDER**: Usar `GET /inventory/floor-plans/sites` como fuente de datos. Mostrar lista readonly. Formulario de creación/edición se implementa pero la acción de guardar muestra toast "Endpoint pendiente". |
| **Acción requerida** | Verificar si `GET /inventory/floor-plans/sites` retorna todos los sites del tenant. Si sí, usarlo. Si no, solicitar al backend un CRUD de sites. |
| **Prioridad** | 🔴 Alta — Bloquea Fase 2 (sites + mapa). |

### GAP-02: Areas CRUD dedicado
| | |
|---|---|
| **Módulo afectado** | Infraestructura → Áreas (`/infrastructure/areas`) |
| **Situación** | No existe grupo de endpoints `GET /areas`, `POST /areas`, etc. La tabla `cctv.areas` existe (migración 005, referenciada por `site_id`). Las áreas se mencionan en inventario pero no tienen handler propio. |
| **Endpoints disponibles** | Ninguno directo. Las áreas podrían venir como sub-recurso de sites o como parte de la data de inventario. |
| **Estrategia temporal** | **PLACEHOLDER**: Si las áreas vienen dentro del response de algún endpoint de inventario, extraerlas de ahí. Si no, mostrar sección con datos mock. |
| **Acción requerida** | 1) Verificar si algún endpoint retorna áreas como parte de su response. 2) Si no, solicitar al backend CRUD de áreas. |
| **Prioridad** | 🟡 Media — Necesario para Fase 2 pero se puede postergar con mock. |

### ~~GAP-03: Sites sin coordenadas geográficas~~ ✅ RESUELTO
| | |
|---|---|
| **Estado** | ✅ RESUELTO — La migración 000005 define `latitude DECIMAL(10,8)` y `longitude DECIMAL(11,8)` en `cctv.sites`. Los campos existen. El mapa puede usarlos directamente. |

### GAP-04: auth/refresh (GAP-MISSING — no existe en ningún lado)
| | |
|---|---|
| **Módulo afectado** | Auth Store — renovación automática de token |
| **Situación** | `POST /auth/refresh` **NO existe** en `cmd/main.go`, `swagger.json` ni `handlers/auth.go`. Solo hay un campo `refresh_token` en un DTO de respuesta, pero no hay endpoint que lo consuma. La documentación de migración (`MIGRACION_NEXTJS.md`) lo mencionaba como plan futuro, no como funcionalidad existente. |
| **Estrategia temporal** | **Implementar sin refresh**: Si el token expira, redirigir a login. Preparar el código del interceptor para refresh pero activarlo solo cuando el endpoint esté confirmado. |
| **Acción requerida** | Probar `POST /api/v1/auth/refresh` contra el servidor. Si responde 404, confirmar como GAP. Si funciona, el endpoint existe pero no está en el router visible de main.go (podría estar en un middleware). |
| **Prioridad** | 🔴 Alta — Afecta UX de Fase 1. |

### GAP-05: auth/switch-company (GAP-MISSING — no existe en ningún lado)
| | |
|---|---|
| **Módulo afectado** | Selector de empresa/tenant en el header |
| **Situación** | `POST /auth/switch-company` **NO existe** en `cmd/main.go`, `swagger.json` ni `handlers/auth.go`. La documentación de migración lo mencionaba como plan futuro. |
| **Estrategia temporal** | **Workaround**: Logout + re-login seleccionando la otra empresa. Funcionalmente correcto pero peor UX. |
| **Acción requerida** | Probar endpoint contra el servidor. |
| **Prioridad** | 🟡 Media — Solo afecta a usuarios con múltiples empresas. |

### GAP-06: Mantenimiento Preventivo
| | |
|---|---|
| **Módulo afectado** | Operación CCTV → Mantenimiento Preventivo (`/maintenance`) |
| **Situación** | No existe ningún endpoint relacionado a mantenimiento preventivo, programación de visitas, ni calendarios de servicio. No hay tabla en las migraciones. |
| **Estrategia temporal** | **Omitir en Fase 1-4**. Incluir en el menú como item deshabilitado con tooltip "Próximamente". Si se necesita antes, crear con datos mock. |
| **Acción requerida** | Confirmar si mantenimiento preventivo está en el roadmap del backend. |
| **Prioridad** | 🟢 Baja — No es crítico para MVP. |

### GAP-07: Auditoría / Logs
| | |
|---|---|
| **Módulo afectado** | Sistema → Auditoría (`/system/audit`) |
| **Situación** | La tabla `audit_log` existe (migración 003) pero NO hay handler ni endpoint para consultarla. |
| **Estrategia temporal** | **Omitir**: El item de menú se muestra deshabilitado. Si el admin necesita ver logs, lo hace directamente en la BD. |
| **Acción requerida** | Solicitar al backend un `GET /audit-logs` con filtros. |
| **Prioridad** | 🟢 Baja — Nice to have. |

### GAP-08: Topología de Red
| | |
|---|---|
| **Módulo afectado** | Infraestructura → Topología (`/infrastructure/topology`) |
| **Situación** | Módulo nuevo. No existe backend. La idea es visualizar la jerarquía NVR → Cámaras → Áreas como un grafo interactivo usando React Flow. |
| **Estrategia temporal** | **Construir 100% client-side**: Usar datos de `GET /inventory/nvr` y `GET /inventory/cameras` para construir el grafo en el frontend. No necesita endpoint dedicado. |
| **Acción requerida** | Ninguna en backend. Se resuelve con lógica frontend. |
| **Prioridad** | 🟢 Baja — Fase 6-7. |

### GAP-09: Configuración Global del Sistema
| | |
|---|---|
| **Módulo afectado** | Sistema → Configuración Global (`/system/config`) |
| **Situación** | `GET /settings` y `PUT /settings` existen pero parecen ser settings por tenant, no globales del sistema. |
| **Estrategia temporal** | **Reusar `/settings`** como la vista de configuración. Si se necesitan settings globales (super-admin), usar los endpoints de tenants. |
| **Acción requerida** | Verificar si `/settings` diferencia entre tenant-level y system-level config. |
| **Prioridad** | 🟢 Baja. |

### GAP-10: Billing / Facturación
| | |
|---|---|
| **Módulo afectado** | No incluido en el menú propuesto |
| **Situación** | El schema `billing` existe en la BD (migración 003) con tablas `billing_plans`, `billing_subscriptions`, `billing_invoices`. NO hay endpoints implementados. |
| **Estrategia temporal** | **No implementar**. Excluido del alcance actual. Documentar que el backend tiene el schema preparado para futuro. |
| **Acción requerida** | Ninguna en esta fase. |
| **Prioridad** | ⚪ Fuera de alcance. |

---

## Resumen Visual

```
✅ CUBIERTOS    (endpoints confirmados, 144 rutas API):
   Auth (login/me/logout), Users, Roles, Menu (23), Settings,
   Tenants, Storage (9), Intelligence (12), Clients, Policies,
   SLA, NVR, Cameras, Import (11), Floor-Plans, Summary,
   Tickets (12), Dashboard

✅ RESUELTO     (era gap, ya no lo es):
   Sites tienen latitude/longitude (GAP-03 cerrado)

❌ GAP-MISSING  (no existe en ningún lado):
   auth/refresh, auth/switch-company,
   Sites CRUD, Areas CRUD, Mantenimiento, Auditoría,
   Configuración Global

ℹ️  RESOLVIBLE CLIENT-SIDE:
   Topología de Red (se construye con datos de inventario)

⚪ FUERA DE ALCANCE:
   Billing/Facturación
```

---

## Protocolo de Manejo de Gaps

1. **Antes de Fase N**, revisar los GAPs que afectan esa fase.
2. **Probar endpoints conflictivos** contra el servidor real.
3. **Actualizar este documento** con resultado (✅ resuelto / ❌ confirmado como gap).
4. **Si el gap es confirmado**, implementar el placeholder descrito y dejar un `// TODO: GAP-XX` en el código.
5. **Cuando el backend implemente el endpoint**, reemplazar el placeholder por la llamada real.

---

## Patrón de Placeholder en Código

```typescript
// En el API client:
export async function getSites(): Promise<Site[]> {
  // TODO: GAP-01 — Reemplazar cuando exista GET /sites
  // Temporal: usar endpoint de floor-plans
  const response = await api.get('inventory/floor-plans/sites').json<Site[]>();
  return response;
}

// En el componente:
function CreateSiteButton() {
  const handleCreate = () => {
    toast.warning('Funcionalidad pendiente — endpoint no disponible aún');
    // TODO: GAP-01 — Habilitar cuando exista POST /sites
  };
  return <Button onClick={handleCreate} disabled>Crear Sucursal</Button>;
}
```

> Todos los `TODO: GAP-XX` se rastrean con búsqueda grep para saber cuántos quedan pendientes.
