# 05. Validaciones y Criterios de Aceptacion

> Criterio rector: una pantalla no se considera lista por verse completa, sino por operar con el contrato real disponible, en el scope correcto y con evidencia repetible. Tampoco se considera "fase cerrada" si el requerimiento de negocio que justifica esa fase sigue sin operar end-to-end.

## Principios de validacion

- Validar siempre contra el backend realmente expuesto por `cctv_server/`.
- No aceptar flujos que dependan de IDs manuales cuando el modulo pretende uso operativo cotidiano.
- No aceptar navegacion multi-tenant si el contexto visible no coincide con el contexto real de datos.
- No aceptar permisos solo de menu; las acciones criticas deben validarse tambien en pagina.
- No aceptar datos sinteticos como si fueran productivos sin etiquetarlos como aproximacion.
- No aceptar configuraciones hibridas si no esta claro que pertenece al backoffice global y que pertenece al tenant.
- No aceptar onboarding tenant como "resuelto" si al finalizar el flujo la empresa todavia no puede iniciar sesion con un admin inicial valido.
- No aceptar un plan comercial como "paquete funcional" si no existe una matriz real de servicios/modulos visibles.
- No aceptar `Control de Acceso` como modulo habilitable si no existe superficie real en repo.

## Checklist transversal de validacion

### Funcionales

- [ ] Cada modulo lista, abre detalle y ejecuta solo las acciones realmente soportadas por API.
- [ ] Los formularios envian payloads compatibles con el contrato auditado.
- [ ] Las operaciones muestran resultado consistente despues de recargar.
- [ ] Las relaciones principales tenant -> cliente -> sitio -> activo son navegables cuando la API lo permite.
- [ ] Los aliases de navegacion no duplican comportamiento ni confunden ownership funcional.
- [ ] Un tenant nuevo puede quedar operable o bien el bloqueo queda explicitamente documentado.

### Visuales

- [ ] El estado vacio comunica claramente si no hay datos o si el modulo aun tiene limitaciones de integracion.
- [ ] El estado de carga es visible y evita doble envio.
- [ ] El estado de error muestra mensaje util y recuperacion posible.
- [ ] Las tablas mantienen alineacion, labels y acciones consistentes entre modulos.
- [ ] Los tabs de configuracion distinguen visualmente contexto global, tenant o mixto.
- [ ] El usuario tenant no siente que esta dentro de un backoffice global cuando entra a operar su propio espacio.

### Permisos

- [ ] El usuario sin permiso no ve ni ejecuta acciones criticas.
- [ ] La navegacion lateral no es la unica capa de control.
- [ ] El cambio de contexto recalcula permisos y visibilidad.
- [ ] Las pantallas administrativas explicitan si son de plataforma o de tenant.
- [ ] Los roles tenant no se mezclan con los de otras empresas.

### Multi-tenant

- [ ] El login resuelve correctamente usuario de una sola empresa y usuario multiempresa.
- [ ] La empresa activa se hidrata de forma confiable al recargar.
- [ ] No existe cambio visual de empresa sin cambio real de contexto.
- [ ] El nombre de empresa activa, permisos y datos visibles corresponden al mismo tenant.
- [ ] El tenant puede quedar listo para operar despues del onboarding o el bloqueo se comunica con honestidad.

### Navegacion

- [ ] Todas las rutas visibles tienen punto de entrada, breadcrumb o CTA de regreso coherente.
- [ ] Las paginas redireccionadas a `/settings` no rompen expectativa de URL.
- [ ] Los deep links conservan contexto activo de tenant y, cuando aplique, de sitio.
- [ ] El menu responde a tenant/rol/servicio, o queda documentado como estrategia fija y temporal.

### Integridad de datos

- [ ] Las entidades muestran identificadores humanos antes que UUIDs crudos siempre que sea posible.
- [ ] Las relaciones rotas o faltantes se detectan y comunican.
- [ ] Los datos calculados y agregados declaran su fuente y limitaciones.
- [ ] Ningun modulo aparenta persistir informacion que en realidad se pierde al guardar.
- [ ] `subscription_plan` no se presenta como producto funcional si todavia es solo metadato.

### Estados vacios

- [ ] Cada modulo distingue "sin registros" de "sin permiso" y de "sin integracion".
- [ ] Los estados vacios incluyen CTA o explicacion del siguiente paso.

### Errores

- [ ] Los errores de red, autorizacion y validacion se presentan de forma diferenciada.
- [ ] Un error de una accion no rompe todo el shell de la aplicacion.
- [ ] Las acciones reintentables ofrecen una salida clara.

### Tablas, filtros, paginacion y exportacion

- [ ] Las tablas no muestran filtros que no afecten el resultado real.
- [ ] La paginacion refleja el contrato disponible o se oculta si no aplica.
- [ ] La exportacion solo se habilita donde exista evidencia de utilidad real.
- [ ] Los filtros por sitio, cliente o estado alteran realmente la consulta o lo declaran como pendiente.

### Coherencia de configuracion

- [ ] Usuarios, roles, empresas, tema, IA y storage muestran frontera de ownership clara.
- [ ] Ninguna opcion de configuracion sugiere capacidad no respaldada por contrato.
- [ ] Los cambios de configuracion muestran efecto observable o quedan documentados como limitados.
- [ ] Existe una definicion explicita de que deja a un tenant listo para iniciar sesion y operar.

## Criterios de aceptacion por fase

## Fase 0. Alineacion y decisiones de producto

- [ ] Existe decision explicita sobre modelo tenant, cliente y sitio.
- [ ] Existe decision explicita sobre login multiempresa y cambio de empresa.
- [ ] Existe lista aprobada de modulos core V1 y modulos diferidos.
- [ ] Existe criterio aprobado para clasificar features como operativas, parciales o demo.
- [ ] El backlog inicial queda priorizado y congelado por nucleo.

## Fase 1. Consolidacion multi-tenant y scopes

- [ ] `LoginResponse` y el flujo de autenticacion representan el contrato real.
- [ ] La seleccion de empresa funciona con evidencia de contexto real, no solo visual.
- [ ] El header no permite cambios falsos de empresa.
- [ ] El tenant activo se recupera de forma predecible tras recarga.
- [ ] Los permisos relevantes responden al tenant/scope activo.

## Fase 2. Maestros operativos y UX de contexto

- [ ] Tickets y polizas dejan de depender de UUIDs manuales.
- [ ] El sitio activo participa en la experiencia o queda degradado de forma honesta.
- [ ] Las pantallas administrativas alias no duplican confusamente la navegacion.
- [ ] La relacion cliente-sitio-activo es entendible para usuario no tecnico.

## Fase 3. Cierre CCTV core

- [ ] Camaras y NVR quedan alineados al CRUD realmente soportado.
- [ ] La importacion masiva funciona con payload valido o reduce su alcance visible.
- [ ] Floor plans no prometen persistencia de elementos que luego se degradan.
- [ ] El mapa explicita si usa aproximacion por ciudad y no geolocalizacion real.
- [ ] El bloque CCTV puede demostrarse sin workarounds ocultos.

## Fase 4. Operacion contractual

- [ ] Tickets, polizas y SLA comparten semantica de cobertura clara.
- [ ] Los activos cubiertos se seleccionan y consultan sin ambiguedad.
- [ ] El detalle de poliza no obliga a capturar relaciones via UUID.
- [ ] Los estados de ticket y sus acciones son coherentes con permisos y contexto.

## Fase 5. Backoffice enterprise inicial

- [ ] `/settings` deja clara la frontera global vs tenant.
- [ ] Usuarios, roles y permisos tienen criterio operativo consistente.
- [ ] Tenants/empresas muestran estado, activacion y branding en linea con API real.
- [ ] IA y storage comunican claramente si son configuracion global, tenant o hibrida.
- [ ] El menu hardcodeado y el menu dinamico tienen una estrategia definida.
- [ ] No se presenta este cierre como equivalente a tenant onboarding completo ni a portal tenant real.

## Fase 6. Correccion de rumbo producto

- [x] Existe una matriz aprobada de esperado por producto vs existente real vs faltante real.
- [x] Existe definicion de tenant operable end-to-end.
- [x] Existe conclusion explicita sobre si el bootstrap del admin inicial puede resolverse desde web con contrato actual.
- [x] Existe catalogo claro de servicios habilitados o, al menos, un modelo aprobado de como se representaran.
- [x] Existe criterio de visibilidad de menu por tenant + rol + servicio.
- [x] Existe definicion clara de que vera una empresa al iniciar sesion.
- [x] Existe auditoria honesta del estado real de `Control de Acceso`.
- [x] Queda claro que parte esta bloqueada por backend y que parte es implementable ya en web.

### Checkpoints Fase 6

#### C6.1 Onboarding tenant

- [x] Existe definicion aprobada de `tenant operable`.
- [x] Existe trazabilidad completa entre alta de tenant, branding, admin inicial y login.
- [x] Queda claro si el admin inicial puede resolverse ya con contrato actual.
- [x] Si el bootstrap falla o queda sin rol, el bloqueo queda visible en `tenant.settings.onboarding` y en la UI administrativa.
- [ ] Queda pendiente repetir el smoke contra backend real levantado en el workspace; la validacion actual fue por contrato mockeado.

#### C6.2 Servicios y paquetes

- [x] `subscription_plan` deja de presentarse como paquete funcional ya resuelto.
- [x] Existe una matriz clara entre servicio habilitado, paquete, poliza, SLA y modulo visible.
- [x] Existe criterio aprobado de como eso afecta menu y portal tenant.
- [x] Queda separada la parte implementable en web de la parte que depende de backend.

#### C6.3 Portal tenant

- [x] Existe definicion clara de que vera un usuario tenant al iniciar sesion.
- [x] Existe frontera visible y conceptual entre plataforma global y portal tenant.
- [x] Roles internos del tenant quedan diferenciados de roles globales.
- [x] Queda documentado si se requieren rutas/shells dedicadas o si basta endurecer la shell actual.

#### C6.4 Control de Acceso

- [x] Existe auditoria honesta de rutas, pantallas y APIs del dominio.
- [x] Queda claro si hoy el dominio existe, existe parcial o no existe.
- [x] Si no existe, se clasifica como etapa nueva y no como modulo ya disponible.
- [x] Existe un plan concreto para construirlo si sigue siendo objetivo del producto.

#### C6.5 Consolidacion F6

- [x] Plan, backlog, validaciones y riesgos quedan alineados al nuevo rumbo.
- [x] Existe recomendacion formal de siguiente paso antes de hardening.
- [x] No quedan contradicciones documentales sobre que si esta hecho y que no.

## Fase 7. Calidad, hardening y handoff

- [x] C7.1 Entorno reproducible completado.
- [ ] C7.2 Smoke y QA transversal completado.
- [ ] C7.3 Hardening funcional completado.
- [ ] C7.4 Handoff y criterio de release completado.
- [ ] C7.5 Paquete documental de la siguiente etapa completado.

#### C7.1 Entorno reproducible

- [x] Los puertos y URLs en docs, scripts, pruebas y comandos locales son coherentes.
- [x] Existe secuencia reproducible para `dev`, `build`, `start` y Playwright.
- [x] Se explicita cuando una validacion usa mocks, `next start` o backend vivo.
- [x] Los datos demo, fixtures y limites del entorno quedan visibles.

#### C7.2 Smoke y QA transversal

- [ ] Existe smoke test reproducible del flujo principal.
- [ ] Se valida login, seleccion de empresa y persistencia de contexto.
- [ ] Se valida experiencia backoffice y portal tenant dentro del alcance real.
- [ ] Se valida CCTV, tickets, polizas/SLA y configuracion sin vender producto inexistente.
- [ ] Cada hallazgo queda clasificado como bug, GAP backend o limitacion aceptada.

#### C7.3 Hardening funcional

- [ ] Los hallazgos criticos o altos detectados en C7.2 quedan corregidos o bloqueados formalmente.
- [ ] Permisos, scopes, menu y contexto activo se mantienen coherentes tras los fixes.
- [ ] Estados vacios, errores y navegacion principal quedan defendibles.
- [ ] No se introducen features nuevas para disfrazar huecos de producto.

#### C7.4 Handoff y criterio de release

- [ ] Existe evidencia minima de build, pruebas y validacion funcional por fase.
- [ ] La documentacion deja visibles limitaciones y GAPs aun abiertos.
- [ ] Existe runbook o guia operativa de validacion/release.
- [ ] Existe definicion defendible de "listo para entrega" para este repo.

#### C7.5 Paquete documental de la siguiente etapa

- [ ] Se genera un nuevo paquete documental para la etapa siguiente antes de continuar con nuevo producto.
- [ ] La nueva auditoria distingue implementado, parcial, faltante y bloqueado.
- [ ] Existe plan por fases de la etapa siguiente con backlog, riesgos y validaciones.
- [ ] Quedan explicitadas las decisiones de producto que requieren aprobacion antes de programar.

## Matriz de validacion por modulo

| Modulo | Validacion minima | Validacion ideal | Evidencia esperada |
|---|---|---|---|
| Login | Inicia sesion y guarda contexto valido | Resuelve usuarios monoempresa y multiempresa con ruta correcta | Captura de flujo, payload auditado y sesion persistida |
| Seleccion de empresa | Permite elegir empresa cuando aplica | Reemite contexto real y recalcula permisos | Evidencia de datos distintos por tenant y refresh consistente |
| Shell dashboard | Renderiza con tenant activo valido | KPIs y accesos respetan scope y permisos | Capturas por perfil y comprobacion de queries |
| Sidebar / menu | Oculta accesos no permitidos | Construye navegacion segun tenant, rol y servicio | Evidencia de menu por perfil o decision explicita de menu fijo |
| Selector de sitio | Refleja lista real de sitios consumibles | Cambia filtros y query keys del contexto operativo | Comparacion antes/despues de listados y detalle |
| Tenants / onboarding | Crea tenant y branding base | Deja tenant listo para iniciar sesion con admin inicial | Evidencia de tenant creado, usuario bootstrap y login exitoso o bloqueo formal |
| Usuarios tenant | Lista, edita, cambia password y roles | Alta administrativa real de nuevos usuarios internos | Evidencia de ciclo minimo real y limites del contrato |
| Roles tenant | Lista y asigna roles reales del tenant | Aisla roles por tenant y deja clara la diferencia con roles globales | Evidencia por tenant y por usuario |
| Portal tenant | Muestra experiencia coherente de empresa | Se siente separado del backoffice global | Evidencia de shell, copy y flujo de trabajo por tenant |
| Servicios habilitados | Comunica que dominios estan disponibles por empresa | Gobierna menu y visibilidad de modulos | Evidencia de matriz servicio -> menu -> tenant |
| CCTV | Muestra detalle real y acciones soportadas | Opera sin promesas falsas | Evidencia de alta, consulta, filtros y limites claros |
| Tickets | Lista, crea y actualiza acciones soportadas | Flujo sin UUIDs manuales y con permisos coherentes | Evidencia de alta, seguimiento y accion de tecnico |
| Polizas / SLA | Lista y crea con datos validos | Asigna cobertura y activos cubiertos de forma navegable | Evidencia de detalle y relaciones resueltas |
| Control de Acceso | Tiene auditoria honesta de lo que existe | Existe como modulo real, no solo como concepto | Evidencia de rutas, pantallas, APIs o conclusion formal de ausencia |
| Configuracion empresas / tenants | Lista y actualiza estado real | Incluye branding/logo cuando el endpoint existe | Evidencia de activacion/desactivacion y branding |
| Configuracion roles y permisos | Lista y actualiza sin prometer ciclo inexistente | Acciones por pagina quedan protegidas por estos permisos | Evidencia de rol creado, permisos asignados y UI gobernada |
| Tema | Carga y guarda configuracion real | Muestra efecto observable en UI | Evidencia antes/despues y persistencia |
| IA | Consulta y actualiza segun API real | Ownership de alcance global/tenant claramente definido | Evidencia de configuracion y contexto |
| Storage | Consulta y actualiza segun API real | Integra credenciales/estado sin ambiguedad | Evidencia de guardado y recarga |

## Evidencia minima de cierre por fase

- Registro de validacion funcional por modulo afectado.
- Evidencia de build frontend exitosa.
- Evidencia de prueba automatizada disponible o justificante explicito si no aplica.
- Lista de limitaciones conocidas que permanecen abiertas.
- Decision documentada cuando el alcance se reduce por GAP backend.
- Afirmacion clara de que si quedo operativo y que no.

## Evidencia ejecutada

- C6.1-C6.2:
  `npm test`: `55/55` OK
  `npm run build`: OK
  `npx playwright test e2e/phase-6-tenant-onboarding-services.spec.ts --project=chromium` con `E2E_BASE_URL=http://127.0.0.1:3060`: `3/3` OK usando mocks del contrato actual sobre `next start`
- C6.3-C6.5:
  `npm test`: `58/58` OK
  `npm run build`: OK
  `npx playwright test e2e/phase-6-tenant-onboarding-services.spec.ts e2e/phase-6-portal-tenant.spec.ts --project=chromium` con `E2E_BASE_URL=http://127.0.0.1:3062`: `6/6` OK usando mocks del contrato actual sobre `next start`
  auditoria de repo con `rg` sobre `cctv_web`, `cctv_mobile` y `cctv_server`
  evidencia formal consolidada en `09_AUDITORIA_CONTROL_DE_ACCESO.md` y `10_CIERRE_FASE_6.md`
- C7.1:
  `npm test`: `58/58` OK
  `npm run build`: OK
  `npm run test:smoke`: `5/5` OK sobre `next start` en `http://127.0.0.1:3011`, usado aqui como verificacion del arnes y de la coherencia del entorno
  verificacion de `npm run dev` con arranque local en `3011`
  evidencia formal consolidada en `11_ENTORNO_REPRODUCIBLE_Y_SMOKE_F7.md`
- Limitacion reconocida: el smoke E2E de esta fase valida navegador real y contrato esperado, pero no golpea un backend vivo en este workspace.

## Conclusion

La aceptacion del proyecto no debe basarse en cantidad de pantallas visibles, sino en confiabilidad operativa y honestidad de producto. La prueba de madurez para esta web es que el usuario sepa en que empresa trabaja, sobre que datos opera, que modulos le corresponden y que limitaciones reales siguen abiertas.
