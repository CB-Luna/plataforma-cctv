# 05. Validaciones y Criterios de Aceptacion

> Criterio rector: una pantalla no se considera "lista" por verse completa, sino por operar con el contrato real disponible, en el scope correcto y con evidencia repetible.

## Principios de validacion

- Validar siempre contra el backend realmente expuesto por `cctv_server/`.
- No aceptar flujos que dependan de IDs manuales cuando el modulo pretende uso operativo cotidiano.
- No aceptar navegacion multi-tenant si el contexto visible no coincide con el contexto real de datos.
- No aceptar permisos "solo de menu"; las acciones criticas deben validarse tambien en pagina.
- No aceptar datos sinteticos como si fueran productivos sin etiquetarlos como aproximacion.
- No aceptar configuraciones hibridas si no esta claro que pertenece al backoffice global y que pertenece al tenant.

## Checklist transversal de validacion

### Funcionales

- [ ] Cada modulo lista, abre detalle y ejecuta solo las acciones realmente soportadas por API.
- [ ] Los formularios envian payloads compatibles con el contrato auditado.
- [ ] Las operaciones de crear/editar/eliminar muestran resultado consistente despues de recargar.
- [ ] Las relaciones principales tenant -> cliente -> sitio -> activo son navegables cuando la API lo permite.
- [ ] Los aliases de navegacion no duplican comportamiento ni confunden ownership funcional.

### Visuales

- [ ] El estado vacio comunica claramente si no hay datos o si el modulo aun tiene limitaciones de integracion.
- [ ] El estado de carga es visible y evita doble envio.
- [ ] El estado de error muestra mensaje util y recuperacion posible.
- [ ] Las tablas mantienen alineacion, labels y acciones consistentes entre modulos.
- [ ] Los tabs de configuracion distinguen visualmente contexto global, tenant o mixto.

### Permisos

- [ ] El usuario sin permiso no ve ni ejecuta acciones criticas.
- [ ] La navegacion lateral no es la unica capa de control.
- [ ] El cambio de contexto recalcula permisos y visibilidad.
- [ ] Las pantallas administrativas explicitan si son de plataforma o de tenant.

### Multi-tenant

- [ ] El login resuelve correctamente usuario de una sola empresa y usuario multiempresa.
- [ ] La empresa activa se hidrata de forma confiable al recargar.
- [ ] No existe cambio visual de empresa sin cambio real de contexto.
- [ ] El nombre de empresa activa, permisos y datos visibles corresponden al mismo tenant.

### Navegacion

- [ ] Todas las rutas visibles tienen punto de entrada, breadcrumb o CTA de regreso coherente.
- [ ] Las paginas redireccionadas a `/settings` no rompen expectativa de URL.
- [ ] Los deep links conservan contexto activo de tenant y, cuando aplique, de sitio.

### Integridad de datos

- [ ] Las entidades muestran identificadores humanos antes que UUIDs crudos siempre que sea posible.
- [ ] Las relaciones rotas o faltantes se detectan y comunican.
- [ ] Los datos calculados y agregados declaran su fuente y limitaciones.
- [ ] Ningun modulo aparenta persistir informacion que en realidad se pierde al guardar.

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

## Criterios de aceptacion por fase

## Fase 0. Alineacion y decisiones de producto

- [ ] Existe decision explicita sobre modelo tenant, cliente y sitio.
- [ ] Existe decision explicita sobre login multiempresa y cambio de empresa.
- [ ] Existe lista aprobada de modulos core V1 y modulos diferidos.
- [ ] Existe criterio aprobado para clasificar features como "operativas", "parciales" o "demo".
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

## Fase 5. Backoffice enterprise

- [ ] `/settings` deja clara la frontera global vs tenant.
- [ ] Usuarios, roles y permisos tienen criterio operativo consistente.
- [ ] Tenants/empresas muestran estado, activacion y branding en linea con API real.
- [ ] IA y storage comunican claramente si son configuracion global, tenant o hibrida.
- [ ] El menu hardcodeado y el menu dinamico tienen una estrategia definida.

## Fase 6. Calidad, hardening y handoff

- [ ] Existe smoke test reproducible del flujo principal.
- [ ] Los puertos y URLs en docs, scripts y configuraciones son coherentes.
- [ ] Existe evidencia minima de build, pruebas y validacion funcional por fase.
- [ ] La documentacion deja visibles limitaciones y GAPs aun abiertos.

## Matriz de validacion por modulo

| Modulo | Validacion minima | Validacion ideal | Evidencia esperada |
|---|---|---|---|
| Login | Inicia sesion y guarda contexto valido | Resuelve usuarios monoempresa y multiempresa con ruta correcta | Captura de flujo, payload auditado y sesion persistida |
| Seleccion de empresa | Permite elegir empresa cuando aplica | Reemite contexto real y recalcula permisos | Evidencia de datos distintos por tenant y refresh consistente |
| Shell dashboard | Renderiza con tenant activo valido | KPIs y accesos respetan scope y permisos | Capturas por perfil y comprobacion de queries |
| Sidebar / menu | Oculta accesos no permitidos | Construye navegacion segun tenant, rol y servicio | Evidencia de menu por perfil o decision explicita de menu fijo |
| Selector de empresa | Muestra empresa activa coherente | Cambia contexto real sin incoherencia visual | Evidencia de cambio efectivo en datos consumidos |
| Selector de sitio | Refleja lista real de sitios consumibles | Cambia filtros y query keys del contexto operativo | Comparacion antes/despues de listados y detalle |
| Clientes | Lista y crea con contrato real | Permite seleccionar cliente en otros flujos sin UUID manual | Tabla funcional y formulario integrado |
| Inventario | Lista activos del contexto correcto | Filtra por cliente/sitio y soporta flujo operativo diario | Tabla, filtros y evidencia de consistencia de datos |
| Camaras | Muestra detalle real y acciones soportadas | Edita solo si el backend lo soporta o degrada la accion | Evidencia de detalle, accion disponible y resultado real |
| NVR | CRUD basico operativo | Integrado con sitio y relaciones de CCTV | Evidencia de alta, edicion, consulta y recarga |
| Importaciones | Crea batch valido o reduce alcance | Ejecuta importacion util con columna-mapeo y resultado visible | Evidencia de payload, respuesta y registros creados |
| Floor plans | Abre, edita y guarda dentro del alcance real | Reabre sin perder semantica admitida | Evidencia de persistencia antes/despues |
| Topologia | Muestra relacion de activos existente | Refleja cambios reales del sitio/plano | Evidencia visual y datos consistentes |
| Mapa | Presenta ubicaciones sin engañar | Usa coordenadas reales o etiqueta aproximacion | Evidencia de fuente de coordenadas y aviso visible |
| Tickets | Lista, crea y actualiza acciones soportadas | Flujo sin UUIDs manuales y con permisos coherentes | Evidencia de alta, seguimiento y accion de tecnico |
| Polizas | Lista y crea con datos validos | Asigna cobertura y activos cubiertos de forma navegable | Evidencia de detalle y relaciones resueltas |
| SLA | Lista y edita parametros reales | Se vincula semanticamente con polizas y operacion | Evidencia de tabla, formulario y uso posterior |
| CAPEX / garantias | Muestra datos consistentes con inventario | Explicita si es derivado y no un modulo autonomo | Evidencia de origen de datos y navegacion |
| Configuracion usuarios | Lista, crea y asigna segun permisos | Diferencia usuarios globales vs tenant si aplica | Evidencia por perfil y contexto |
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

## Conclusion

La aceptacion del proyecto no debe basarse en cantidad de pantallas visibles, sino en confiabilidad operativa. La prueba de madurez para esta web es que el usuario siempre sepa en que empresa trabaja, sobre que datos opera y que limitaciones reales siguen abiertas.
