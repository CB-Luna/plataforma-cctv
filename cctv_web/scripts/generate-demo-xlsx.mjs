/**
 * Genera archivos Excel de demo para importaciones en cctv_web/docs/
 * Uso: node scripts/generate-demo-xlsx.mjs
 */
import { writeFile, utils } from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "docs");

// Asegurarse de que el directorio existe
mkdirSync(outDir, { recursive: true });

// ─── Demo de Camaras ─────────────────────────────────────────────────────────
const camarasData = [
  // Encabezados como primera fila (descriptivos para el usuario)
  ["code", "name", "type", "brand", "model", "resolution", "location_description", "status", "nvr_code", "site_name", "ip_address"],
  ["CAM-001", "Entrada Principal",   "dome",   "Hikvision", "DS-2CD2143G2-I",  "4MP",  "Puerta frontal edificio A",         "active",   "NVR-001", "Sucursal Norte", "192.168.1.11"],
  ["CAM-002", "Estacionamiento A",   "bullet", "Dahua",     "IPC-HFW2849S-S",  "8MP",  "Poste 3, sector estacionamiento",   "active",   "NVR-001", "Sucursal Norte", "192.168.1.12"],
  ["CAM-003", "Bodega Fria",         "dome",   "Axis",      "P3245-V",         "2MP",  "Techo bodega 2, sector sur",        "active",   "NVR-001", "Sucursal Norte", "192.168.1.13"],
  ["CAM-004", "Caja Rapida 1",       "ptz",    "Hikvision", "DS-2DE4425IWG-E", "4MP",  "Sobre caja 1, pasillo central",     "active",   "NVR-002", "Sucursal Sur",   "192.168.2.11"],
  ["CAM-005", "Caja Rapida 2",       "ptz",    "Hikvision", "DS-2DE4425IWG-E", "4MP",  "Sobre caja 2, pasillo central",     "active",   "NVR-002", "Sucursal Sur",   "192.168.2.12"],
  ["CAM-006", "Pasillo Frescos",     "bullet", "Dahua",     "IPC-HFW2849S-S",  "8MP",  "Pasillo refrigerados lado A",       "active",   "NVR-002", "Sucursal Sur",   "192.168.2.13"],
  ["CAM-007", "Pasillo Abarrotes",   "dome",   "Axis",      "M3106-L Mk II",   "4MP",  "Gondola central abarrotes",         "inactive", "NVR-002", "Sucursal Sur",   "192.168.2.14"],
  ["CAM-008", "Oficina Gerencia",    "dome",   "Hikvision", "DS-2CD2183G2-I",  "8MP",  "Esquina noreste oficina principal", "active",   "NVR-003", "Matriz",         "10.0.0.11"],
  ["CAM-009", "Sala de Servidores",  "dome",   "Dahua",     "IPC-HDW2849H-ASM","8MP",  "Centro sala de servidores",         "active",   "NVR-003", "Matriz",         "10.0.0.12"],
  ["CAM-010", "Acceso Empleados",    "bullet", "Axis",      "P1448-LE",        "4K",   "Puerta empleados, exterior",        "active",   "NVR-003", "Matriz",         "10.0.0.13"],
];

const camarasSheet = utils.aoa_to_sheet(camarasData);
// Ancho de columnas para mejor lectura
camarasSheet["!cols"] = [
  { wch: 10 }, { wch: 22 }, { wch: 8 }, { wch: 12 }, { wch: 22 },
  { wch: 6 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 14 },
];
const camarasWb = utils.book_new();
utils.book_append_sheet(camarasWb, camarasSheet, "Camaras");
writeFile(camarasWb, join(outDir, "camaras-demo.xlsx"));
console.log("✓ camaras-demo.xlsx generado");

// ─── Demo de NVRs ─────────────────────────────────────────────────────────────
const nvrsData = [
  ["code", "name", "brand", "model", "ip_address", "port", "channel_count", "storage_tb", "site_name", "status"],
  ["NVR-001", "NVR Sucursal Norte", "Hikvision", "DS-7608NI-I2/8P", "192.168.1.2",  "8000", "8",  "4",  "Sucursal Norte", "active"],
  ["NVR-002", "NVR Sucursal Sur",   "Dahua",     "NVR4216-16P-I",   "192.168.2.2",  "8000", "16", "8",  "Sucursal Sur",   "active"],
  ["NVR-003", "NVR Matriz",         "Axis",      "S3008 Mk II",     "10.0.0.2",     "80",   "8",  "12", "Matriz",         "active"],
];

const nvrsSheet = utils.aoa_to_sheet(nvrsData);
nvrsSheet["!cols"] = [
  { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 22 },
  { wch: 14 }, { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 10 },
];
const nvrsWb = utils.book_new();
utils.book_append_sheet(nvrsWb, nvrsSheet, "NVRs");
writeFile(nvrsWb, join(outDir, "nvrs-demo.xlsx"));
console.log("✓ nvrs-demo.xlsx generado");

// ─── Demo de Sucursales ───────────────────────────────────────────────────────
const sucursalesData = [
  ["name", "client_name", "address", "city", "state", "lat", "lng"],
  ["Sucursal Norte", "Calimax S.A.", "Blvd. Agua Caliente 1234", "Tijuana", "Baja California", "32.5149", "-117.0382"],
  ["Sucursal Sur",   "Calimax S.A.", "Av. Insurgentes 567",      "Tijuana", "Baja California", "32.4980", "-117.0420"],
  ["Matriz",         "Calimax S.A.", "Blvd. Fundadores 890",     "Tijuana", "Baja California", "32.5300", "-117.0180"],
];

const sucursalesSheet = utils.aoa_to_sheet(sucursalesData);
sucursalesSheet["!cols"] = [
  { wch: 22 }, { wch: 20 }, { wch: 28 }, { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
];
const sucursalesWb = utils.book_new();
utils.book_append_sheet(sucursalesWb, sucursalesSheet, "Sucursales");
writeFile(sucursalesWb, join(outDir, "sucursales-demo.xlsx"));
console.log("✓ sucursales-demo.xlsx generado");

console.log("\nTodos los archivos demo generados en cctv_web/docs/");
