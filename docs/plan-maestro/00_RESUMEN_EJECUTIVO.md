# 00. Resumen Ejecutivo

> Fecha de auditoria: 2026-04-07  
> Alcance: monorepo `sistema-camaras-mono` con foco operativo en `cctv_web/`  
> Restriccion critica: `cctv_server/` se trata como contrato fijo y no forma parte del alcance de cambios

## Que es hoy el sistema

El repo contiene un monorepo real con:

- `cctv_server/`: backend Go con rutas, migraciones y contrato API existentes.
- `cctv_web/`: frontend Next.js 16 con App Router, React Query, Zustand, `ky`, Tailwind y shadcn/ui.
- `cctv_mobile/`: app Flutter en estado inicial.
- `docker/` y `scripts/`: infraestructura y utilitarios de levantamiento.

Hoy el sistema ya no esta en fase de maqueta. El frontend web compila, tiene superficie funcional amplia y varias fases tecnicas ya ejecutadas. Pero eso no significa que el producto enterprise esperado este completamente cerrado.

## Que ya esta avanzado

En `cctv_web/` hay evidencia clara de avance real en:

- autenticacion, layout de dashboard y navegacion principal,
- inventario CCTV: camaras, NVR, fichas tecnicas, importaciones, planos y CAPEX/garantias,
- operacion: tickets, clientes, polizas y SLA,
- configuracion: usuarios, empresas, roles y permisos, tema, IA y storage,
- branding tenant y consola inicial de `menu_templates`,
- pruebas unitarias y build de produccion en verde.

## Que tipo de producto esta intentando ser

La direccion natural del repo sigue siendo una plataforma enterprise multi-tenant con dos planos:

- plano global/backoffice: gobierno de tenants, branding, permisos, plantillas de menu, storage, IA y administracion transversal,
- plano tenant/operativo: inventario, tickets, polizas, SLA, clientes, sitios y operacion diaria por empresa.

Ese modelo sigue siendo valido. Lo que cambio es la lectura del roadmap:

**el sistema ya tiene base tecnica fuerte, pero todavia no cierra la experiencia SaaS enterprise esperada por negocio.**

## Que quedo realmente resuelto en Fases 1-5

Las Fases 1-5 si dejaron resuelto:

- contexto multi-tenant mas honesto,
- bloque CCTV defendible respecto al contrato,
- operacion contractual mas coherente,
- y un backoffice enterprise inicial mejor ordenado.

## Que NO quedo realmente resuelto

No quedo cerrado todavia:

- el onboarding real del tenant de punta a punta,
- el bootstrap del admin inicial de la empresa,
- la definicion real de servicios habilitados o paquetes,
- el portal tenant autocontenido,
- y `Control de Acceso` como modulo web real.

## Problema central a resolver para continuar

El problema central ya no es hacer mas pantallas ni pasar directo a hardening.

El problema central ahora es corregir la desviacion entre:

- lo ya implementado tecnicamente,
- lo que el producto aparenta poder hacer,
- y lo que el negocio realmente espera que pueda hacerse end-to-end.

## Resumen ejecutivo del plan corregido

La recomendacion actualizada es avanzar asi:

1. mantener reconocidas como resueltas las Fases 1-5 en su alcance tecnico real,
2. insertar una nueva Fase 6 de correccion de rumbo producto,
3. documentar con honestidad tenant onboarding, servicios habilitados, portal tenant y `Control de Acceso`,
4. solo despues entrar a hardening,
5. y al cierre del hardening generar un nuevo paquete documental para la etapa siguiente del producto.

## Recomendacion ejecutiva

La siguiente fase real ya no debe ser "solo calidad".

La siguiente fase correcta debe ser:

**Fase 6: correccion de rumbo producto antes de cualquier hardening final.**

Sin esa fase, cualquier cierre adicional corre el riesgo de:

- reforzar la idea de que crear un tenant ya equivale a dejarlo operable,
- seguir tratando `subscription_plan` como si ya definiera modulos reales,
- mantener mezclado el portal tenant con el backoffice global,
- y seguir mencionando `Control de Acceso` como si ya existiera en la web.
