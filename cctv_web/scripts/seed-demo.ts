/**
 * Seed script — Populates the database with realistic demo data
 * Run: npx tsx scripts/seed-demo.ts
 *
 * Prerequisites:
 *   - Backend running on http://localhost:8087
 *   - PostgreSQL accessible on localhost:5437
 *
 * Creates: Clients, Sites, NVRs, Cameras, SLA, Policies, Tickets
 */

import pg from "pg";

const BASE_URL = process.env.API_URL ?? "http://localhost:8087/api/v1";
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://postgres:joselo1341@localhost:5437/symtickets?sslmode=disable";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@demo.com";
const ADMIN_PASS = process.env.ADMIN_PASS ?? "Password123!";

let TOKEN = "";
let COMPANY_ID = "";
let TENANT_ID = "";

// ─── Helpers ──────────────────────────────────────────────────

async function apiCall<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;
  if (COMPANY_ID) headers["X-Company-ID"] = COMPANY_ID;

  const res = await fetch(`${BASE_URL}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

function randomIp() {
  return `10.${rand(1, 254)}.${rand(1, 254)}.${rand(1, 254)}`;
}

function randomMac() {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
  ).join(":");
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startDaysAgo: number, endDaysAgo: number): string {
  const now = Date.now();
  const start = now - startDaysAgo * 86400000;
  const end = now - endDaysAgo * 86400000;
  return new Date(start + Math.random() * (end - start)).toISOString().split("T")[0];
}

// ─── Clients data ─────────────────────────────────────────────

const CLIENTS_POOL = [
  { company_name: "Soriana Híper", legal_name: "Organización Soriana S.A.B. de C.V.", rfc: "SOR850101XXX", city: "Monterrey", state: "Nuevo León", email: "seguridad@soriana.com.mx", phone: "+52 81 8040 1234" },
  { company_name: "OXXO Femsa", legal_name: "Cadena Comercial OXXO S.A. de C.V.", rfc: "CCO8605231XX", city: "Monterrey", state: "Nuevo León", email: "cctv@oxxo.com.mx", phone: "+52 81 8389 5678" },
  { company_name: "Coppel Tiendas", legal_name: "Coppel S.A. de C.V.", rfc: "COP920514XXX", city: "Culiacán", state: "Sinaloa", email: "vigilancia@coppel.com", phone: "+52 667 759 1234" },
  { company_name: "Liverpool México", legal_name: "El Puerto de Liverpool S.A.B. de C.V.", rfc: "PLI830101XXX", city: "Ciudad de México", state: "CDMX", email: "seguridad@liverpool.com.mx", phone: "+52 55 5268 1234" },
  { company_name: "Palacio de Hierro", legal_name: "Grupo Palacio de Hierro S.A.B.", rfc: "GPH871101XXX", city: "Ciudad de México", state: "CDMX", email: "cctv@palaciodehierro.com", phone: "+52 55 5229 5678" },
  { company_name: "HEB México", legal_name: "H-E-B México S. de R.L. de C.V.", rfc: "HEB970801XXX", city: "Monterrey", state: "Nuevo León", email: "seguridad@heb.com.mx", phone: "+52 81 8042 3456" },
  { company_name: "Cemex Planta Norte", legal_name: "CEMEX S.A.B. de C.V.", rfc: "CEM860101XXX", city: "San Pedro Garza García", state: "Nuevo León", email: "cctv@cemex.com", phone: "+52 81 8888 1234" },
  { company_name: "Ternium Acero", legal_name: "Ternium México S.A. de C.V.", rfc: "TER950315XXX", city: "San Nicolás", state: "Nuevo León", email: "seguridad@ternium.com.mx", phone: "+52 81 8865 5678" },
  { company_name: "Banco Banorte", legal_name: "Grupo Financiero Banorte S.A.B.", rfc: "GFB920801XXX", city: "Monterrey", state: "Nuevo León", email: "videovigilancia@banorte.com", phone: "+52 81 8319 1234" },
  { company_name: "Farmacias Guadalajara", legal_name: "Farmacias Guadalajara S.A. de C.V.", rfc: "FGU850101XXX", city: "Guadalajara", state: "Jalisco", email: "cctv@farmaciasguadalajara.com", phone: "+52 33 3818 5678" },
  { company_name: "Elektra Grupo Salinas", legal_name: "Grupo Elektra S.A.B. de C.V.", rfc: "GEL870101XXX", city: "Ciudad de México", state: "CDMX", email: "seguridad@elektra.com.mx", phone: "+52 55 5140 1234" },
  { company_name: "Cinépolis VIP", legal_name: "Cinépolis de México S.A. de C.V.", rfc: "CDM710401XXX", city: "Morelia", state: "Michoacán", email: "cctv@cinepolis.com", phone: "+52 443 322 5678" },
  { company_name: "Aeropuerto MTY", legal_name: "OMA - Grupo Aeroportuario Centro Norte", rfc: "GAC980101XXX", city: "Apodaca", state: "Nuevo León", email: "vigilancia@oma.aero", phone: "+52 81 8369 1234" },
  { company_name: "UANL Campus", legal_name: "Universidad Autónoma de Nuevo León", rfc: "UAN330101XXX", city: "San Nicolás", state: "Nuevo León", email: "seguridad@uanl.mx", phone: "+52 81 8329 5678" },
  { company_name: "Hospital Zambrano", legal_name: "Hospital Zambrano Hellion TecSalud", rfc: "HZH100801XXX", city: "San Pedro Garza García", state: "Nuevo León", email: "cctv@tecsalud.mx", phone: "+52 81 8888 0000" },
];

const CAMERA_MODELS = [
  { name: "Avigilon H5A Dome 5MP", type: "dome", resolution: "2592x1944", megapixels: 5 },
  { name: "Avigilon H5A Bullet 8MP", type: "bullet", resolution: "3840x2160", megapixels: 8 },
  { name: "Avigilon H5A PTZ 2MP", type: "ptz", resolution: "1920x1080", megapixels: 2 },
  { name: "Hikvision DS-2CD2145", type: "dome", resolution: "2560x1440", megapixels: 4 },
  { name: "Dahua IPC-HFW2831T", type: "bullet", resolution: "3840x2160", megapixels: 8 },
  { name: "Axis P3245-LVE", type: "dome", resolution: "1920x1080", megapixels: 2 },
  { name: "Avigilon H5SL Dome 3MP", type: "dome", resolution: "2048x1536", megapixels: 3 },
  { name: "Avigilon H5A LPR", type: "lpr", resolution: "1920x1080", megapixels: 2 },
];

const AREAS = ["Estacionamiento", "Andenes", "Oficinas", "Recepción", "Pasillo Principal", "Almacén", "Entrada Principal", "Salida Emergencia", "Patio de Maniobras", "Cuarto de Máquinas", "Comedor", "Sala de Juntas", "Vigilancia", "Acceso Vehicular", "Perímetro Norte", "Perímetro Sur", "Lobby", "Escaleras", "Azotea", "Subestación"];
const ZONES = ["Interior", "Exterior", "Perímetro", "Acceso"];
const NVR_BRANDS = ["Avigilon", "Hikvision", "Dahua", "Axis"];

const TICKET_TYPES = ["corrective", "preventive", "installation", "emergency", "inspection"];
const TICKET_PRIORITIES = ["low", "medium", "high", "critical"];

// ─── Sites data ───────────────────────────────────────────────

const SITES_PER_CLIENT = [
  { name: "Sucursal Centro", address: "Av. Juárez #120, Col. Centro", city: "Monterrey", state: "Nuevo León", lat: 25.6866, lng: -100.3161 },
  { name: "Sucursal Norte", address: "Blvd. Rogelio Cantú #500", city: "San Nicolás de los Garza", state: "Nuevo León", lat: 25.7441, lng: -100.2961 },
  { name: "Sucursal Poniente", address: "Av. Vasconcelos #1200, Col. Del Valle", city: "San Pedro Garza García", state: "Nuevo León", lat: 25.6581, lng: -100.4023 },
  { name: "Sucursal Sur", address: "Carretera Nacional km 265", city: "Guadalupe", state: "Nuevo León", lat: 25.6775, lng: -100.2597 },
  { name: "Planta Industrial", address: "Parque Industrial Santa María #45", city: "Apodaca", state: "Nuevo León", lat: 25.7818, lng: -100.1884 },
  { name: "Corporativo CDMX", address: "Paseo de la Reforma #350, Piso 22", city: "Ciudad de México", state: "CDMX", lat: 19.4326, lng: -99.1332 },
  { name: "Sucursal Guadalajara", address: "Av. Vallarta #3200", city: "Guadalajara", state: "Jalisco", lat: 20.6597, lng: -103.3496 },
  { name: "Sucursal Querétaro", address: "Blvd. Bernardo Quintana #600", city: "Querétaro", state: "Querétaro", lat: 20.5888, lng: -100.3899 },
  { name: "Sucursal Puebla", address: "Blvd. Atlixcáyotl #1502", city: "Puebla", state: "Puebla", lat: 19.0414, lng: -98.2063 },
  { name: "Sucursal Mérida", address: "Calle 60 #350, Col. Centro", city: "Mérida", state: "Yucatán", lat: 20.9674, lng: -89.6259 },
  { name: "Centro de Distribución", address: "Av. López Mateos #890", city: "Saltillo", state: "Coahuila", lat: 25.4232, lng: -100.9927 },
  { name: "Sucursal Morelia", address: "Av. Camelinas #2345", city: "Morelia", state: "Michoacán", lat: 19.706, lng: -101.195 },
];

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("═══ SyMTickets CCTV — Demo Seed ═══\n");
  console.log(`API: ${BASE_URL}`);
  console.log(`DB:  ${DATABASE_URL.replace(/:[^@]+@/, ":****@")}`);

  // ── 1. Login ──
  console.log("\n[1/8] Autenticando...");
  const auth = await apiCall<{
    access_token: string;
    user: { id: string; tenant_id?: string };
    companies?: { id: string; name: string; tenant_id?: string }[];
  }>("POST", "auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASS });

  TOKEN = auth.access_token;
  if (auth.companies?.length) {
    COMPANY_ID = auth.companies[0].id;
    TENANT_ID = auth.companies[0].tenant_id ?? auth.user.tenant_id ?? "";
    console.log(`  → Empresa: ${auth.companies[0].name} (${COMPANY_ID})`);
  }
  console.log(`  → Token obtenido ✓`);

  // If we couldn't get tenant_id from login, try getting it from the DB
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    if (!TENANT_ID && COMPANY_ID) {
      const res = await pool.query("SELECT tenant_id FROM public.companies WHERE id = $1", [COMPANY_ID]);
      if (res.rows.length > 0) TENANT_ID = res.rows[0].tenant_id;
    }
    if (!TENANT_ID) {
      const res = await pool.query("SELECT id FROM public.tenants LIMIT 1");
      if (res.rows.length > 0) TENANT_ID = res.rows[0].id;
    }
    console.log(`  → Tenant: ${TENANT_ID}`);

    if (!TENANT_ID) {
      throw new Error("No se pudo obtener tenant_id. Verifica la base de datos.");
    }

    // ── 2. Create Clients ──
    console.log("\n[2/8] Creando clientes...");
    const shuffledClients = [...CLIENTS_POOL].sort(() => Math.random() - 0.5).slice(0, rand(7, 10));
    const createdClients: { id: string; company_name: string; city: string; state: string }[] = [];

    for (const c of shuffledClients) {
      try {
        const result = await apiCall<{ id: string }>("POST", "clients", {
          company_name: c.company_name,
          legal_name: c.legal_name,
          rfc: c.rfc,
          address: `Av. Principal #${rand(100, 9999)}, Col. Centro`,
          city: c.city,
          state: c.state,
          email: c.email,
          phone: c.phone,
        });
        createdClients.push({ id: result.id, company_name: c.company_name, city: c.city, state: c.state });
        process.stdout.write(`  ✓ ${c.company_name}\n`);
      } catch (e) {
        console.log(`  ✗ ${c.company_name}: ${(e as Error).message}`);
      }
    }
    console.log(`  → ${createdClients.length} clientes creados`);

    // ── 3. Create Sites (direct DB — no API endpoint) ──
    console.log("\n[3/8] Creando sitios (sucursales)...");
    const createdSites: { id: string; name: string; client_id: string }[] = [];
    let siteIdx = 0;

    for (const client of createdClients) {
      const numSites = rand(2, 4);
      for (let s = 0; s < numSites; s++) {
        const siteTemplate = SITES_PER_CLIENT[siteIdx % SITES_PER_CLIENT.length];
        const siteName = `${client.company_name} — ${siteTemplate.name}`;
        siteIdx++;

        try {
          const res = await pool.query(
            `INSERT INTO policies.sites
              (tenant_id, client_id, name, address, city, state, latitude, longitude, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
             RETURNING id`,
            [
              TENANT_ID,
              client.id,
              siteName,
              siteTemplate.address,
              siteTemplate.city,
              siteTemplate.state,
              siteTemplate.lat,
              siteTemplate.lng,
            ]
          );
          createdSites.push({ id: res.rows[0].id, name: siteName, client_id: client.id });
          process.stdout.write(`  ✓ ${siteName}\n`);
        } catch (e) {
          console.log(`  ✗ ${siteName}: ${(e as Error).message}`);
        }
      }
    }
    console.log(`  → ${createdSites.length} sitios creados`);

    // ── 4. Create NVRs ──
    console.log("\n[4/8] Creando servidores NVR...");
    const createdNvrs: { id: string; name: string; channels: number; site_id?: string }[] = [];

    for (let i = 0; i < createdSites.length; i++) {
      const site = createdSites[i];
      const numNvrs = rand(1, 2);
      for (let n = 0; n < numNvrs; n++) {
        const brand = pick(NVR_BRANDS);
        const channels = pick([8, 16, 24, 32, 48, 64]);
        const storage = pick([4, 8, 12, 16, 24, 32]);
        const nvrName = `NVR-${brand.substring(0, 3).toUpperCase()}-${String(createdNvrs.length + 1).padStart(3, "0")}`;

        try {
          const result = await apiCall<{ id: string }>("POST", "inventory/nvrs", {
            name: nvrName,
            manufacturer: brand,
            model: `${brand} ${pick(["7616NI", "NVR4232", "S3016", "VMA-AS3"])}`,
            ip_address: randomIp(),
            mac_address: randomMac(),
            camera_channels: channels,
            total_storage_tb: storage,
            ram_gb: pick([8, 16, 32, 64]),
            processor: pick(["Intel Xeon E3-1220", "Intel Xeon E5-2620", "Intel Core i7-10700", "AMD Ryzen 7 5800X"]),
            os_name: pick(["Windows Server 2019", "Windows Server 2022", "Ubuntu 22.04 LTS"]),
            vms_version: `v${rand(5, 7)}.${rand(0, 20)}.${rand(0, 30)}.0`,
            edition: pick(["Enterprise", "Standard", "Professional"]),
            status: pick(["active", "active", "active", "active", "maintenance"]),
            location: pick(["Sala Servidores A", "Sala Servidores B", "Rack Principal", "Data Center"]),
            site: site.name,
            site_id: site.id,
          });
          createdNvrs.push({ id: result.id, name: nvrName, channels, site_id: site.id });
          process.stdout.write(`  ✓ ${nvrName} (${channels}ch, ${storage}TB) → ${site.name}\n`);
        } catch (e) {
          console.log(`  ✗ ${nvrName}: ${(e as Error).message}`);
        }
      }
    }
    console.log(`  → ${createdNvrs.length} NVRs creados`);

    // ── 5. Create Cameras ──
    console.log("\n[5/8] Creando cámaras...");
    let cameraCount = 0;

    for (const nvr of createdNvrs) {
      const numCameras = Math.min(nvr.channels, rand(4, 12));
      for (let j = 0; j < numCameras; j++) {
        const model = pick(CAMERA_MODELS);
        const area = pick(AREAS);
        const zone = pick(ZONES);
        const camName = `CAM-${area.substring(0, 4).toUpperCase()}-${String(cameraCount + 1).padStart(3, "0")}`;

        try {
          await apiCall("POST", "inventory/cameras", {
            name: camName,
            camera_type: model.type,
            manufacturer: model.name.split(" ")[0],
            model: model.name,
            ip_address: randomIp(),
            mac_address: randomMac(),
            resolution: model.resolution,
            megapixels: model.megapixels,
            firmware_version: `v${rand(1, 4)}.${rand(0, 20)}.${rand(0, 99)}`,
            status: pick(["active", "active", "active", "active", "active", "inactive", "maintenance"]),
            is_active: true,
            area,
            zone,
            nvr_server_id: nvr.id,
            site_id: nvr.site_id,
            recording_mode: pick(["continuous", "motion", "scheduled"]),
            retention_days: pick([15, 30, 60, 90]),
            has_audio: Math.random() > 0.6,
            has_analytics: Math.random() > 0.5,
            poe_enabled: true,
            notes: `Cámara ${model.type} instalada en ${area} - zona ${zone}`,
          });
          cameraCount++;
        } catch {
          // silently skip
        }
      }
      process.stdout.write(`  ✓ ${nvr.name} → ${numCameras} cámaras\n`);
    }
    console.log(`  → ${cameraCount} cámaras creadas`);

    // ── 6. Create SLA Policies ──
    console.log("\n[6/8] Creando políticas SLA...");
    const slaPolicies = [
      { name: "SLA Crítico", ticket_priority: "critical", response_time_hours: 2, resolution_time_hours: 4, is_default: false },
      { name: "SLA Alto", ticket_priority: "high", response_time_hours: 4, resolution_time_hours: 8, is_default: false },
      { name: "SLA Medio", ticket_priority: "medium", response_time_hours: 8, resolution_time_hours: 24, is_default: true },
      { name: "SLA Bajo", ticket_priority: "low", response_time_hours: 24, resolution_time_hours: 72, is_default: false },
    ];

    for (const sla of slaPolicies) {
      try {
        await apiCall("POST", "sla/policies", sla);
        process.stdout.write(`  ✓ ${sla.name}\n`);
      } catch (e) {
        console.log(`  ✗ ${sla.name}: ${(e as Error).message}`);
      }
    }

    // ── 7. Create Policies (direct DB — toNumeric bug in Go backend) ──
    console.log("\n[7/8] Creando pólizas...");
    let policyCount = 0;

    // Get the max policy number to avoid conflicts
    const maxPolRes = await pool.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(policy_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
       FROM policies.policies WHERE tenant_id = $1`,
      [TENANT_ID]
    );
    let nextPolicyNum = maxPolRes.rows[0]?.next_num ?? 1;

    for (let i = 0; i < Math.min(createdClients.length, rand(5, 8)); i++) {
      const client = createdClients[i];
      const clientSites = createdSites.filter((s) => s.client_id === client.id);
      const startDate = randomDate(365, 30);
      const endDate = randomDate(-30, -365);
      const monthly = pick([5000.0, 8000.0, 12000.0, 15000.0, 25000.0, 35000.0, 50000.0]);
      const policyNumber = `POL-${new Date().getFullYear()}-${String(nextPolicyNum++).padStart(5, "0")}`;
      const siteId = clientSites.length > 0 ? clientSites[0].id : null;

      try {
        await pool.query(
          `INSERT INTO policies.policies
            (tenant_id, policy_number, client_id, site_id, status, start_date, end_date, monthly_payment, vendor, contract_type, notes)
           VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9, $10, $11)`,
          [
            TENANT_ID,
            policyNumber,
            client.id,
            siteId,
            pick(["active", "active", "active", "expired", "pending"]),
            startDate,
            endDate,
            monthly,
            pick(["Skyworks Security", "Vigilancia Norte", "CCTV Solutions MX", "SecureTech"]),
            pick(["maintenance", "full_service", "monitoring"]),
            `Póliza de mantenimiento para ${client.company_name}`,
          ]
        );
        policyCount++;
        process.stdout.write(`  ✓ ${policyNumber} → ${client.company_name} ($${monthly.toLocaleString()}/mes)\n`);
      } catch (e) {
        console.log(`  ✗ ${policyNumber}: ${(e as Error).message}`);
      }
    }
    console.log(`  → ${policyCount} pólizas creadas`);

    // ── 8. Create Tickets (direct DB — enum type + number sequence issues) ──
    console.log("\n[8/8] Creando tickets...");
    let ticketCount = 0;
    const ticketTitles = [
      "Cámara offline en estacionamiento",
      "NVR sin conexión desde ayer",
      "Pérdida de imagen intermitente",
      "Instalación de nuevas cámaras",
      "Mantenimiento preventivo trimestral",
      "Actualización de firmware NVR",
      "Reparación de cableado dañado",
      "Ajuste de ángulo de cámara PTZ",
      "Revisión de almacenamiento NVR",
      "Falla en grabación nocturna",
      "Cámara borrosa necesita limpieza",
      "Configurar detección de movimiento",
      "Instalar cámara LPR en acceso",
      "Problema con alimentación PoE",
      "Revisar cobertura perímetro norte",
      "Cambio de disco duro NVR",
      "Alarma de temperatura en servidor",
      "Cámara vandálica dañada",
      "Integración con control de acceso",
      "Auditoría de sistema completo",
    ];
    const ticketStatuses = ["open", "assigned", "in_progress", "completed", "cancelled"];

    // Get the max ticket number to avoid conflicts
    const maxNumRes = await pool.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
       FROM tickets.tickets WHERE tenant_id = $1`,
      [TENANT_ID]
    );
    let nextTicketNum = maxNumRes.rows[0]?.next_num ?? 1;
    const year = new Date().getFullYear();

    for (let i = 0; i < rand(15, 25); i++) {
      const client = pick(createdClients);
      const clientSites = createdSites.filter((s) => s.client_id === client.id);
      if (clientSites.length === 0) continue;
      const site = pick(clientSites);
      const priority = pick(TICKET_PRIORITIES);
      const type = pick(TICKET_TYPES);
      const status = pick(ticketStatuses);
      const ticketNumber = `TKT-${year}-${String(nextTicketNum).padStart(5, "0")}`;
      nextTicketNum++;

      try {
        await pool.query(
          `INSERT INTO tickets.tickets
            (tenant_id, ticket_number, client_id, site_id, type, priority, status, title, description)
           VALUES ($1, $2, $3, $4, $5::tickets.ticket_type, $6::tickets.ticket_priority, $7::tickets.ticket_status, $8, $9)`,
          [
            TENANT_ID,
            ticketNumber,
            client.id,
            site.id,
            type,
            priority,
            status,
            pick(ticketTitles),
            `Ticket de ${priority} prioridad para ${client.company_name} en ${site.name}. Requiere atención ${priority === "critical" ? "inmediata" : "programada"}.`,
          ]
        );
        ticketCount++;
      } catch (e) {
        console.log(`  ✗ ${ticketNumber}: ${(e as Error).message}`);
      }
    }
    console.log(`  → ${ticketCount} tickets creados`);

    // ─── Summary ──────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════");
    console.log("           SEED COMPLETADO");
    console.log("═══════════════════════════════════════");
    console.log(`  Clientes:    ${createdClients.length}`);
    console.log(`  Sitios:      ${createdSites.length}`);
    console.log(`  NVRs:        ${createdNvrs.length}`);
    console.log(`  Cámaras:     ${cameraCount}`);
    console.log(`  SLA:         ${slaPolicies.length}`);
    console.log(`  Pólizas:     ${policyCount}`);
    console.log(`  Tickets:     ${ticketCount}`);
    console.log("═══════════════════════════════════════\n");

  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("\n✗ Error fatal:", err.message);
  process.exit(1);
});
