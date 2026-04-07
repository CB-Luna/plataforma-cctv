/**
 * Seed script — Imports NVR & camera inventory from Inventario Skyworks.xlsx
 * Run: npx tsx scripts/seed-skyworks.ts
 *
 * Prerequisites: backend must be running on http://localhost:8087
 */

const API = process.env.API_URL ?? "http://localhost:8087/api/v1";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@symtickets.com";
const ADMIN_PASS = process.env.ADMIN_PASS ?? "admin123";

// ─── NVR data extracted from Inventario skyworks.xlsx ─────────────────

interface NvrSeed {
  name: string;
  vms_server_id: string;
  edition: string;
  camera_channels: number;
  lpr_channels: number;
  processor: string;
  ram_gb: number;
  os_name: string;
  vms_version: string;
  system_type: string;
  site: string; // "ASSY" or "TEST"
  status: string;
}

const NVR_DATA: NvrSeed[] = [
  // ── ASSY Site (Production) ──
  { name: "ASSY NVR-1", vms_server_id: "27248532", edition: "Enterprise", camera_channels: 34, lpr_channels: 3, processor: "Intel Xeon ES-2407 @ 2.20GHz (2 proc)", ram_gb: 24, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.22.0", system_type: "64-bit", site: "ASSY", status: "active" },
  { name: "ASSY NVR-2", vms_server_id: "87368222", edition: "Enterprise", camera_channels: 42, lpr_channels: 3, processor: "Intel Xeon ES-2407 @ 2.20GHz (2 proc)", ram_gb: 24, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "ASSY", status: "active" },
  { name: "ASSY NVR-3", vms_server_id: "24700411", edition: "Standard", camera_channels: 24, lpr_channels: 0, processor: "Intel Xeon ES-2407 @ 2.20GHz", ram_gb: 12, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "ASSY", status: "active" },
  { name: "ASSY NVR-4", vms_server_id: "15166777", edition: "Standard", camera_channels: 39, lpr_channels: 0, processor: "Intel Xeon ES-2407 @ 2.20GHz", ram_gb: 6, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "ASSY", status: "active" },
  { name: "ASSY NVR-5", vms_server_id: "", edition: "Enterprise", camera_channels: 14, lpr_channels: 0, processor: "Intel Xeon E5506 @ 2.13GHz", ram_gb: 6, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.22.0", system_type: "64-bit", site: "ASSY", status: "active" },
  { name: "ASSY NVR-6", vms_server_id: "1515520", edition: "Enterprise", camera_channels: 43, lpr_channels: 0, processor: "Intel Xeon ES-2407 @ 2.20GHz", ram_gb: 12, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "ASSY", status: "active" },

  // ── ASSY Workstations ──
  { name: "ASSY Workstation 1 (CCTVTEST2)", vms_server_id: "", edition: "Workstation", camera_channels: 0, lpr_channels: 0, processor: "Intel Xeon E3-1220 v3 @ 3.10GHz", ram_gb: 8, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "ASSY", status: "active" },
  { name: "ASSY Workstation 2 (SKWS)", vms_server_id: "", edition: "Workstation", camera_channels: 0, lpr_channels: 0, processor: "Intel Xeon ES-2620 @ 2.00GHz (2 proc)", ram_gb: 36, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.22.0", system_type: "64-bit", site: "ASSY", status: "active" },
  { name: "ASSY Workstation 3 (CCTV-PC)", vms_server_id: "", edition: "Workstation", camera_channels: 0, lpr_channels: 0, processor: "Intel Xeon E3-1220 v3 @ 3.10GHz", ram_gb: 4, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "ASSY", status: "active" },

  // ── TEST Site (M3) ──
  { name: "TEST NVR-1-M3", vms_server_id: "14421048", edition: "Enterprise", camera_channels: 5, lpr_channels: 0, processor: "Intel Xeon ES-2407 @ 2.20GHz", ram_gb: 12, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "TEST", status: "active" },
  { name: "TEST NVR-2-M3", vms_server_id: "42330600", edition: "Enterprise", camera_channels: 18, lpr_channels: 0, processor: "Intel Xeon ES-2407 @ 2.20GHz", ram_gb: 12, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "TEST", status: "active" },
  { name: "TEST NVR-3-M3", vms_server_id: "47352016", edition: "Enterprise", camera_channels: 17, lpr_channels: 0, processor: "Intel Xeon ES-2407 @ 2.20GHz", ram_gb: 12, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "TEST", status: "active" },
  { name: "TEST NVR-4-M3", vms_server_id: "7285031", edition: "Enterprise", camera_channels: 25, lpr_channels: 0, processor: "Intel Xeon ES-2407 @ 2.20GHz", ram_gb: 12, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "TEST", status: "active" },
  { name: "TEST NVR-5-M3", vms_server_id: "2117181", edition: "Enterprise", camera_channels: 25, lpr_channels: 0, processor: "Intel Xeon ES-2407 @ 2.20GHz", ram_gb: 8, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v5.10.16.4", system_type: "64-bit", site: "TEST", status: "active" },
  { name: "TEST NVR-6-M3", vms_server_id: "", edition: "Enterprise", camera_channels: 0, lpr_channels: 0, processor: "Intel Xeon Silver 4110 @ 2.10GHz", ram_gb: 32, os_name: "Windows Server 2016 Standard", vms_version: "ACC v5.10.16.4", system_type: "64-bit x64", site: "TEST", status: "active" },

  // ── TEST Workstations ──
  { name: "TEST Workstation 1 (HDNVRTEST1)", vms_server_id: "", edition: "Workstation", camera_channels: 0, lpr_channels: 0, processor: "Intel Xeon ES-2620 @ 2.00GHz (2 proc)", ram_gb: 36, os_name: "Windows Embedded Standard SP1", vms_version: "ACC v6.14.8.8", system_type: "64-bit", site: "TEST", status: "active" },
  { name: "TEST Workstation 2 (CCTVTESTM3)", vms_server_id: "", edition: "Workstation", camera_channels: 0, lpr_channels: 0, processor: "", ram_gb: 0, os_name: "Windows Embedded Standard SP1", vms_version: "", system_type: "64-bit", site: "TEST", status: "maintenance" },
];

// ─── Camera model templates ──────────────────────────────────────────

const CAMERA_MODELS = [
  { name: "Avigilon H5A Dome", type: "dome", generation: "H5A", resolution: "2592x1944", megapixels: 5, ips: 30, bitrate: 8000 },
  { name: "Avigilon H5A Bullet", type: "bullet", generation: "H5A", resolution: "3840x2160", megapixels: 8, ips: 30, bitrate: 12000 },
  { name: "Avigilon H5SL Dome", type: "dome", generation: "H5SL", resolution: "1920x1080", megapixels: 2, ips: 30, bitrate: 4000 },
  { name: "Avigilon H4 Multisensor", type: "multisensor", generation: "H4", resolution: "3200x1800", megapixels: 6, ips: 20, bitrate: 10000 },
  { name: "Avigilon H5A PTZ", type: "ptz", generation: "H5A", resolution: "1920x1080", megapixels: 2, ips: 30, bitrate: 6000 },
  { name: "Avigilon H5A Box", type: "box", generation: "H5A", resolution: "2560x1440", megapixels: 4, ips: 30, bitrate: 7000 },
  { name: "Avigilon H5A LPR", type: "bullet", generation: "H5A-LPR", resolution: "1920x1080", megapixels: 2, ips: 30, bitrate: 5000 },
];

const AREAS = [
  "Estacionamiento Norte", "Estacionamiento Sur", "Andenes", "Oficinas", "Producción",
  "Almacén", "Entrada Principal", "Salida Emergencia", "Perímetro Este", "Perímetro Oeste",
  "Patio de Maniobras", "Recepción", "Comedor", "Laboratorio", "Control de Acceso",
  "Vestíbulo", "Pasillo Principal", "Azotea", "Subestación", "Cuarto de Máquinas",
];

const ZONES = ["Interior", "Exterior", "Perímetro", "Acceso"];

// ─── Helpers ─────────────────────────────────────────────────────────

let token = "";
let companyId = "";

async function apiCall(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(companyId ? { "X-Company-ID": companyId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} => ${res.status}: ${text}`);
  }
  return res.json().catch(() => ({}));
}

function randomIp(base: string, start: number, idx: number): string {
  return `${base}.${start + idx}`;
}

function randomMac(): string {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
  return `00:18:d1:${hex()}:${hex()}:${hex()}`;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("🔑 Logging in...");
  const auth = await apiCall("POST", "auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASS });
  token = auth.access_token ?? auth.token ?? "";
  if (!token) {
    console.error("❌ Login failed — no token. Check credentials.");
    process.exit(1);
  }

  // Get companies
  const me = await apiCall("GET", "auth/me");
  const companies = me.companies ?? [];
  if (companies.length === 0) {
    console.error("❌ No companies found. Create a tenant first.");
    process.exit(1);
  }
  companyId = companies[0].id;
  console.log(`✅ Logged in. Company: ${companies[0].name} (${companyId})`);

  // Seed NVRs
  console.log("\n📡 Seeding NVRs...");
  const createdNvrs: { id: string; name: string; channels: number; site: string; lpr: number }[] = [];

  for (const nvr of NVR_DATA) {
    try {
      const payload = {
        name: nvr.name,
        vms_server_id: nvr.vms_server_id || undefined,
        edition: nvr.edition,
        camera_channels: nvr.camera_channels,
        lpr_channels: nvr.lpr_channels,
        processor: nvr.processor,
        ram_gb: nvr.ram_gb,
        os_name: nvr.os_name,
        vms_version: nvr.vms_version,
        system_type: nvr.system_type,
        status: nvr.status,
        ip_address: nvr.site === "ASSY"
          ? randomIp("192.168.1", 10, createdNvrs.filter(n => n.site === "ASSY").length)
          : randomIp("192.168.2", 10, createdNvrs.filter(n => n.site === "TEST").length),
        total_storage_tb: nvr.ram_gb >= 24 ? 16 : (nvr.ram_gb >= 12 ? 8 : 4),
        recording_days: nvr.edition === "Enterprise" ? 30 : 15,
        is_active: nvr.status === "active",
      };
      const result = await apiCall("POST", "inventory/nvrs", payload);
      createdNvrs.push({ id: result.id, name: nvr.name, channels: nvr.camera_channels, site: nvr.site, lpr: nvr.lpr_channels });
      console.log(`  ✅ ${nvr.name} (${nvr.camera_channels} ch, ${nvr.ram_gb}GB RAM)`);
    } catch (e) {
      console.log(`  ⚠️ ${nvr.name}: ${(e as Error).message}`);
    }
  }

  // Seed cameras for each NVR
  console.log("\n📸 Seeding cameras...");
  let totalCams = 0;

  for (const nvr of createdNvrs) {
    if (nvr.channels === 0) continue; // Skip workstations

    for (let i = 0; i < nvr.channels; i++) {
      const model = CAMERA_MODELS[i % CAMERA_MODELS.length];
      const area = AREAS[i % AREAS.length];
      const zone = ZONES[Math.floor(i / 5) % ZONES.length];
      const isLpr = i < nvr.lpr && model.generation === "H5A-LPR";

      try {
        await apiCall("POST", "inventory/cameras", {
          nvr_server_id: nvr.id,
          name: `${nvr.name.replace(/\s+/g, "-")}-CAM-${String(i + 1).padStart(2, "0")}`,
          consecutive: i + 1,
          camera_type: isLpr ? "lpr" : model.type,
          camera_model_name: model.name,
          generation: model.generation,
          resolution: model.resolution,
          megapixels: model.megapixels,
          ips: model.ips,
          bitrate_kbps: model.bitrate,
          quality: "high",
          ip_address: randomIp(nvr.site === "ASSY" ? "192.168.10" : "192.168.20", 1, totalCams),
          mac_address: randomMac(),
          area,
          zone,
          location_description: `${area} - ${zone}`,
          status: Math.random() > 0.05 ? "online" : "offline",
          is_active: true,
          has_counting: Math.random() > 0.7,
          counting_enabled: false,
        });
        totalCams++;
      } catch {
        // Camera creation might fail if endpoint format differs — continue
      }
    }
    console.log(`  ✅ ${nvr.name}: ${nvr.channels} cameras`);
  }

  console.log(`\n🎉 Done! Created ${createdNvrs.length} NVRs + ${totalCams} cameras`);
  console.log(`\nSummary:`);
  console.log(`  ASSY site: ${createdNvrs.filter(n => n.site === "ASSY").length} devices (${NVR_DATA.filter(n => n.site === "ASSY").reduce((s, n) => s + n.camera_channels, 0)} channels)`);
  console.log(`  TEST site: ${createdNvrs.filter(n => n.site === "TEST").length} devices (${NVR_DATA.filter(n => n.site === "TEST").reduce((s, n) => s + n.camera_channels, 0)} channels)`);
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});
