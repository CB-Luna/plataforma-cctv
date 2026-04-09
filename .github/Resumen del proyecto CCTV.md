# Plataforma CCTV — Definición de Producto (Versión Enterprise)

## 🧠 Concepto central

Este sistema es una **plataforma multi-tenant configurable**, donde cada empresa no es solo un registro, sino un **entorno completo construido dinámicamente** a partir de:

- módulos
- packs
- temas
- roles
- permisos
- servicios

> No es un sistema de cámaras.  
> Es un **constructor de sistemas CCTV por empresa**.

---

## 🏗️ Arquitectura conceptual

Nivel 1 — Plataforma (Admin Sistema)  
Nivel 2 — Empresa (Tenant)  
Nivel 3 — Sucursal (Operación)

---

## 🔥 Lógica REAL que define el sistema

### 1. Creación de empresa = ensamblaje de sistema

Cuando el Admin crea una empresa, no solo registra datos.

Está construyendo un sistema completo:

- identidad visual (tema)
- capacidades (módulos/packs)
- estructura de acceso (roles)
- permisos
- servicios habilitados

---

### 2. Módulos

Son las unidades funcionales del sistema.

Ejemplo:
- CCTV
- Redes
- Tickets
- Planos
- IA

---

### 3. Packs

Agrupaciones reutilizables de módulos.

Permiten escalar configuración rápidamente.

---

### 4. Temas

Cada empresa tiene identidad visual propia:

- colores
- tipografías
- estilos UI

---

### 5. Roles y permisos

Controlan:

- qué ve el usuario
- qué puede hacer
- qué puede modificar

---

### 6. Servicios por rol

Controlan capacidades reales del negocio:

- importar datos
- editar planos
- usar IA
- exportar

---

## 🏢 Operación por empresa

Cada empresa funciona como sistema independiente:

- sucursales
- cámaras
- inventario
- tickets
- planos

---

## ⚠️ Regla crítica

Nunca mezclar:

- plataforma
- empresa
- operación

---

## 🚀 Enfoque

Este sistema es:

> una plataforma configurable tipo SaaS, donde cada empresa es un sistema construido a partir de reglas.

---

## 💡 Idea clave final

No estás construyendo un sistema CCTV.

Estás construyendo:

**una plataforma que crea sistemas CCTV personalizados por empresa.**
