# 07. Riesgos, Dependencias y Bloqueos

> Criterio rector: el mayor riesgo del proyecto ya no es "falta de avance visible", sino endurecer una version que se vea enterprise sin haber consolidado todavia tenant onboarding, servicios habilitados, portal tenant y la verdad del dominio `Control de Acceso`.

## Panorama general

El repositorio ya tiene suficiente superficie como para aparentar mayor madurez de la que realmente garantiza su integracion. Eso genera un tipo de riesgo delicado:

- el sistema puede verse enterprise,
- el backoffice puede lucir ordenado,
- y la plataforma puede compilar y pasar pruebas,

pero seguir sin cerrar los requerimientos de producto que el negocio espera:

- crear una empresa y dejarla lista para operar,
- asignarle modulos con sentido real,
- separar de verdad el portal tenant del backoffice global,
- y mostrar solo dominios que si existan en la web.

## Riesgos tecnicos

- Deriva de contrato entre frontend y backend en onboarding de usuarios, cambio de empresa y edicion de camaras.
- Dependencia de stores locales que no gobiernan por completo la consulta al backend.
- Uso de datos sinteticos para mapa y de persistencia parcial en floor plans.
- Port drift entre instrucciones, scripts, docs y configuracion de pruebas.
- Guardas de permiso insuficientes fuera del sidebar.
- Ausencia de un flujo administrativo protegido para alta de usuarios internos.

## Riesgos de producto

- Ambiguedad entre tenant, empresa y cliente en la narrativa del producto.
- Sobrepromesa multiempresa por UI antes de consolidar tenant operable end-to-end.
- Confusion entre `subscription_plan`, paquete funcional, servicio habilitado y modulo visible.
- Mezcla de configuracion global y tenant sin ownership suficientemente fuerte.
- Falta de definicion sobre catalogo de servicios habilitados por empresa.
- Presentar `Control de Acceso` como si ya existiera cuando hoy no hay evidencia de superficie real.

## Dependencias de backend

- `POST /auth/login` como punto real para resolver contexto tenant con `tenant_id` opcional.
- `POST /auth/register` como posible base tecnica para crear usuarios con password.
- Ausencia de `POST /auth/refresh`.
- Ausencia de `POST /auth/switch-company`.
- Ausencia de `POST /users` en el API protegido.
- Ausencia de CRUD de sitios.
- Ausencia de endpoints de auditoria y mantenimiento preventivo.
- Soporte existente para menu templates y asignacion por tenant aun no capitalizado en frontend runtime.
- Endpoint de logo de tenant existente y ya consumido desde la web.

## Bloqueos actuales

- No existe flujo cerrado de alta de tenant con admin inicial listo para operar.
- No existe definicion cerrada de que incluye realmente `basic`, `professional` o `enterprise`.
- No existe criterio operativo cerrado de visibilidad por tenant + rol + servicio.
- No existe shell tenant realmente separada del backoffice global.
- No existe un dataset de validacion para tenant onboarding completo.
- No existe evidencia auditada de un modulo operativo de `Control de Acceso`.

## Deuda visual

- El sistema puede lucir mas "enterprise" de lo que hoy realmente garantiza.
- El mapa luce convincente aunque depende de coordenadas aproximadas.
- Algunas rutas administrativas parecen modulos autonomos cuando son aliases de configuracion.
- `subscription_plan` puede interpretarse como plan funcional aunque hoy no tiene cierre real.

## Deuda funcional

- El onboarding del tenant termina antes de dejar a la empresa lista para iniciar sesion.
- Los usuarios internos del tenant no tienen alta administrativa completa en la experiencia actual.
- El menu runtime no capitaliza aun `menu_templates`.
- Los sitios/sucursales siguen consumiendose sin CRUD real.
- El portal tenant sigue parcial.
- `Control de Acceso` sigue siendo expectativa, no modulo navegable.

## Deuda de datos demo

- Credenciales demo pueden dar falsa seguridad sobre la cobertura del flujo real.
- Coordenadas del mapa no representan ubicacion productiva.
- Documentacion previa arrastra puertos o endpoints ya superados.
- No hay dataset defendible para alta de tenant + admin inicial + login real.

## Deuda de permisos y multi-tenant

- El scope global frente al scope tenant no esta expresado en toda la UX.
- La empresa activa existe, pero el tenant no tiene aun una identidad de portal suficientemente propia.
- El menu hardcodeado oculta el verdadero valor del backend multi-tenant.
- Los servicios habilitados aun no participan formalmente en la visibilidad de producto.

## Matriz de riesgos

| Riesgo | Impacto | Probabilidad | Mitigacion | Bloqueo actual |
|---|---|---|---|---|
| Declarar "terminado" el sistema sin tenant onboarding real | Alto | Alta | Insertar Fase 6 antes de hardening y exigir evidencia de tenant operable | Si |
| Tratar `subscription_plan` como paquete funcional real | Alto | Alta | Separar plan comercial, servicio habilitado y modulo visible | Si |
| Crear tenants sin admin inicial y llamar a eso onboarding completo | Alto | Alta | Definir flujo defendible o documentar bloqueo formal | Si |
| Reusar `POST /auth/register` sin decision de producto/seguridad | Alto | Media | Auditarlo y aprobar explicitamente su uso o descartarlo | Si |
| Menu por tenant administrado pero no aplicado en runtime | Medio | Alta | Definir estrategia fija o dinamica y ejecutarla sin contradicciones | Si |
| Portal tenant mezclado con backoffice global | Alto | Alta | Definir shell, narrativa y ownership reales del tenant | Si |
| Falta de CRUD de sitios en backend | Alto | Alta | Mantener sitios como entidad consumida y documentar restriccion | Si |
| Presentar `Control de Acceso` como modulo operativo sin evidencia | Alto | Alta | Auditarlo y clasificarlo como dominio inexistente o etapa futura | Si |
| Permisos sin guardas por pagina/accion en toda la superficie | Alto | Media | Implementar enforcement transversal y validarlo | Parcial |
| Mapa basado en coordenadas sinteticas | Medio | Alta | Etiquetar como aproximacion o diferirlo de V1 core | No total |
| Floor plans con persistencia parcial | Medio | Media | Mantener herramientas acotadas y validar reabrir/guardar | No total |
| Port drift entre docs, scripts, build y pruebas | Medio | Alta | Normalizar puertos, base URLs y scripts de QA | No total |
| Dataset de prueba multiempresa insuficiente o incierto | Alto | Media | Definir dataset controlado de validacion funcional | Si |
| Ausencia de refresh token | Medio | Alta | Aceptar relogin explicito y manejar expiracion con claridad | No total |
| Ausencia de auditoria y mantenimiento preventivo | Medio | Alta | Mantener fuera del alcance V1 y documentar GAP | No para el core inmediato |

## Dependencias criticas por fase

### Fase 1

- Confirmacion del modelo de login multiempresa.
- Confirmacion de tenant como contexto aislado principal.
- Dataset funcional para probar usuario monoempresa y multiempresa.

### Fase 2

- Decision firme sobre la semantica cliente-sitio.
- Estrategia de filtros y selectores sin depender de CRUD de sitios inexistente.

### Fase 3

- Decision sobre si el mapa queda como modulo core o complementario.
- Decision sobre degradacion o retiro de acciones no respaldadas en camaras e importaciones.

### Fase 4

- Decision sobre relacion entre paquete, poliza y SLA.
- Claridad sobre cobertura de activos y reglas contractuales.

### Fase 5

- Decision sobre ownership global vs tenant de `/settings`.
- Decision sobre si el menu seria plenamente dinamico o seguia fijo en runtime.

### Fase 6

- Auditoria explicita de tenant onboarding.
- Decision de producto/seguridad sobre el uso o no de `POST /auth/register` para bootstrap administrativo.
- Definicion de servicios habilitados, paquetes y visibilidad.
- Definicion de portal tenant real.
- Auditoria formal del estado de `Control de Acceso`.

### Fase 7

- Entorno reproducible con puertos, scripts y pruebas consistentes.
- Criterio de release que acepte limitaciones abiertas visiblemente documentadas.
- Paquete documental nuevo para la siguiente etapa real del producto.

## Estrategia de mitigacion recomendada

1. Tratar tenant onboarding como problema central de negocio, no como detalle tardio de UI.
2. Congelar la definicion de servicios habilitados antes de seguir decorando menus o planes.
3. Separar con rigor lo que ya es backoffice inicial de lo que todavia no es portal tenant real.
4. Auditar `Control de Acceso` antes de volver a mencionarlo como modulo habilitable.
5. Entrar a hardening solo despues de corregir esta desviacion de alcance.

## Conclusion

El proyecto ya esta suficientemente avanzado como para requerir disciplina de producto ademas de disciplina tecnica. La siguiente prioridad no es polish: es asegurar que la plataforma deje de prometer mas de lo que hoy puede demostrar.
