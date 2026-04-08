# cctv_web

Frontend Next.js del monorepo CCTV.

## Puerto operativo actual

- Frontend local: `http://127.0.0.1:3011`
- Playwright por defecto: `http://127.0.0.1:3011`
- Backend live cuando se use contrato real: `http://localhost:8088/api/v1`

## Comandos base

```bash
npm install
npm run dev
npm run build
npm run start
npm run test
npm run test:smoke
```

## Secuencia reproducible recomendada

1. `npm run dev`
   Usa el shell local en `3011` para desarrollo interactivo.
2. `npm run build`
   Verifica que el frontend compile en modo produccion.
3. `npm run start`
   Levanta la build en `3011`.
4. `npm run test:smoke`
   Ejecuta el smoke reproducible de Fase 7 sobre `next start`.

## Modos de validacion

- `npm run test`
  Vitest para stores, hooks, utilidades y componentes.
- `npm run test:smoke`
  Playwright sobre `next start` en `3011` con contrato mockeado en navegador real.
- `npm run test:e2e`
  Suite Playwright abierta. Puede requerir mocks adicionales o backend live segun el spec.

## Regla importante

El smoke actual no golpea un backend vivo del workspace. Valida shell real, rutas reales y contrato esperado por medio de mocks controlados.

`3010` queda como referencia historica del monorepo, pero la base operativa vigente de Fase 7 para este frontend es `3011` porque `3010` ya estaba ocupado en este workspace.

La evidencia y limitaciones vigentes de Fase 7 estan documentadas en:

- `docs/plan-maestro/11_ENTORNO_REPRODUCIBLE_Y_SMOKE_F7.md`
- `docs/plan-maestro/05_VALIDACIONES_Y_CRITERIOS_DE_ACEPTACION.md`
