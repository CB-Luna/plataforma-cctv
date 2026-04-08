import type { ProductServiceCode } from "@/lib/product/service-catalog";
import type { ModuleScaffoldNavItem } from "@/components/product/module-scaffold-shell";

export interface ModuleScaffoldDefinition {
  serviceCode: ProductServiceCode;
  title: string;
  summary: string;
  sections: ModuleScaffoldNavItem[];
  productNotes: string[];
  backendGaps: string[];
}

export const ACCESS_CONTROL_SECTIONS: ModuleScaffoldNavItem[] = [
  {
    key: "overview",
    label: "Resumen",
    href: "/access-control",
    description: "Vista ejecutiva del dominio y de las piezas que ya existen como scaffold WIP.",
  },
  {
    key: "inventory",
    label: "Inventario",
    href: "/access-control/inventory",
    description: "Base para activos, puertas, lectores y controladoras cuando el modelo operativo cierre.",
  },
  {
    key: "technical-sheets",
    label: "Fichas tecnicas",
    href: "/access-control/technical-sheets",
    description: "Lugar reservado para modelos, compatibilidades y detalles tecnicos del dominio.",
  },
  {
    key: "maintenance",
    label: "Mantenimiento",
    href: "/access-control/maintenance",
    description: "Espacio para rutinas preventivas, correctivas y agenda del modulo.",
  },
  {
    key: "incidents",
    label: "Incidentes",
    href: "/access-control/incidents",
    description: "Superficie para eventos, hallazgos y escalamiento operativo futuro.",
  },
  {
    key: "reports",
    label: "Reportes",
    href: "/access-control/reports",
    description: "Base para KPIs, trazabilidad y tableros del dominio una vez exista data real.",
  },
];

export const NETWORKING_SECTIONS: ModuleScaffoldNavItem[] = [
  {
    key: "overview",
    label: "Resumen",
    href: "/networking",
    description: "Vista ejecutiva del dominio de redes dentro del tenant activo.",
  },
  {
    key: "inventory",
    label: "Inventario",
    href: "/networking/inventory",
    description: "Base para switches, routers, APs y equipos de red del tenant.",
  },
  {
    key: "technical-sheets",
    label: "Fichas tecnicas",
    href: "/networking/technical-sheets",
    description: "Espacio para modelos, topologias y fichas de referencia de la infraestructura.",
  },
  {
    key: "maintenance",
    label: "Mantenimiento",
    href: "/networking/maintenance",
    description: "Seccion prevista para mantenimiento preventivo y correctivo del dominio.",
  },
  {
    key: "incidents",
    label: "Incidentes",
    href: "/networking/incidents",
    description: "Base para eventos, caidas y afectaciones de conectividad.",
  },
  {
    key: "reports",
    label: "Reportes",
    href: "/networking/reports",
    description: "Lugar para futuras metricas, cumplimiento y trazabilidad del modulo.",
  },
];

export const MODULE_SCAFFOLDS: Record<"access_control" | "networking", ModuleScaffoldDefinition> = {
  access_control: {
    serviceCode: "access_control",
    title: "Control de Acceso",
    summary:
      "Este dominio ya es parte visible del producto. Hoy existe como scaffold/WIP para que el tenant lo vea, lo navegue y lo incorpore a su roadmap operativo sin confundirlo con un modulo cerrado.",
    sections: ACCESS_CONTROL_SECTIONS,
    productNotes: [
      "El servicio ya puede habilitarse por tenant desde Empresas y Servicios y paquetes.",
      "El side menu ya responde a tenant + servicio habilitado + estado del modulo.",
      "Las rutas del dominio ya existen y respetan el contexto del tenant activo.",
      "El producto ya comunica que este dominio esta en construccion, no oculto.",
    ],
    backendGaps: [
      "No existe CRUD operativo de puertas, lectores, credenciales, eventos ni controladoras en el backend fijo.",
      "No existe API auditada para incidentes o reportes especificos del dominio.",
      "No existe RBAC fino del dominio; la visibilidad actual usa servicio habilitado y permisos base de descubrimiento.",
    ],
  },
  networking: {
    serviceCode: "networking",
    title: "Redes",
    summary:
      "Este dominio ya es parte visible del producto. Hoy existe como scaffold/WIP para que el tenant vea la linea de crecimiento del sistema hacia infraestructura y redes.",
    sections: NETWORKING_SECTIONS,
    productNotes: [
      "El servicio ya puede habilitarse por tenant desde la capa global.",
      "El runtime ya muestra el dominio cuando el tenant tiene Redes habilitado.",
      "Las pantallas base ya existen y forman parte del portal de empresa.",
      "El estado WIP queda explicito para no vender un dominio no terminado como si ya fuera operativo.",
    ],
    backendGaps: [
      "No existe CRUD operativo del dominio de redes como modulo separado en la API actual.",
      "No hay topologia, monitoreo, alertas ni catalogo de equipos de red cerrados como flujo real.",
      "No existen permisos especificos del dominio; la visibilidad actual usa servicio habilitado y permisos base de descubrimiento.",
    ],
  },
};
