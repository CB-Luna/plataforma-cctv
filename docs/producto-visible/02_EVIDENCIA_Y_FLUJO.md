# Evidencia y Flujo Visible

## Flujo exacto que debe poder contarse ya

1. El admin global entra a `Configuracion`.
2. En `Empresas` puede seleccionar una empresa y verla como producto real:
   - branding,
   - admin inicial,
   - modulos,
   - preview del portal.
3. En `Servicios y paquetes` puede ver que incluye cada plan y que modulos recibira esa empresa.
4. En `Usuarios` y `Roles` puede ver que el tenant opera su propio espacio interno.
5. En `Tema` puede ver branding y preview del portal.
6. En el sidebar del portal tenant ya aparecen `Control de Acceso` y `Redes` cuando el tenant los tiene habilitados.

## Evidencia mockeada previa

Las capturas reproducibles de esta iteracion se guardan en:

- `docs/producto-visible/evidencia/configuracion-empresas-visible.png`
- `docs/producto-visible/evidencia/configuracion-paquetes-modulos.png`
- `docs/producto-visible/evidencia/alta-empresa-con-preview.png`
- `docs/producto-visible/evidencia/portal-tenant-usuarios.png`
- `docs/producto-visible/evidencia/portal-tenant-branding.png`

Estas imagenes sirvieron para revisar direccion visual, pero no se toman como prueba final del flujo real.

## Evidencia real en localhost:3011

Las capturas reales de esta validacion se guardan en:

- `docs/producto-visible/evidencia-real/settings-empresas-runtime.png`
- `docs/producto-visible/evidencia-real/settings-empresas-bimbo-preconfig.png`
- `docs/producto-visible/evidencia-real/bimbo-modal-pre-save.png`
- `docs/producto-visible/evidencia-real/bimbo-onboarding-result.png`
- `docs/producto-visible/evidencia-real/bimbo-workspace-ready.png`
- `docs/producto-visible/evidencia-real/bimbo-portal-dashboard.png`
- `docs/producto-visible/evidencia-real/bimbo-portal-settings.png`

## Flujo real confirmado

1. `admin@demo.com` inicia sesion en `http://localhost:3011/login`.
2. En `Configuracion > Empresas`, elige `Bimbo`.
3. Edita `Bimbo`, define branding base, paquete y modulos habilitados.
4. Bootstrapea `admin.bimbo@demo.com`.
5. El workspace de `Empresas` muestra readiness `Lista para iniciar sesion` con evidencia persistida.
6. `admin.bimbo@demo.com` inicia sesion de verdad en el sistema.
7. El portal real de `Bimbo` ya muestra `Control de Acceso` y `Redes` en el menu runtime.

## Validacion automatizada asociada

- `cctv_web/e2e/phase-7-visible-product.spec.ts`
- comando directo: `npm run test:visible-product`

Ese spec sigue siendo util para exploracion visual, pero la aceptacion de este checkpoint se apoya en la evidencia real listada arriba.
