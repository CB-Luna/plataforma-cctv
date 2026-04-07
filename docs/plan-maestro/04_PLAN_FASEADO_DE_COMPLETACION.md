# 04. Plan Faseado de Completación

> Criterio rector: primero consolidar contexto, contrato y operación real; después ampliar o pulir superficies.

## Vista general

| Fase | Nombre | Resultado principal |
|---|---|---|
| F0 | Alineación y decisiones de producto | Modelo aprobado y backlog congelado por núcleo |
| F1 | Consolidación multi-tenant y scopes | Contexto de empresa confiable y no engañoso |
| F2 | Maestros operativos y UX de contexto | Cliente-sitio-activo operables sin UUIDs manuales |
| F3 | Cierre CCTV core | Inventario, importación, planos y mapa en estado defendible |
| F4 | Operación contractual | Tickets, pólizas y SLA coherentes con cobertura real |
| F5 | Backoffice enterprise | Configuración, roles, tenants, storage e IA con frontera clara |
| F6 | Calidad, hardening y handoff | QA, e2e, documentación y criterios de release cerrados |

## Estado de ejecucion

| Fase | Estado | Fecha | Evidencia |
|---|---|---|---|
| F0 | Completada | 2026-04-07 | Paquete `docs/plan-maestro/` aprobado y decisiones de producto cerradas |
| F1 | Completada | 2026-04-07 | Flujo login/select-company/contexto activo implementado en `cctv_web`, switch engañoso retirado, guards minimos aplicados, `npm test`, `npm run build` y smoke Playwright verdes |
| F2 | Pendiente | — | Requiere continuar con maestros operativos y UX de contexto |
| F3 | Pendiente | — | Requiere cierre funcional de CCTV core |
| F4 | Pendiente | — | Requiere cierre contractual de polizas y SLA |
| F5 | Pendiente | — | Requiere consolidacion de backoffice enterprise |
| F6 | Pendiente | — | Requiere hardening final, QA ampliado y handoff |

## Fase 0. Alineación y decisiones de producto

### Objetivo

Congelar vocabulario, alcance y decisiones críticas antes de tocar lógica funcional.

### Por qué existe

El repo ya tiene demasiadas piezas avanzadas para seguir implementando desde intuición. Sin esta fase, cualquier trabajo posterior refuerza incoherencias.

### Alcance

- Aprobar el paquete `docs/plan-maestro/`.
- Confirmar modelo tenant-cliente-sitio.
- Confirmar estrategia de login/cambio de empresa.
- Confirmar qué entra en V1 operativa.
- Confirmar qué capacidades se degradan explícitamente por GAP backend.

### Fuera de alcance

- Cambios de código.
- Cambios de backend.

### Tareas detalladas

1. Validar semántica de tenant, cliente y sitio.
2. Validar si el login será híbrido con selección de empresa.
3. Validar si el menú será realmente dinámico por tenant y rol.
4. Validar si la configuración se separará en global, tenant o híbrida.
5. Aceptar backlog priorizado inicial y orden de fases.

### Dependencias

- Auditoría del repo completada.
- Aprobación del responsable de producto.

### Riesgos

- Seguir construyendo sin cerrar decisiones.
- Aplazar el problema multi-tenant y moverlo a fases tardías.

### Validaciones

- Todas las decisiones críticas tienen una respuesta explícita.
- Se aprueba el núcleo de V1.
- Se acepta qué queda como GAP real.

### Criterio de salida

Existe confirmación explícita del modelo objetivo y de la Fase 1 como siguiente ejecución.

### Entregables esperados

- Documentación validada.
- Lista de decisiones cerradas.
- Lista de decisiones diferidas pero visibles.

## Fase 1. Consolidación multi-tenant y scopes

### Objetivo

Hacer confiable el contexto de empresa/tenant y eliminar comportamientos que aparentan un cambio de contexto no respaldado por el contrato real.

### Estado del checkpoint

Completado el 2026-04-07.

### Resultado materializado

- `LoginResponse` ya se alinea al payload real con `companies`.
- El login multiempresa ahora usa seleccion explicita de empresa antes de emitir el contexto final de trabajo.
- Se elimino la dependencia funcional de `X-Company-ID` y el selector engañoso de empresa en header.
- El tenant activo queda persistido como snapshot local y se rehidrata desde `/auth/me`.
- La navegacion fija de Fase 1 ya respeta permisos por ruta.
- Se agregaron guards minimos por pagina y acciones principales en tickets, clientes y configuracion.

### Validacion ejecutada

- `npm test` en `cctv_web`: OK.
- `npm run build` en `cctv_web`: OK.
- Playwright smoke Fase 1 en `http://localhost:3010`: OK sobre login, auth redirect, dashboard y settings.

### Por qué existe

Es el mayor riesgo sistémico actual. Si el tenant activo no es confiable, el resto del sistema puede verse correcto pero operar sobre el contexto equivocado.

### Alcance

- Revisar flujo login -> selección de empresa -> contexto activo.
- Eliminar dependencia falsa de `X-Company-ID` como mecanismo principal de cambio.
- Definir e implementar la fuente única del tenant activo en frontend.
- Alinear permisos y navegación con el contexto real.
- Aclarar el rol del scope global frente al scope tenant.

### Fuera de alcance

- Backend nuevo.
- CRUD de sitios.
- Auditoría o mantenimiento preventivo.

### Tareas detalladas

1. Corregir el contrato frontend de `LoginResponse` para reflejar el payload real.
2. Redefinir el flujo multiempresa usando el contrato real permitido por backend.
3. Ajustar `select-company` para que su uso no dependa de un `me.companies` engañoso.
4. Quitar o rediseñar el switch de empresa del header mientras no exista un contexto real seguro.
5. Definir hidración del tenant activo en recargas y navegación.
6. Definir visibilidad y acciones por scope.
7. Incorporar guardas mínimas de permisos fuera del sidebar.

### Dependencias

- Decisiones de Fase 0 cerradas.
- Confirmación del flujo de empresa activa.

### Riesgos

- Romper la navegación si se cambia el contexto sin estrategia clara.
- Sobreprometer multiempresa si solo se cambia la UI.

### Validaciones

- Usuario con una empresa entra directo a contexto válido.
- Usuario con múltiples empresas puede elegir contexto de forma explícita.
- Cambiar de empresa modifica realmente el contexto consumido por la app.
- Permisos visibles y acciones críticas responden al tenant/scope correcto.

### Criterio de salida

No existen más switches de empresa “visuales” sin sustento de contrato.

### Entregables esperados

- Flujo de autenticación y contexto tenant confiable.
- Criterios de permisos y scope documentados en frontend.

## Fase 2. Maestros operativos y UX de contexto

### Objetivo

Convertir cliente, sitio y activos en contexto operativo usable, sin formularios basados en UUIDs manuales.

### Por qué existe

Aunque muchos módulos ya existen, la experiencia todavía no es enterprise porque la operación diaria depende de copiar IDs o de stores que no gobiernan nada.

### Alcance

- Reemplazar UUIDs manuales por selectores y relaciones navegables donde ya existan endpoints.
- Conectar el contexto de sitio a filtros y queries donde sí aplique.
- Normalizar tablas, búsquedas, estados vacíos y errores en módulos operativos.

### Fuera de alcance

- Crear CRUD de sitios.
- Nuevos endpoints de búsqueda inexistentes.

### Tareas detalladas

1. Rediseñar formularios de tickets para seleccionar cliente, sitio y técnico sin UUID manual.
2. Rediseñar formularios de pólizas y asignación de activos.
3. Definir estrategia de uso de sitio activo en dashboards/listados.
4. Hacer explícitos los límites cuando una relación no pueda resolverse por API.
5. Revisar coherencia de breadcrumbs, deep links y navegación contextual.
6. Alinear aliases administrativos (`/users`, `/roles`, `/tenants`, etc.) con una estrategia clara.

### Dependencias

- Fase 1 completada.
- Definición oficial de tenant-cliente-sitio.

### Riesgos

- Forzar selectores donde el backend no entrega datos suficientes.
- Abrir demasiadas dependencias entre módulos.

### Validaciones

- Crear ticket sin escribir UUID manual.
- Crear/editar póliza sin depender de IDs manuales.
- El sitio activo cambia resultados o queda claramente marcado como no aplicado.
- Tablas y formularios muestran estados vacíos y de error coherentes.

### Criterio de salida

La operación básica ya no depende de conocimiento técnico de IDs para usuarios funcionales.

### Entregables esperados

- Formularios operativos normalizados.
- Contexto cliente-sitio utilizable en la experiencia.

## Fase 3. Cierre CCTV core

### Objetivo

Dejar el bloque CCTV en estado operable y honesto respecto a sus limitaciones reales.

### Por qué existe

El sistema ya tiene inventario, cámaras, NVR, modelos, importación, planos, topología, mapa y CAPEX. Falta distinguir qué queda realmente listo y qué debe degradarse o restringirse.

### Alcance

- Revisar CRUD real de cámaras y NVR.
- Cerrar importación masiva con la interfaz que el backend sí puede consumir.
- Limitar o corregir guardado de floor plans.
- Resolver cómo se presenta el mapa mientras no haya coordenadas reales.
- Confirmar rol de CAPEX/garantías como vista derivada.

### Fuera de alcance

- Nuevos endpoints de geolocalización.
- Nuevos endpoints de catálogo maestro inexistentes.

### Tareas detalladas

1. Tratar edición de cámaras según contrato real: soportada o degradada.
2. Hacer operativa la importación creando `data` y `column_mapping` útiles o rebajando el alcance visible.
3. Revisar compatibilidad entre editor de planos y formato persistido.
4. Definir mensaje/alcance del mapa con coordenadas aproximadas.
5. Verificar consistencia entre cámaras, NVR, floor plans y topology por sitio.
6. Revisar exportaciones y columnas reales en cámaras y NVR.

### Dependencias

- Fase 2 completada para contexto sitio-activo.
- Decisión explícita sobre si el mapa es core o complementario.

### Riesgos

- Mantener funcionalidades “demoables” pero no confiables.
- Perder información al guardar floor plans.

### Validaciones

- NVR CRUD funcional.
- Cámaras en estado consistente con contrato real.
- Importación utilizable con datos reales.
- Plano guarda y reabre sin degradar información permitida.
- Topología refleja activos del sitio.

### Criterio de salida

El bloque CCTV puede demostrarse y operarse sin promesas falsas de contrato.

### Entregables esperados

- CCTV core estabilizado.
- Lista explícita de workarounds todavía vigentes.

## Fase 4. Operación contractual

### Objetivo

Alinear tickets, pólizas y SLA como una sola capa operativa-contractual.

### Por qué existe

Hoy ya hay bastante funcionalidad, pero aún no está cerrada la lectura de cobertura, activos cubiertos y reglas operativas enterprise.

### Alcance

- Tickets.
- Pólizas.
- SLA.
- Relación entre activos, cobertura y operación.

### Fuera de alcance

- Preventive maintenance sin backend.
- Facturación avanzada si no entra a V1.

### Tareas detalladas

1. Alinear formulario y detalle de tickets con cliente, sitio, activo, SLA y póliza.
2. Revisar estados válidos y transiciones.
3. Revisar linking de activos en pólizas.
4. Definir qué representa “cobertura” en UI y detalle.
5. Revisar métricas de dashboard relacionadas con SLA y pólizas.
6. Documentar claramente lo que es contractual vs operativo.

### Dependencias

- Fase 2 para selectores operativos.
- Decisiones de producto sobre servicio habilitado vs póliza.

### Riesgos

- Duplicar conceptos de cobertura.
- Tratar SLA como dato aislado y no como regla del contrato.

### Validaciones

- Un ticket puede relacionarse con cliente, sitio y cobertura de forma entendible.
- Una póliza muestra activos cubiertos y vigencia clara.
- Las políticas SLA son editables y visibles desde la operación.

### Criterio de salida

La capa contractual deja de ser un conjunto de módulos sueltos y se vuelve un flujo coherente.

### Entregables esperados

- Flujo operativo-contractual consolidado.
- Criterios claros de cobertura y SLA.

## Fase 5. Backoffice enterprise

### Objetivo

Separar y cerrar la administración enterprise del portal operativo.

### Por qué existe

El backend ya tiene capacidad amplia de tenants, permisos, menú, storage e IA. El frontend necesita una frontera más clara entre operación tenant y backoffice global.

### Alcance

- Empresas/tenants.
- Usuarios.
- Roles y permisos.
- Tema y configuración general.
- Storage.
- IA.
- Evaluación del módulo de menú por plantillas.

### Fuera de alcance

- Nuevos módulos globales que el backend no soporte.
- Auditoría si sigue sin endpoint.

### Tareas detalladas

1. Definir shell o navegación para administración global vs tenant.
2. Cerrar UX de usuarios y roles con sus limitaciones reales.
3. Incorporar capacidades útiles faltantes ya soportadas, como logo de tenant.
4. Decidir si el frontend administrará plantillas de menú o solo las consumirá.
5. Revisar coherencia de storage e IA respecto al alcance tenant/global.
6. Documentar ownership de cada tab de configuración.

### Dependencias

- Fases 1 a 4 estabilizadas.
- Decisión sobre menú dinámico y separación global/tenant.

### Riesgos

- Mezclar configuración global con tenant en una sola vista sin política.
- Invertir demasiado en menú avanzado antes de cerrar scopes.

### Validaciones

- Administración de usuarios y roles consistente.
- Empresas con configuración suficiente.
- Storage e IA operan con contexto correcto.
- Navegación administrativa sin ambigüedad.

### Criterio de salida

El backoffice deja de ser “una tab grande” y pasa a ser una capa administrable con ownership claro.

### Entregables esperados

- Backoffice más coherente.
- Configuración enterprise cerrada para V1/V1.1.

## Fase 6. Calidad, hardening y handoff

### Objetivo

Cerrar calidad, validaciones, documentación operativa y preparación de entrega.

### Por qué existe

El repo hoy builda y tiene tests unitarios, pero todavía no hay una matriz de QA ejecutada contra un entorno coherente del monorepo.

### Alcance

- Alinear puertos y scripts.
- Revisar Playwright y base URLs.
- Ejecutar QA funcional por módulo.
- Alinear docs, seeds, datos demo y release notes.

### Fuera de alcance

- Backend nuevo.
- Nuevas features fuera del backlog priorizado.

### Tareas detalladas

1. Corregir drift de puertos y documentación técnica.
2. Actualizar Playwright y criterios de arranque del entorno.
3. Ejecutar matriz de validación por módulo y fase.
4. Documentar limitaciones reales de V1.
5. Preparar handoff de implementación y operación.

### Dependencias

- Fases anteriores completadas o congeladas.
- Entorno de QA con backend y datos compatibles.

### Riesgos

- Cerrar “release” con documentación vieja.
- Aceptar como production-ready flujos aún degradados.

### Validaciones

- Build verde.
- Unit tests verdes.
- E2E mínimos verdes.
- Checklist manual completado.
- Documentación sincronizada.

### Criterio de salida

Existe una definición defendible de “listo para entrega” y de “GAP aceptado”.

### Entregables esperados

- Release checklist.
- Matriz de QA ejecutada.
- Handoff claro para implementación o despliegue.

## Recomendación de arranque real

La primera fase a ejecutar en código debe ser **Fase 1: Consolidación multi-tenant y scopes**.

La razón es simple:

- hoy el mayor riesgo del producto es el contexto,
- no el inventario,
- no tickets,
- y no diseño visual.

Si esa fase no se resuelve primero, cualquier avance posterior seguirá montado sobre un tenant activo ambiguo.
