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

## Evidencia generada

Las capturas reproducibles de esta iteracion se guardan en:

- `docs/producto-visible/evidencia/configuracion-empresas-visible.png`
- `docs/producto-visible/evidencia/configuracion-paquetes-modulos.png`
- `docs/producto-visible/evidencia/alta-empresa-con-preview.png`
- `docs/producto-visible/evidencia/portal-tenant-usuarios.png`
- `docs/producto-visible/evidencia/portal-tenant-branding.png`

## Validacion automatizada asociada

- `cctv_web/e2e/phase-7-visible-product.spec.ts`
- comando directo: `npm run test:visible-product`

Ese spec no solo valida texto; tambien genera evidencia visual para revisar el resultado de producto.
