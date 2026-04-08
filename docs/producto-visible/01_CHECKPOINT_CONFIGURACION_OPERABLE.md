# Checkpoint Configuracion Operable

## Meta

Hacer que `Configuracion` deje de sentirse como una coleccion de tabs tecnicas y pase a sentirse como el centro de gobierno del producto multi-tenant.

## Resultado visible esperado

- La tab `Empresas` muestra una empresa seleccionada como `empresa operable`.
- La tab `Empresas` deja visible:
  - branding,
  - paquete,
  - modulos habilitados,
  - admin inicial,
  - y preview del portal.
- La tab `Servicios y paquetes` deja visible:
  - que incluye cada plan,
  - que dominios quedan visibles,
  - y como aterriza eso en una empresa real.
- La tab `Usuarios` deja visible:
  - que el admin inicial pertenece al tenant,
  - que los usuarios son internos del tenant,
  - y que no se trata del backoffice global.
- La tab `Roles` deja visible:
  - que los roles viven dentro del tenant,
  - que solo gobiernan los modulos de esa empresa,
  - y que no equivalen a roles globales del sistema.
- La tab `Tema` deja visible:
  - branding del tenant,
  - plantillas reutilizables,
  - y preview del portal con la paleta elegida.

## Limites honestos

- El backend sigue sin CRUD completo de usuarios internos.
- Los modulos `Control de Acceso` y `Redes` siguen en estado `WIP`.
- Las plantillas de tema guardadas en esta iteracion viven localmente en el navegador, no en un CRUD global.
