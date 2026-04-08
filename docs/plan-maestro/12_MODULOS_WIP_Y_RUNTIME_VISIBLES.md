# 12. Modulos WIP y Runtime Visibles

> Fecha: 2026-04-08
> Objetivo: dejar explicito que el producto ya distingue entre modulo operativo, capacidad parcial, scaffold/WIP y etapa futura, sin esconder dominios reales del runtime por falta de backend completo.

## Regla nueva de clasificacion

- Modulo operativo:
  ya tiene rutas, pantallas, datos y flujos utilizables dentro del alcance actual.
- Capacidad parcial:
  ya existe en el producto, pero como parte de una consola o flujo acotado, no como dominio lateral completo.
- Modulo scaffold/WIP:
  ya existe en side menu, rutas y pantallas, pero todavia no tiene backend o logica funcional cerrada.
- Modulo futuro/no iniciado:
  aun no existe ni en menu ni en rutas del producto.

## Regla vigente de visibilidad

La visibilidad de runtime ahora se piensa asi:

**tenant + rol + servicios habilitados + estado del modulo**

Lectura practica:

1. El tenant debe tener el servicio dentro de `enabled_services`.
2. El usuario debe cumplir el control de visibilidad vigente del shell.
3. El estado del modulo define si se muestra como:
   - operativo,
   - parcial,
   - WIP,
   - o futuro.

## Matriz actual del producto

| Dominio / servicio | Estado | Side menu | Rutas reales | Datos / flujos reales | Comentario |
|---|---|---|---|---|---|
| CCTV | Operativo | Si | Si | Si | Dominio core actual del producto |
| Storage | Parcial | No | No como dominio lateral | Si, via `Configuracion > Storage` | Capacidad real, no dominio lateral |
| IA | Parcial | No | No como dominio lateral | Si, via `Configuracion > IA` | Capacidad real, no dominio lateral |
| Control de Acceso | WIP | Si, si el tenant lo tiene habilitado | Si | No | Ya existe como scaffold visible y navegable |
| Redes | WIP | Si, si el tenant lo tiene habilitado | Si | No | Ya existe como scaffold visible y navegable |
| Otros dominios futuros | Futuro/no iniciado | No | No | No | Aun no entran al runtime |

## Efecto sobre menu y permisos

### Runtime actual

- `sidebar.tsx` ya gobierna dominios visibles por servicio habilitado.
- `layout.tsx` ya bloquea rutas si el servicio no pertenece al tenant activo.
- Los modulos WIP usan una regla temporal de descubrimiento basada en permisos base + rol visible + servicio habilitado.

### Lo que aun no queda cerrado

- `menu_templates` todavia no es la fuente unica del runtime.
- No existen permisos backend dedicados para `Control de Acceso` ni `Redes`.
- La visibilidad fina por item todavia debe madurar cuando existan APIs reales de esos dominios.

## Superficie visible ya materializada

### Control de Acceso

- `/access-control`
- `/access-control/inventory`
- `/access-control/technical-sheets`
- `/access-control/maintenance`
- `/access-control/incidents`
- `/access-control/reports`

### Redes

- `/networking`
- `/networking/inventory`
- `/networking/technical-sheets`
- `/networking/maintenance`
- `/networking/incidents`
- `/networking/reports`

## Efecto sobre tenant onboarding

Desde este punto, cuando un admin global crea o edita una empresa:

- ya puede habilitar CCTV,
- ya puede habilitar Control de Acceso,
- ya puede habilitar Redes,
- y el tenant vera esos dominios segun su configuracion y el estado del modulo.

Eso significa que el alta de tenant deja de ser una ficha decorativa y pasa a gobernar parte real del runtime.

## Regla de comunicacion correcta

Ya no debe decirse:

- "Control de Acceso no existe"
- "Redes aun no cuenta porque no tiene backend"

La forma correcta es:

- `Control de Acceso` existe como modulo scaffold/WIP visible.
- `Redes` existe como modulo scaffold/WIP visible.
- Su backend y flujos operativos siguen pendientes.

## Conclusion

El runtime del producto ya no se limita a lo 100% operativo. Desde este checkpoint, tambien puede mostrar dominios reales en construccion, siempre que:

- tengan rutas,
- tengan pantallas,
- respeten tenant y servicios habilitados,
- y se comuniquen honestamente como `WIP`.
