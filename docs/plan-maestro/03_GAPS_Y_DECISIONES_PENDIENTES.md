# 03. Gaps y Decisiones Pendientes

> Regla aplicada: cuando una capacidad no está respaldada por el backend auditado, se documenta como GAP. No se propone inventar endpoints.

## Resumen ejecutivo

Los GAPs detectados no son homogéneos. Se agrupan en:

- backend/API,
- frontend/UI,
- modelo de negocio,
- permisos/scopes,
- experiencia multi-tenant,
- y datos demo/seeds/mocks.

El mayor riesgo actual no es la falta de pantallas, sino la mezcla entre:

- capacidades reales,
- capacidades simuladas por UI,
- y decisiones de producto aún no confirmadas.

## GAP de backend / API

| ID | GAP | Evidencia | Impacto | Recomendación |
|---|---|---|---|---|
| API-01 | No existe `POST /auth/refresh` | Documentado en instrucciones; no está en `cctv_server/cmd/main.go` | La sesión no puede renovarse silenciosamente | Mantener relogin explícito y documentarlo como limitación |
| API-02 | No existe `POST /auth/switch-company` | No está registrado en `main.go` | No hay cambio de tenant respaldado por backend como flujo dedicado | Resolver el cambio vía login con `tenant_id` o confirmar estrategia |
| API-03 | No existe CRUD completo de sitios | Instrucciones del monorepo y ausencia de rutas `/sites` | Sitios no se pueden crear/editar desde web | Mantener sitios como entidad consumida, no administrable |
| API-04 | No hay lat/lng operativo en el flujo consumido por frontend | `listSites()` usa `/inventory/floor-plans/sites`; el frontend no recibe coords reales | El mapa no puede ser confiable | Tratar mapa como aproximación o diferir su cierre real |
| API-05 | No existen endpoints de mantenimiento preventivo | GAP documentado en workspace | No se puede planear módulo preventivo real | Mantenerlo fuera de alcance |
| API-06 | No existe endpoint de auditoría | GAP documentado en workspace | No hay historial operacional formal | Diferir auditoría funcional real |
| API-07 | `PUT /inventory/cameras/:id` no está registrado en backend real | `cctv_web/src/lib/api/cameras.ts` lo usa; `cctv_server/cmd/main.go` no lo expone | Riesgo de edición falsa de cámaras | Tratar edición de cámaras como GAP o retirar esa promesa de UI |
| API-08 | Clientes no tienen `PUT`/`DELETE` | `clients.ts` solo envuelve listar, obtener y crear; `main.go` coincide | CRUD incompleto de clientes | Dejarlo explícito como alcance real |
| API-09 | No hay endpoint dedicado de eliminación de rol | `roles` en backend solo lista, crea, obtiene, actualiza y asigna permisos | El ciclo de vida de roles queda incompleto | Mantener “eliminar” fuera del alcance real |

## GAP de frontend / UI

| ID | GAP | Evidencia | Impacto | Recomendación |
|---|---|---|---|---|
| FE-01 | Login multiempresa no consume `companies` de `POST /auth/login` | `LoginResponse` frontend omite `companies`; `login/page.tsx` depende de `getMe()` | El selector de empresa no queda garantizado | Corregir flujo de login antes de abrir más módulos |
| FE-02 | Cambio de empresa en header es engañoso | `header.tsx`, `tenant-store.ts`, `api/client.ts`; backend ignora `X-Company-ID` para tenant efectivo | Riesgo alto de contexto visual distinto al contexto real de datos | Quitar o rehacer el switch sobre contrato válido |
| FE-03 | Selector de sucursal no afecta queries | `site-store.ts` solo es usado por `site-selector.tsx` | Contexto de sitio visible, pero no operativo | Conectar sitio a query keys y filtros o degradar el selector |
| FE-04 | Importación masiva no sube archivo ni genera carga útil útil | `import-dialog.tsx` manda `data: []` y solo guarda filename | Flujo aparenta importar cuando no completa el proceso | Rehacer flujo o marcarlo como carga manual asistida |
| FE-05 | Tickets usan UUID manual para cliente, sitio y técnico | `ticket-dialog.tsx`, `ticket-actions.tsx` | UX frágil, propensa a error | Reemplazar por selectores y búsquedas |
| FE-06 | Pólizas usan UUID manual para cliente, sitio y activos | `policy-dialog.tsx`, `policies/[id]/page.tsx` | UX frágil y poco enterprise | Reemplazar por selectores ligados a datos reales |
| FE-07 | Sidebar no usa el menú dinámico completo del backend | `sidebar.tsx` construye menú hardcodeado | El menú por tenant/plantilla no se materializa | Definir si el frontend debe volverse realmente dinámico |
| FE-08 | No hay guardas de permisos por página/acción | `usePermissions` existe pero está sin uso real; permisos se usan casi solo en sidebar | Riesgo de acciones visibles fuera de scope | Añadir política de permisos transversal |
| FE-09 | Mapa usa coordenadas sintéticas | `branch-map.tsx`, `city-coordinates.ts` | Módulo demostrable, pero no confiable para operación real | Etiquetarlo como aproximado o sacarlo de core |
| FE-10 | Persistencia de floor plans es parcial | `floor-plans/[id]/page.tsx` convierte muchos elementos a `label` al guardar | Pérdida de semántica del plano | Limitar herramientas o mejorar mapeo permitido por backend |
| FE-11 | No hay UI para logo de tenant pese a existir endpoint | `tenants.ts` expone `uploadTenantLogo`; no hay referencia UI | Configuración de empresa queda incompleta | Incorporar como tarea de cierre de configuración |
| FE-12 | Varias rutas administrativas son solo redirects a `/settings` | `/users`, `/roles`, `/storage`, `/intelligence`, `/tenants` | Duplica superficie sin navegación profunda por URL | Decidir si se mantienen como aliases o se eliminan |

## GAP de modelo de negocio

| ID | GAP | Evidencia | Impacto | Recomendación |
|---|---|---|---|---|
| BIZ-01 | Tenant y cliente no están verbalmente cerrados | Backend tiene `tenants` y `clients`; la UI usa “empresa” para ambos niveles en distintos lugares | Ambigüedad estructural | Confirmar vocabulario oficial del producto |
| BIZ-02 | Sitio no está formalizado como contexto transversal | Existe en inventario y formularios, pero no en experiencia global | El sistema no “piensa” por sitio de forma consistente | Declararlo entidad core de operación |
| BIZ-03 | No está definido el catálogo de servicios habilitados | La UI ya sugiere CCTV, IA, storage, CAPEX, pólizas | Complica menú, pricing, scopes y roadmap | Confirmar si habrá módulos por servicio |
| BIZ-04 | CAPEX/garantías no tiene rol de negocio cerrado | Hoy deriva de inventario | Puede crecer sin modelo | Mantenerlo derivado hasta definir proceso |
| BIZ-05 | No está cerrado cómo conviven póliza, SLA y cobertura | Hoy coexisten, pero sin marco documental único | Riesgo de duplicidad conceptual | Formalizar contrato operativo en Fase 4 |

## GAP de permisos / scopes

| ID | GAP | Evidencia | Impacto | Recomendación |
|---|---|---|---|---|
| SEC-01 | Falta modelo visible de scope global vs tenant | Backend reconoce acceso global vía roles, frontend no lo refleja claramente | Riesgo de mezclar backoffice con portal tenant | Documentar y luego materializar scopes en UX |
| SEC-02 | Permisos no gobiernan acciones de página | `usePermissions` no se usa en pantallas | Riesgo de acciones visibles aunque fallen en backend | Definir guardas de lectura, acción y navegación |
| SEC-03 | Cambio de empresa no recalcula permisos de forma fiable | El frontend solo cambia store local | Riesgo de permisos cruzados aparentes | Rehacer el flujo sobre contrato real |
| SEC-04 | Roles sin eliminación ni remoción fina de permisos | Backend y frontend no cubren ciclo completo | Administración incompleta | Aceptar limitación o rediseñar flujo de roles |

## GAP de experiencia multi-tenant

| ID | GAP | Evidencia | Impacto | Recomendación |
|---|---|---|---|---|
| MT-01 | Multiempresa prometida, pero no cerrada | login, select-company, header, auth-store, middleware backend | Riesgo mayor de producto | Hacer de esto la primera fase real |
| MT-02 | `currentCompany` no se hidrata desde storage de forma robusta | `tenant-store.ts` no reconstruye empresa; layout cae al primer company disponible | Cambios de contexto poco previsibles | Definir fuente única del tenant activo |
| MT-03 | La configuración parece híbrida, pero no está explicitado qué es global y qué es tenant | `/settings` mezcla tabs de empresas, usuarios, tema, IA y storage | Confusión de ownership | Separar configuración global vs tenant en diseño y docs |
| MT-04 | Menú por tenant existe en backend, no en experiencia real | backend de menú avanzado + sidebar hardcodeado | El producto no capitaliza su base multi-tenant | Decidir si el menú será verdaderamente dinámico |

## GAP de datos demo / seeds / mocks

| ID | GAP | Evidencia | Impacto | Recomendación |
|---|---|---|---|---|
| DEMO-01 | Demo users del login son presets visuales, no garantía de datos reales | `login/page.tsx` | Puede generar expectativa falsa | Dejar claro que son atajos de credenciales |
| DEMO-02 | Mapa usa coordenadas sintéticas | `city-coordinates.ts`, fallback Monterrey | Demo luce mejor que la verdad de datos | Etiquetar la aproximación |
| DEMO-03 | Scripts y docs viejos siguen apuntando a puertos anteriores | `verify-api.ps1`, docs previas, seeds 8087/8080 | QA y onboarding inconsistentes | Limpiar después de aprobar el plan |
| DEMO-04 | No hay certeza de seeds multiempresa compatibles con el flujo actual | scripts y docs no garantizan usuario con múltiples compañías operables en web | Dificulta validar select-company | Preparar dataset de validación controlado |

## Decisiones cerradas y confirmadas (2026-04-07)

Estas decisiones ya no se consideran pendientes para programar la Fase 1.

- DEC-01: login hibrido aprobado, con seleccion explicita de empresa cuando el usuario pertenece a multiples tenants.
- DEC-02: tenant y client quedan oficialmente separados dentro del modelo de producto.
- DEC-03: se aprueba modelo de roles globales de plataforma + roles internos por tenant.
- DEC-04: en Fase 1 el menu permanece de estructura fija, pero su visibilidad debe respetar tenant + permisos + contexto real.
- DEC-05: `/settings` queda definido como espacio hibrido entre plataforma y tenant.
- DEC-06: el mapa no es bloqueante de V1 y puede mantenerse como modulo complementario con precision aproximada.
- DEC-07: paquete, poliza y SLA no son equivalentes y deben convivir con semantica distinta.
- DEC-08: la V1 core queda enfocada en auth/contexto, clientes/sitios, inventario CCTV, tickets, polizas/SLA y configuracion esencial.

### DEC-01. ¿El login debe ser directo al tenant o primero global?

**Descripción**  
El backend ya soporta `tenant_id` opcional en login. El frontend hoy entra al primer tenant y luego intenta resolver multiempresa después.

**Impacto**  
Define todo el flujo de autenticación, cambio de empresa, persistencia de contexto y scopes.

**Opciones posibles**

- Login directo a tenant desde el inicio.
- Login global y selección de empresa antes de emitir contexto final.
- Login híbrido: recordar último tenant y permitir cambiar.

**Recomendación**  
Adoptar login híbrido: autenticación única, selección explícita de tenant cuando aplique y emisión/reemisión de contexto real por tenant.

### DEC-02. ¿Tenant y cliente son dos niveles distintos del modelo?

**Descripción**  
El backend sí distingue `tenants` y `clients`, pero el lenguaje de producto aún no está estabilizado.

**Impacto**  
Afecta naming, navegación, dashboards, permisos y documentación.

**Opciones posibles**

- Tratar tenant y cliente como lo mismo.
- Tratar tenant como empresa operadora y client como cuenta atendida.
- Tratar tenant como holding y client como empresa visible al usuario final.

**Recomendación**  
Mantener niveles separados: tenant como espacio aislado principal y client como cartera del tenant.

### DEC-03. ¿Habrá roles internos por empresa?

**Descripción**  
El backend sí soporta roles y permisos por tenant.

**Impacto**  
Afecta seguridad, configuración, UX de administración y menú.

**Opciones posibles**

- Solo roles globales.
- Solo roles tenant.
- Roles globales para plataforma y roles tenant para operación.

**Recomendación**  
Modelo híbrido: roles globales para plataforma y roles tenant para cada empresa.

### DEC-04. ¿Los módulos se habilitan por servicio?

**Descripción**  
La UI ya sugiere familias funcionales distintas: CCTV, IA, storage, contratos, CAPEX.

**Impacto**  
Afecta menú, pricing, onboarding y alcance por tenant.

**Opciones posibles**

- Menú único para todos.
- Menú por rol únicamente.
- Menú por tenant, rol y servicio habilitado.

**Recomendación**  
Usar tenant + rol + servicio habilitado, aunque su materialización completa se haga por fases.

### DEC-05. ¿Cómo se controla el alcance contractual: paquete, póliza o ambos?

**Descripción**  
Hoy pólizas y SLA existen, pero no está definido si también habrá paquetes de servicio.

**Impacto**  
Afecta pricing, visibilidad de módulos, cobertura y operación comercial.

**Opciones posibles**

- Todo por póliza.
- Todo por paquete de producto.
- Paquete habilita módulos y póliza concreta cobertura contractual.

**Recomendación**  
Separar ambos: paquete para habilitación macro, póliza para contrato y cobertura.

### DEC-06. ¿La configuración actual es global, tenant o híbrida?

**Descripción**  
`/settings` mezcla empresas, usuarios, roles, tema, IA y storage.

**Impacto**  
Afecta ownership, navegación y permisos.

**Opciones posibles**

- Todo tenant.
- Todo global.
- Híbrido con tabs o shells separados.

**Recomendación**  
Híbrido explícito: separar administración global de plataforma y configuración propia del tenant.

### DEC-07. ¿Habrá menú dinámico por empresa y por rol?

**Descripción**  
El backend ya está listo para plantillas y asignación por tenant. El frontend aún no.

**Impacto**  
Afecta experiencia multi-tenant y sostenibilidad del producto.

**Opciones posibles**

- Menú fijo hardcodeado.
- Menú dinámico solo por permisos.
- Menú dinámico por tenant, plantilla y permisos.

**Recomendación**  
Apuntar a tenant + plantilla + permisos, pero no antes de cerrar scopes y modelo.

### DEC-08. ¿Qué módulos son realmente obligatorios para la V1 operativa?

**Descripción**  
La web muestra mucho avance, pero no todo tiene el mismo peso operativo.

**Impacto**  
Afecta prioridad, QA y fecha de cierre.

**Opciones posibles**

- Todo lo visible entra a V1.
- Solo CCTV core y operación contractual.
- V1 por núcleo y V1.1 por extensiones.

**Recomendación**  
V1 por núcleo: auth/contexto, clientes-sitios, inventario, tickets, pólizas/SLA y configuración esencial. Dejar mapa preciso, menú avanzado y preventivo fuera del cierre inicial.

## Conclusión

El sistema ya tiene demasiada superficie como para seguir creciendo sin cerrar decisiones.

Al cierre del 7 de abril de 2026, las decisiones base para auth, contexto multi-tenant, modelo tenant-client-site, settings hibrido y V1 core quedaron aprobadas. Eso permite ejecutar Fase 1 sin inventar contrato backend ni seguir moviendo la base conceptual del producto.

La condición para programar con seguridad no es “tener otra pantalla”, sino validar:

- modelo tenant-cliente-sitio,
- flujo real de cambio de empresa,
- política de scopes,
- módulos core de V1,
- y nivel real de dinamismo de menú y servicios.
