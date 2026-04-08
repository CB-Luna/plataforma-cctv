# 11. Entorno reproducible y smoke F7

> Fecha de cierre: 2026-04-08
> Checkpoints: `C7.1` completado, `C7.2` preparado
> Estado: cierre formal de `C7.1`

## Resumen ejecutivo

Para Fase 7 se fijo una base operativa unica para el frontend:

- host local del frontend en `http://127.0.0.1:3011`,
- Playwright por defecto en `http://127.0.0.1:3011`,
- smoke reproducible preparado sobre `next start`,
- y diferenciacion explicita entre validacion con mocks y validacion live contra backend.

La meta de este cierre no fue inventar infraestructura nueva, sino dejar una secuencia defendible para levantar, compilar y validar el producto actual dentro de su alcance real. El arnes de smoke ya quedo listo, pero su cierre como checkpoint separado queda pendiente para `C7.2`.

## Matriz de entorno

| Capa | Fuente vigente | Valor |
|---|---|---|
| Frontend local | `cctv_web/package.json` | `npm run dev` sobre puerto `3011` |
| Frontend start | `cctv_web/package.json` | `npm run start` sobre puerto `3011` |
| Playwright default | `cctv_web/playwright.config.ts` | `http://127.0.0.1:3011` |
| Smoke reproducible | `cctv_web/playwright.smoke.config.ts` | `next start` + Playwright + mocks de contrato |
| Backend live cuando aplique | `cctv_web/src/lib/api/client.ts` | `http://localhost:8088/api/v1` |
| Docker host port | `cctv_web/docker-compose.prod.yml` | `127.0.0.1:3011:3000` |

## Secuencia reproducible

### Desarrollo local

```bash
cd cctv_web
npm install
npm run dev
```

Resultado esperado:

- la app responde en `http://127.0.0.1:3011`,
- el shell arranca sin depender de cambiar puertos manualmente,
- y el equipo ya no tiene que adivinar si usa `3000`, `3010` o un puerto tomado por el host.

### Build y arranque de produccion local

```bash
cd cctv_web
npm run build
npm run start
```

Resultado esperado:

- la build compila sin errores,
- `next start` reutiliza el mismo puerto `3011`,
- y el smoke puede correr contra esa build sin pasos ambiguos.

### Smoke reproducible

```bash
cd cctv_web
npm run test:smoke
```

Este comando:

1. ejecuta `npm run build`,
2. levanta `next start` en `3011`,
3. corre `e2e/phase-7-smoke.spec.ts`.

## Modos de validacion y limites

| Modo | Comando | Usa mocks | Usa `next start` | Requiere backend vivo |
|---|---|---|---|---|
| Unitario | `npm run test` | Si, donde aplique | No | No |
| Smoke F7 | `npm run test:smoke` | Si | Si | No |
| E2E amplia | `npm run test:e2e` | Depende del spec | Depende del operador | Puede requerirlo |

## Decision de puerto en C7.1

Historicamente el monorepo venia documentando `3010` para frontend. Durante C7.1 se audito el entorno real y se detecto que `3010` ya estaba ocupado en este workspace por un listener ajeno al frontend.

La decision operativa fue mover la base vigente del frontend a `3011` para que:

- `dev`,
- `start`,
- y el smoke automatizado

quedaran reproducibles sin depender de apagar procesos externos.

## Cobertura preparada del smoke

`e2e/phase-7-smoke.spec.ts` valida:

- login,
- seleccion de empresa,
- persistencia del tenant activo tras refresh,
- backoffice y configuracion global,
- portal tenant,
- CCTV core actual,
- tickets,
- polizas,
- SLA.

## Datos demo y fixtures visibles

- Credencial de smoke: `admin@demo.com` / `Password123!`
- Tenants de smoke: `Bimbo` y `Liverpool`
- Fixture reutilizable de importacion: `cctv_web/e2e/fixtures/cameras-import.csv`
- Contexto contractual del smoke: controlado por mocks del propio spec

## Hallazgos visibles al preparar C7.2

| ID | Hallazgo | Clasificacion | Estado |
|---|---|---|---|
| F7-01 | El smoke reproducible actual valida contrato mockeado, no backend live del workspace | Limitacion aceptada | Visible |
| F7-02 | `Control de Acceso` sigue fuera del smoke porque ya fue auditado como dominio no construido | Limitacion aceptada | Visible |
| F7-03 | El alta general de usuarios internos sigue limitada por ausencia de `POST /users` | GAP backend | Abierto |
| F7-04 | CRUD completo de sitios/sucursales sigue sin cierre backend | GAP backend | Abierto |

## Conclusion formal de C7.1

`C7.1` queda cerrado porque:

- ya existe una ruta unica y coherente de puertos y comandos,
- ya existe smoke reproducible preparado para el flujo principal del producto actual,
- ya quedo explicito que esa validacion usa mocks sobre `next start`,
- y los limites abiertos siguen visibles, clasificados y sin maquillaje.

El siguiente paso correcto dentro de F7 es `C7.2 Smoke y QA transversal`.
