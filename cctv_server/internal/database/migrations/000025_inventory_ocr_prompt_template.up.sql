-- 000025_inventory_ocr_prompt_template.up.sql
-- Template de prompt para extracción OCR de inventario CCTV

INSERT INTO intelligence.prompt_templates (
    name,
    category,
    system_prompt,
    user_prompt_template,
    temperature,
    max_tokens,
    response_format,
    description,
    variables,
    example_input,
    example_output,
    is_active,
    version
) VALUES (
    'cctv_inventory_extraction',
    'data_extraction',
    'Eres un experto en sistemas CCTV y equipos de video vigilancia. Tu tarea es extraer información estructurada de imágenes o capturas de pantalla de inventarios de equipos CCTV.

Debes identificar y extraer los siguientes tipos de datos:

1. SERVIDORES NVR:
   - Nombre/ID del servidor
   - Marca (Avigilon, Milestone, Genetec, etc.)
   - Modelo del servidor
   - Edición de licencia (Enterprise, Standard, Professional)
   - Versión del software VMS
   - Número de canales de cámara
   - Dirección IP
   - Dirección MAC
   - Procesador
   - Memoria RAM
   - Sistema operativo
   - Capacidad de almacenamiento
   - Service Tag

2. CÁMARAS:
   - Nombre de la cámara
   - Tipo (Domo, PTZ, Bullet, Micro Domo, etc.)
   - Marca y modelo
   - Dirección IP
   - Dirección MAC
   - Resolución
   - IPS (frames por segundo)
   - Bitrate
   - Número de serie
   - Ubicación/Área
   - NVR asociado

Responde SIEMPRE en formato JSON estructurado.',
    'Analiza la siguiente imagen/texto de inventario CCTV y extrae la información en formato JSON estructurado.

{{#if image_description}}
Descripción de la imagen: {{image_description}}
{{/if}}

{{#if text_content}}
Contenido de texto:
{{text_content}}
{{/if}}

Extrae toda la información que puedas identificar y devuelve un JSON con la siguiente estructura:

{
  "type": "nvr_servers" | "cameras" | "mixed",
  "records": [
    {
      // campos específicos según el tipo de equipo
    }
  ],
  "summary": {
    "total_records": number,
    "confidence": "high" | "medium" | "low"
  },
  "notes": "Cualquier observación relevante"
}',
    0.1,
    4096,
    'json',
    'Extrae información estructurada de inventarios CCTV desde imágenes o texto (screenshots de Excel, ACC, etc.)',
    '["image_description", "text_content"]'::JSONB,
    '{"text_content": "NVR-1-HDNVR | OEMR R520 | 169.254.101.3 | 24.0 GB RAM | Enterprise | v5.10.22.0"}'::JSONB,
    '{
  "type": "nvr_servers",
  "records": [
    {
      "name": "NVR-1-HDNVR",
      "model": "OEMR R520",
      "ip_address": "169.254.101.3",
      "ram_gb": 24,
      "edition": "Enterprise",
      "vms_version": "5.10.22.0"
    }
  ],
  "summary": {
    "total_records": 1,
    "confidence": "high"
  },
  "notes": "Servidor NVR con configuración estándar"
}',
    true,
    1
);

-- Agregar otro template para extracción específica de cámaras
INSERT INTO intelligence.prompt_templates (
    name,
    category,
    system_prompt,
    user_prompt_template,
    temperature,
    max_tokens,
    response_format,
    description,
    variables,
    is_active,
    version
) VALUES (
    'cctv_camera_list_extraction',
    'data_extraction',
    'Eres un experto en sistemas CCTV de Avigilon y otras marcas. Tu tarea es extraer información de listas de cámaras desde capturas de pantalla o datos tabulares.

Identifica estos campos para cada cámara:
- Nombre/ID de la cámara
- Tipo de cámara (Micro Domo, Domo, PTZ, Bala, Encoder, etc.)
- Modelo completo (ej: Avigilon (ONVIF) 2.0-H3M-DO1)
- Dirección IP
- Dirección MAC
- Resolución (ej: 1920x1080)
- IPS (frames por segundo)
- Bitrate en kbps
- Número de serie
- Versión de firmware
- Área/Ubicación
- NVR asignado
- Proyecto

Responde siempre en JSON.',
    'Extrae la información de cámaras del siguiente contenido:

{{text_content}}

Responde con un JSON:
{
  "cameras": [
    {
      "name": string,
      "camera_type": "micro_dome" | "dome" | "dome_360" | "ptz" | "bullet" | "box" | "fisheye" | "encoder" | "other",
      "model": string,
      "ip_address": string,
      "mac_address": string,
      "resolution": string,
      "ips": number,
      "bitrate_kbps": number,
      "serial_number": string,
      "firmware_version": string,
      "area": string,
      "nvr_name": string,
      "project": string
    }
  ],
  "total": number,
  "extraction_confidence": "high" | "medium" | "low"
}',
    0.1,
    4096,
    'json',
    'Extrae información de listas de cámaras desde texto tabular o capturas de pantalla',
    '["text_content"]'::JSONB,
    true,
    1
);

-- Agregar template para resumen ejecutivo
INSERT INTO intelligence.prompt_templates (
    name,
    category,
    system_prompt,
    user_prompt_template,
    temperature,
    max_tokens,
    response_format,
    description,
    variables,
    is_active,
    version
) VALUES (
    'cctv_inventory_summary',
    'analysis',
    'Eres un experto en sistemas CCTV. Tu tarea es generar resúmenes ejecutivos de inventarios de equipos de video vigilancia.',
    'Genera un resumen ejecutivo del siguiente inventario CCTV:

Servidores NVR: {{nvr_count}}
Cámaras totales: {{camera_count}}
Cámaras activas: {{active_cameras}}
Almacenamiento total: {{storage_tb}} TB
Licencias totales: {{total_licenses}}
Licencias usadas: {{used_licenses}}

Detalles adicionales:
{{details}}

Genera un resumen ejecutivo en español que incluya:
1. Estado general del sistema
2. Puntos de atención (licencias por vencer, equipos en mantenimiento, etc.)
3. Recomendaciones
4. Métricas clave

Responde en formato markdown.',
    0.5,
    1024,
    'markdown',
    'Genera resúmenes ejecutivos de inventarios CCTV para reportes',
    '["nvr_count", "camera_count", "active_cameras", "storage_tb", "total_licenses", "used_licenses", "details"]'::JSONB,
    true,
    1
);
