# 02. Modelo Objetivo de Producto

> Objetivo: aterrizar el producto objetivo usando únicamente capacidades ya compatibles con el contrato real del backend, sin inventar nuevas APIs.

## Principio rector

El producto debe separarse en dos planos:

- **Backoffice global**: opera la plataforma, gobierna tenants, branding, permisos, plantillas de menú, storage, IA y estándares.
- **Portal tenant/operativo**: ejecuta la operación CCTV dentro de un tenant concreto.

Ese corte ya está insinuado por el backend:

- `public.tenants` modela aislamiento real por tenant.
- `clients` modela entidades de negocio dentro del tenant.
- `sites` aparecen como ubicaciones operativas consumidas desde inventario/floor plans.
- `auth.menu_templates` y `auth.tenant_menu_assignments` apuntan a personalización por tenant.

## Lectura propuesta del dominio

### 1. Plataforma global

Es el espacio del operador central del sistema. Sus funciones objetivo son:

- alta y gobierno de tenants,
- estándares de branding,
- plantillas de menú,
- catálogo de permisos y roles globales,
- storage e IA como servicios de plataforma,
- y supervisión transversal.

No debe mezclarse con la operación diaria de tickets o inventario de un tenant salvo cuando el usuario tenga scope global explícito.

### 2. Tenant / empresa

El tenant debe asumirse como la unidad principal de aislamiento operativo y de configuración.

Recomendación de lectura:

- **tenant = empresa operadora o cuenta empresarial principal dentro de la plataforma**.
- Dentro del tenant viven sus usuarios, roles tenant, clientes, sitios, inventario, tickets, pólizas, SLA y configuración operativa.

Esto cuadra mejor con el contrato actual que tratar de usar `tenant` y `client` como sinónimos.

### 3. Cliente

El módulo `clients` no debe desaparecer ni confundirse con `tenants`.

Recomendación:

- **client = cliente atendido por el tenant**.
- Un tenant puede tener muchos clientes.
- Un cliente puede tener múltiples sitios o sucursales.

Así el producto conserva una jerarquía consistente:

**plataforma -> tenant -> cliente -> sitio -> activos / operación**

### 4. Sucursales / sitios

El sitio es la unidad operativa donde viven:

- cámaras,
- NVR,
- planos,
- topología,
- cobertura contractual,
- y tickets asociados a infraestructura concreta.

El sitio debe ser el puente entre inventario y operación, no solo un selector visual.

### 5. Usuarios

Hay dos familias de usuarios objetivo:

- usuarios globales de plataforma,
- usuarios internos del tenant.

No se recomienda mezclar ambos bajo la misma experiencia sin marcar claramente el scope activo.

## Modelo objetivo por entidad

### Plataforma global

Responsabilidades objetivo:

- administrar tenants,
- definir estándares visuales y operativos,
- gestionar menú por plantilla,
- administrar servicios de storage e IA,
- observar salud global y cumplimiento.

Módulos naturales:

- empresas/tenants,
- roles globales,
- menú y plantillas,
- storage,
- IA,
- auditoría cuando exista backend.

### Tenant / empresa

Responsabilidades objetivo:

- administrar usuarios internos,
- operar su cartera de clientes y sitios,
- gestionar su inventario,
- administrar contratos/pólizas/SLA,
- y ejecutar tickets.

Configuración propia:

- branding,
- menú visible por tenant,
- proveedores/configs de storage,
- modelos/configs de IA,
- políticas operativas.

### Cliente

Responsabilidades objetivo:

- representar a la cuenta atendida,
- agrupar sitios,
- y concentrar contexto comercial/contractual.

Relaciones deseadas:

- un cliente puede tener muchas pólizas,
- un cliente puede tener muchos sitios,
- un ticket puede apuntar a cliente y sitio,
- un dashboard tenant debe poder agregarse por cliente.

### Sitio

Responsabilidades objetivo:

- ser el contenedor operativo físico,
- agrupar NVR y cámaras,
- sostener floor plan y topología,
- servir de filtro operativo de inventario, tickets y cobertura.

En la V1 operativa el sitio debe verse como “contexto transversal”, aunque hoy el backend no soporte CRUD completo.

### Inventario por sitio

El inventario debe tratarse como el núcleo de infraestructura:

- NVR,
- cámaras,
- fichas técnicas,
- importación,
- planos,
- topología,
- CAPEX/garantías derivadas.

### Operación por sitio

La operación debe ligar:

- tickets,
- pólizas,
- SLA,
- cobertura,
- y activos cubiertos.

## Diferencias clave del modelo

### Rol

Un rol define capacidades.

No es empresa, ni sitio, ni alcance. Un rol responde a:

- qué puede ver,
- qué puede editar,
- y en qué ámbito puede hacerlo.

### Tenant

El tenant define aislamiento de datos y configuración.

Responde a:

- a qué espacio empresarial pertenece el usuario,
- qué datos puede tocar por defecto,
- qué branding, menú y servicios aplica.

### Scope

El scope define hasta dónde llega un permiso o rol.

Lectura recomendada:

- `global`: cruza tenants.
- `tenant`: opera dentro de un tenant.
- `site`: opera dentro de un sitio o subconjunto operativo.

Aunque el backend hoy no expone un modelo de scopes maduro en frontend, el producto sí debe documentarlo y reflejarlo en diseño.

### Servicio habilitado

Un servicio habilitado determina qué familias funcionales están activas para un tenant o cliente.

Ejemplos naturales:

- CCTV,
- control de acceso,
- redes,
- analítica,
- storage,
- IA.

No implica por sí solo cobertura contractual ni permiso. Es una bandera de habilitación de oferta/capacidad.

### Póliza

La póliza define el marco contractual y financiero de cobertura.

Debe responder:

- qué cliente y sitio cubre,
- desde cuándo y hasta cuándo,
- bajo qué condiciones,
- qué activos están cubiertos,
- y cómo se relaciona con SLA.

La póliza no sustituye al servicio habilitado ni al rol.

## Cómo debe convivir backoffice global con portal de empresa

### Backoffice global

Debe concentrar:

- tenants,
- estándares,
- plantillas de menú,
- roles globales,
- servicios compartidos de storage e IA,
- tableros globales cuando el scope lo permita.

### Portal de empresa

Debe concentrar:

- clientes,
- sitios,
- inventario,
- tickets,
- pólizas,
- SLA,
- usuarios y roles tenant,
- configuración propia del tenant.

### Regla de convivencia propuesta

Un usuario global debe ver el tenant activo y poder cambiar de contexto de forma explícita y segura.

Un usuario tenant no debe sentir que está dentro de un “backoffice de plataforma”, sino dentro de su operación.

## Módulos realmente core para la V1 operativa

### Core indispensables

- autenticación y contexto tenant confiable,
- selección/cambio de empresa consistente con contrato real,
- clientes y contexto de sitio,
- inventario CCTV,
- tickets,
- pólizas y SLA,
- configuración de usuarios/roles,
- dashboard operativo.

### Core importantes pero no bloqueantes de primer cierre

- floor plans,
- topología,
- CAPEX/garantías,
- storage,
- IA.

### No core para cierre inicial

- mapa con geolocalización “bonita” si no hay lat/lng real,
- auditoría mientras no exista endpoint,
- mantenimiento preventivo mientras no exista contrato backend,
- administración avanzada de plantillas de menú si antes no está resuelto el modelo de scopes.

## Traducción del modelo objetivo al repo actual

### Lo que ya acompaña este modelo

- tenants reales,
- clients reales,
- inventario por tenant,
- tickets por tenant,
- pólizas y SLA por tenant,
- menú por tenant en backend,
- storage e IA por tenant.

### Lo que falta para que el modelo se sienta coherente

- cerrar el flujo multiempresa en login y cambio de contexto,
- definir oficialmente tenant vs client vs site,
- convertir sitio en contexto operativo de verdad,
- endurecer permisos más allá del sidebar,
- y decidir cómo se habilitan módulos/servicios por tenant y por cliente.

## Recomendación de modelo objetivo

La recomendación para continuar sin romper el contrato actual es:

1. Tratar `tenant` como espacio empresarial principal.
2. Tratar `client` como cuenta atendida dentro del tenant.
3. Tratar `site` como contexto operativo transversal.
4. Mantener roles globales y roles tenant como dos planos distintos.
5. Introducir “servicios habilitados” como decisión de producto, no como invento de backend inmediato.
6. Usar pólizas y SLA como capa contractual sobre activos y operación, no como sustituto del modelo de acceso.

Ese modelo es compatible con el repo real y permite ordenar el roadmap sin inventar API nueva.
