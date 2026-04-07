# 07. Riesgos, Dependencias y Bloqueos

> Criterio rector: el mayor riesgo del proyecto no es "falta de avance visible", sino tomar decisiones de UX y producto encima de contratos parciales o ambiguos.

## Panorama general

El repositorio ya tiene suficiente superficie como para aparentar mayor madurez de la que realmente garantiza su integracion. Eso genera un tipo de riesgo especialmente delicado: el sistema puede verse enterprise sin haber consolidado todavia el contexto multi-tenant, la gobernanza por permisos y el modelo operativo tenant-cliente-sitio.

## Riesgos tecnicos

- Deriva de contrato entre frontend y backend en autenticacion, cambio de empresa y edicion de camaras.
- Dependencia de stores locales que no gobiernan de verdad la consulta al backend.
- Uso de datos sinteticos para mapa y de persistencia parcial en floor plans.
- Port drift entre instrucciones, scripts, docs y configuracion de pruebas.
- Guardas de permiso insuficientes fuera del sidebar.

## Riesgos de producto

- Ambiguedad entre tenant, empresa y cliente en la narrativa del producto.
- Sobrepromesa multiempresa por UI antes de consolidar el flujo real.
- Confusion entre modulo core, modulo parcial y modulo solo demostrable.
- Mezcla de configuracion global y tenant sin ownership claro.
- Falta de definicion sobre catalogo de servicios habilitados por empresa.

## Dependencias de backend

- `POST /auth/login` como punto real para resolver contexto tenant con `tenant_id` opcional.
- Ausencia de `POST /auth/refresh`.
- Ausencia de `POST /auth/switch-company`.
- Ausencia de CRUD de sitios.
- Ausencia de endpoints de auditoria y mantenimiento preventivo.
- Soporte existente para menu templates y asignacion por tenant aun no capitalizado en frontend.
- Endpoint de logo de tenant existente, sin cierre UI actual.

## Bloqueos actuales

- No hay decision cerrada sobre como debe funcionar el login multiempresa.
- No hay decision cerrada sobre la separacion tenant vs cliente.
- No hay decision cerrada sobre si el menu sera fijo o dinamico por tenant/rol/servicio.
- No hay definicion explicita sobre que partes de `/settings` son globales y cuales tenant.
- No existe un dataset de validacion multiempresa claramente identificado para QA funcional.

## Deuda visual

- El header sugiere un cambio de empresa "listo" cuando no existe garantia de cambio real de contexto.
- El mapa luce convincente aunque depende de coordenadas aproximadas.
- Algunas rutas administrativas parecen modulos autonomos cuando son alias de configuracion.
- La importacion aparenta flujo completo aunque hoy no construye una carga util.

## Deuda funcional

- Formularios operativos que exigen UUIDs manuales.
- Selector de sucursal sin efecto transversal en queries.
- Floor plans con guardado potencialmente degradante.
- Permisos sin enforcement real a nivel accion/pagina.
- Clientes y roles con ciclos de vida parciales por contrato backend.

## Deuda de datos demo

- Credenciales prellenadas o accesos demo pueden dar falsa seguridad sobre la cobertura del flujo real.
- Coordenadas de mapa no representan ubicacion productiva.
- Documentacion previa aun arrastra puertos o endpoints ya superados.
- Scripts de verificacion no reflejan el contrato vigente.

## Deuda de permisos y multi-tenant

- El scope global frente al scope tenant no esta expresado en UX.
- La empresa activa no tiene una estrategia unica y comprobable de hidratacion.
- El cambio de empresa no recalcula de forma confiable permisos y datos visibles.
- El menu hardcodeado oculta el verdadero valor del backend multi-tenant.

## Matriz de riesgos

| Riesgo | Impacto | Probabilidad | Mitigacion | Bloqueo actual |
|---|---|---|---|---|
| Cambio de empresa solo visual mediante store local | Alto | Alta | Redefinir flujo multiempresa sobre contrato real y retirar el switch engañoso | Si; depende de DEC-01 y Fase 1 |
| `LoginResponse` incompleto frente al backend real | Alto | Alta | Alinear tipos, store y flujo de login | Si; bloquea validacion confiable multiempresa |
| Uso de `X-Company-ID` sin respaldo de tenant real en backend | Alto | Alta | Eliminarlo como fuente principal de contexto | Si; bloquea confianza en datos por empresa |
| Selector de sucursal sin efecto en queries | Medio | Alta | Conectarlo a query keys o degradarlo honestamente | Si; bloquea narrativa de operacion por sitio |
| Edicion de camaras no soportada por contrato real | Medio | Media | Confirmar soporte o ocultar la accion | No total, pero bloquea cierre honesto de CCTV core |
| Importacion masiva incompleta | Alto | Alta | Rehacer payload o limitar visibilidad del modulo | Si; bloquea cierre funcional de importaciones |
| Floor plans con persistencia parcial | Medio | Media | Limitar herramientas y transparentar alcance real | No total, pero bloquea promesa enterprise de planos |
| Mapa basado en coordenadas sinteticas | Medio | Alta | Etiquetar como aproximacion o diferirlo de V1 core | No total; bloquea usarlo como evidencia operativa |
| Permisos sin guardas por pagina/accion | Alto | Alta | Implementar enforcement minimo transversal | Si; bloquea confianza de seguridad funcional |
| Mezcla de configuracion global y tenant en `/settings` | Medio | Alta | Separar ownership en UX y documentacion | Si; bloquea cierre de backoffice |
| Port drift entre docs, scripts, build y pruebas | Medio | Alta | Normalizar puertos, base URLs y scripts de QA | No total, pero frena onboarding y validacion |
| Dataset de prueba multiempresa insuficiente o incierto | Alto | Media | Definir dataset controlado de validacion funcional | Si; bloquea comprobar Fase 1 con seguridad |
| Menu dinamico backend no usado por frontend | Medio | Media | Decidir estrategia y evitar deuda estructural temprana | No total; condiciona escalabilidad del producto |
| Falta de CRUD de sitios en backend | Alto | Alta | Tratar sitios como entidad consumida y documentar restriccion | Si; limita Fase 2 y Fase 3 |
| Ausencia de refresh token | Medio | Alta | Aceptar relogin explicito y manejar expiracion con claridad | No total; afecta UX y seguridad operativa |
| Ausencia de auditoria y mantenimiento preventivo | Medio | Alta | Mantener fuera del alcance V1 y documentar GAP | No para el core inmediato, si para roadmap enterprise |

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
- Decision sobre si el menu sera plenamente dinamico.

### Fase 6

- Entorno reproducible con puertos, scripts y pruebas consistentes.
- Criterio de release que acepte limitaciones abiertas visiblemente documentadas.

## Estrategia de mitigacion recomendada

1. Tratar multi-tenant y scopes como el verdadero problema central, no como detalle de UI.
2. Congelar decisiones de producto antes de expandir modulos secundarios.
3. Degradar con honestidad cualquier capacidad que hoy sea solo aparente.
4. Separar con rigor lo core para V1 de lo deseable para una version posterior.
5. Usar evidencia de build, pruebas y validaciones por fase para evitar avance ilusorio.

## Conclusion

El proyecto ya esta lo bastante avanzado como para requerir disciplina de consolidacion, no expansion impulsiva. Si se reduce primero el riesgo de contexto, permisos y contrato, el resto del trabajo se vuelve acumulativo. Si no, cada nueva pantalla incrementa la deuda invisible.
