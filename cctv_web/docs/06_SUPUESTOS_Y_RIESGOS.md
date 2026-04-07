# 06 — Supuestos y Riesgos

> Fecha: 2026-04-05 | Reconciliado: 2026-04-05
> Estado: RECONCILIADO — supuestos S06, S07 verificados; S05, S10 corregidos.

---

## Objetivo

Dejar explícitos los supuestos bajo los que se construirá `symticketscctv-next` y los riesgos asociados. Cada supuesto está marcado como **VERIFICADO** o **INFERIDO**.

---

## Supuestos

### S01 — Backend inmutable
| | |
|---|---|
| **Supuesto** | El backend Go (`cctv_server`) NO se modifica como parte de este proyecto. El frontend se adapta a lo que el backend ofrece. |
| **Estado** | ✅ VERIFICADO — Decisión de diseño explícita del equipo. |
| **Riesgo si es falso** | Bajo. Si se decide modificar el backend, el frontend se beneficia (más endpoints, mejor DX). |

### S02 — Puerto y base path de la API
| | |
|---|---|
| **Supuesto** | El backend corre en `localhost:8080` (dev) y expone todos los endpoints bajo `/api/v1`. |
| **Estado** | ✅ VERIFICADO — `cmd/main.go` línea ~380: `r.Run(":8080")`. Base path confirmado en Swagger y rutas de main.go. |
| **Riesgo si es falso** | Nulo — Se configura via `NEXT_PUBLIC_API_URL` en `.env.local`. |

### S03 — Flujo de autenticación JWT
| | |
|---|---|
| **Supuesto** | Login via `POST /auth/login` retorna `{ token, user, companies[] }`. Las requests autenticadas envían `Authorization: Bearer <token>`. |
| **Estado** | ✅ VERIFICADO — `handlers/auth.go` confirma login, `/auth/me`, cambio de contraseña. Swagger confirma response con `token` + `companies`. |
| **Riesgo si es falso** | Medio — Toda la capa de auth-store depende de esto. |

### S04 — Multi-tenant via header HTTP
| | |
|---|---|
| **Supuesto** | El backend espera `X-Company-ID` (o `X-Tenant-ID`) en cada request autenticada para determinar el tenant activo. El backend usa RLS con `SET LOCAL app.current_tenant_id`. |
| **Estado** | ✅ VERIFICADO — Migraciones confirman `current_setting('app.current_tenant_id')` en todas las políticas RLS. main.go CORS incluye estos headers. |
| **Riesgo si es falso** | Alto — Sin esto, todos los datos se mezclan entre tenants. |

### S05 — Menú dinámico desde API
| | |
|---|---|
| **Supuesto** | El menú lateral se carga de `GET /menu` que retorna un árbol filtrado por permisos del usuario autenticado. |
| **Estado** | ✅ VERIFICADO — 23 endpoints de menú en main.go. El menú del usuario es `menu.GET("", menuHandler.GetMenu)` en línea 178. **La ruta es `GET /menu`**, no `/menu/user`. |
| **Riesgo si es falso** | Medio — Habría que hardcodear el menú o cambiar el mecanismo. |

### S06 — Sites tienen coordenadas geográficas
| | |
|---|---|
| **Supuesto** | Las sucursales (sites) tienen `latitude` y `longitude` para mostrar en el mapa de sucursales. |
| **Estado** | ✅ VERIFICADO — La migración 000005 define `latitude DECIMAL(10, 8)` y `longitude DECIMAL(11, 8)` en la tabla `cctv.sites`. |
| **Riesgo si es falso** | N/A — Confirmado. El mapa puede usar estos campos directamente. |

### S07 — Áreas tienen `floor_number`
| | |
|---|---|
| **Supuesto** | Las áreas dentro de un site tienen un campo `floor_number` o equivalente para asociarlas a pisos en planos de piso. |
| **Estado** | ✅ VERIFICADO — La migración 000005 define `floor_number VARCHAR(20)` con comentario `-- Piso o nivel` en la tabla `cctv.areas`. |
| **Riesgo si es falso** | N/A — Confirmado. Los planos pueden filtrar áreas por piso. |

### S08 — Floor plans backend funcional
| | |
|---|---|
| **Supuesto** | Los 3 endpoints de floor-plans en main.go están implementados y funcionales. |
| **Estado** | ✅ VERIFICADO — `handlers/inventory_floor_plans.go` existe (>200 líneas). Registrado en main.go. Maneja JSON con elementos posicionales (cámaras en plano). |
| **Riesgo si es falso** | Bajo — Si los endpoints fallan, se solucionaría con backend. |

### S09 — No hay endpoint de auditoría/logs
| | |
|---|---|
| **Supuesto** | No existe un endpoint para consultar logs de auditoría (quién hizo qué, cuándo). |
| **Estado** | ✅ VERIFICADO — No existe en main.go ni en Swagger. La tabla `audit_log` existe (migración 003) pero no tiene handler. |
| **Riesgo si es falso** | Bajo — Si aparece, es un plus. Mientras tanto, el módulo "Auditoría" queda como placeholder. |

### S10 — Refresh token y switch-company
| | |
|---|---|
| **Supuesto** | Los endpoints `POST /auth/refresh` y `POST /auth/switch-company` están disponibles para renovar tokens y cambiar de empresa. |
| **Estado** | ❌ GAP-MISSING — **No existen en ningún lado:** ni en `cmd/main.go`, ni en `swagger.json`, ni en `handlers/auth.go`. Solo existe un campo `refresh_token` en un DTO de respuesta, pero no hay endpoint que lo consuma. La documentación de migración los mencionaba como plan futuro, no como funcionalidad existente. |
| **Riesgo si es falso** | Alto — Sin refresh, las sesiones caducan sin recuperación (redirect a login). Sin switch-company, el usuario debe hacer logout+login para cambiar de empresa. **Workaround ya definido en GAP-04 y GAP-05.** |

### S11 — Formato de permisos del backend
| | |
|---|---|
| **Supuesto** | Los permisos vienen como strings en formato `modulo:accion` (ej: `tickets:create`, `inventory:read`). |
| **Estado** | ⚠️ INFERIDO — Core Associates usa este formato. El backend CCTV tiene endpoint `GET /roles/:id/permissions`, pero el formato exacto del response no está documentado en Swagger. |
| **Riesgo si es falso** | Medio — El hook `usePermisos()` tendría que adaptarse al formato real. **Acción:** Verificar response de `/roles/:id/permissions`. |

### S12 — Almacenamiento en MinIO
| | |
|---|---|
| **Supuesto** | Las imágenes (fotos de tickets, evidencias, logos, planos) se suben y descargan via los endpoints de `/storage` que interactúan con MinIO. |
| **Estado** | ✅ VERIFICADO — 8 endpoints de storage en main.go. Docker-compose incluye servicio MinIO. |
| **Riesgo si es falso** | Bajo. |

### S13 — Next.js App Router es la arquitectura correcta
| | |
|---|---|
| **Supuesto** | Se usa Next.js 15 con App Router (no Pages Router). El proyecto es un SPA con autenticación client-side (no SSR para datos protegidos). |
| **Estado** | ✅ DECISIÓN DE DISEÑO — Consistente con core-associates que ya usa App Router. |
| **Riesgo si es falso** | Nulo — Es decisión arquitectónica propia. |

### S14 — i18n requerido desde el inicio
| | |
|---|---|
| **Supuesto** | Se necesita soporte multilenguaje (español/inglés mínimo) usando `next-intl`. |
| **Estado** | ⚠️ INFERIDO — El stack incluye `next-intl` pero no se ha confirmado si es requisito de negocio o aspiracional. |
| **Riesgo si es falso** | Bajo — Si no se necesita, se omite `next-intl` y se ahorra complejidad. Se puede añadir después. |

---

## Matriz de Riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R01 | ~~Sites sin coordenadas~~ | ~~Media~~ | ~~Alto~~ | ✅ RESUELTO — `latitude` y `longitude` existen en `cctv.sites` (migración 000005). |
| R02 | `auth/refresh` no implementado → sesiones cortas | Alta | Alto | GAP-MISSING confirmado (no existe en ningún lado). Workaround: redirect a login en 401. |
| R03 | `auth/switch-company` no implementado | Alta | Medio | GAP-MISSING confirmado. Workaround: logout + login con selección de empresa. |
| R04 | Formato de permisos diferente al esperado | Baja | Medio | Probar endpoint real. Adaptar hook `usePermisos()`. |
| R05 | Endpoints no documentados en Swagger fallan | Baja | Medio | Probar cada uno antes de construir la vista. Documentar resultado en este archivo. |
| R06 | Performance del dashboard con muchos datos | Baja | Bajo | TanStack Query caching + paginación server-side. |
| R07 | Importación masiva de Excel sin validación suficiente en backend | Media | Medio | El frontend debe validar antes de enviar. Preview endpoint existe. |
| R08 | Floor plans: formato JSON de posicionamiento no documentado | Media | Medio | Leer handler Go para inferir estructura. Probar con datos reales. |
| R09 | next-intl complica la Fase 1 | Baja | Bajo | Postergar i18n a Fase 7 si no es requisito firme. |
| R10 | Theming: backend no retorna tema completo → CSS roto | Baja | Bajo | Definir tema por defecto en el frontend. Enriquecer con lo que venga de API. |

---

## Protocolo de Verificación

Para cada supuesto **⚠️ INFERIDO** o **⚠️ CONFLICTO**:

1. **Antes de construir el módulo que depende del supuesto**, verificar contra el servidor real.
2. Actualizar este documento con el resultado (cambiar a ✅ VERIFICADO o ❌ FALSO).
3. Si el supuesto es falso, documentar el workaround en `07_API_GAPS_Y_PLACEHOLDERS.md`.
