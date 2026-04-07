-- 000011_seed_ai_templates.up.sql
-- Seed inicial de templates de prompts para IA
-- Templates globales (tenant_id NULL = disponibles para todos)
-- Template: Clasificación de Tickets
INSERT INTO intelligence.prompt_templates (
        id,
        tenant_id,
        name,
        category,
        system_prompt,
        user_prompt_template,
        temperature,
        max_tokens,
        response_format,
        description,
        variables,
        example_output
    )
VALUES (
        gen_random_uuid(),
        NULL,
        'Clasificación de Tickets',
        'ticket_classification',
        'Eres un experto en clasificación de tickets de servicio técnico para sistemas CCTV. Analiza la descripción del ticket y clasifica según tipo, prioridad y área afectada.',
        'Clasifica el siguiente ticket:

Descripción: {{ticket_description}}
Cliente: {{client_name}}

Proporciona la clasificación en formato JSON con:
- type: (preventive, corrective, installation, emergency)
- priority: (low, medium, high, critical)
- affected_area: (cameras, dvr, network, power, other)
- estimated_time_hours: número estimado de horas
- recommended_technician_level: (junior, senior, specialist)',
        0.3,
        500,
        'json',
        'Clasifica tickets automáticamente según descripción',
        '["ticket_description", "client_name"]',
        '{"type": "corrective", "priority": "high", "affected_area": "cameras", "estimated_time_hours": 4, "recommended_technician_level": "senior"}'
    );
-- Template: Análisis de Imagen de Daño
INSERT INTO intelligence.prompt_templates (
        id,
        tenant_id,
        name,
        category,
        system_prompt,
        user_prompt_template,
        temperature,
        max_tokens,
        response_format,
        description,
        variables,
        example_output
    )
VALUES (
        gen_random_uuid(),
        NULL,
        'Análisis de Imagen de Daño',
        'image_damage_detection',
        'Eres un experto en análisis de imágenes de equipos de CCTV y seguridad electrónica. Identifica daños, problemas y estado del equipo.',
        'Analiza la siguiente imagen de equipo CCTV.

Tipo de equipo: {{equipment_type}}

Proporciona un análisis en formato JSON con:
- damage_detected: boolean
- damage_type: (physical, corrosion, burn, water_damage, cable_damage, none)
- severity: (low, medium, high, critical)
- description: descripción detallada del daño
- recommended_action: acción recomendada',
        0.5,
        600,
        'json',
        'Detecta daños en equipos mediante análisis de imágenes',
        '["equipment_type", "image_url"]',
        '{"damage_detected": true, "damage_type": "corrosion", "severity": "medium", "description": "Corrosión visible en conectores BNC", "recommended_action": "Reemplazo de conectores y revisión de cables"}'
    );
-- Template: Resumen de Ticket
INSERT INTO intelligence.prompt_templates (
        id,
        tenant_id,
        name,
        category,
        system_prompt,
        user_prompt_template,
        temperature,
        max_tokens,
        response_format,
        description,
        variables,
        example_output
    )
VALUES (
        gen_random_uuid(),
        NULL,
        'Resumen de Ticket',
        'text_summary',
        'Genera resúmenes concisos y claros de tickets de servicio técnico.',
        'Resume el siguiente ticket en máximo 3 líneas, incluyendo el problema principal y la solución aplicada:

Descripción completa:
{{ticket_description}}

Comentarios del técnico:
{{technician_comments}}

Solución aplicada:
{{solution_applied}}',
        0.7,
        200,
        'text',
        'Genera resúmenes ejecutivos de tickets cerrados',
        '["ticket_description", "technician_comments", "solution_applied"]',
        'Cámara #3 presentaba imagen borrosa por desenfoque del lente. Técnico realizó ajuste de enfoque manual y limpieza del lente. Sistema operando correctamente.'
    );
-- Template: OCR de Facturas
INSERT INTO intelligence.prompt_templates (
        id,
        tenant_id,
        name,
        category,
        system_prompt,
        user_prompt_template,
        temperature,
        max_tokens,
        response_format,
        description,
        variables,
        example_output
    )
VALUES (
        gen_random_uuid(),
        NULL,
        'Extracción de Datos de Factura',
        'ocr',
        'Eres un experto en extracción de datos de facturas mexicanas (CFDI). Identifica y extrae información clave.',
        'Extrae la información de la siguiente factura:

[Imagen o texto de la factura]

Proporciona los datos en formato JSON con:
- folio: número de folio fiscal
- serie: serie de la factura
- fecha: fecha de emisión (YYYY-MM-DD)
- rfc_emisor: RFC del emisor
- nombre_emisor: nombre del emisor
- rfc_receptor: RFC del receptor
- subtotal: monto subtotal
- iva: monto de IVA
- total: monto total
- moneda: tipo de moneda',
        0.1,
        800,
        'json',
        'Extrae datos estructurados de facturas PDF o imágenes',
        '["invoice_image_url"]',
        '{"folio": "A1B2C3D4", "serie": "A", "fecha": "2024-01-08", "rfc_emisor": "ABC123456789", "subtotal": 1000.00, "iva": 160.00, "total": 1160.00, "moneda": "MXN"}'
    );
-- Template: Generación de Reporte de Servicio
INSERT INTO intelligence.prompt_templates (
        id,
        tenant_id,
        name,
        category,
        system_prompt,
        user_prompt_template,
        temperature,
        max_tokens,
        response_format,
        description,
        variables,
        example_output
    )
VALUES (
        gen_random_uuid(),
        NULL,
        'Generación de Reporte de Servicio',
        'report_generation',
        'Genera reportes profesionales de servicio técnico en formato detallado y estructurado.',
        'Genera un reporte de servicio profesional basado en:

Cliente: {{client_name}}
Fecha: {{service_date}}
Técnico: {{technician_name}}
Trabajo realizado: {{work_description}}
Equipos atendidos: {{equipment_list}}
Materiales usados: {{materials_used}}

El reporte debe incluir:
1. Resumen ejecutivo
2. Detalles del servicio
3. Equipos verificados
4. Materiales utilizados
5. Recomendaciones',
        0.8,
        1500,
        'markdown',
        'Genera reportes formales de servicio basados en datos del ticket',
        '["client_name", "service_date", "technician_name", "work_description", "equipment_list", "materials_used"]',
        '# Reporte de Servicio Técnico\n\n## Resumen Ejecutivo\nSe realizó mantenimiento preventivo al sistema CCTV...'
    );
-- Template: Análisis de Sentimiento de Comentarios
INSERT INTO intelligence.prompt_templates (
        id,
        tenant_id,
        name,
        category,
        system_prompt,
        user_prompt_template,
        temperature,
        max_tokens,
        response_format,
        description,
        variables,
        example_output
    )
VALUES (
        gen_random_uuid(),
        NULL,
        'Análisis de Sentimiento',
        'sentiment_analysis',
        'Analiza el sentimiento y satisfacción expresada en comentarios de clientes.',
        'Analiza el sentimiento del siguiente comentario de cliente:

"{{customer_comment}}"

Proporciona en formato JSON:
- sentiment: (positive, neutral, negative)
- satisfaction_score: (0-10)
- key_topics: lista de temas principales mencionados
- urgency_level: (low, medium, high)
- requires_immediate_attention: boolean',
        0.4,
        400,
        'json',
        'Detecta sentimiento y nivel de satisfacción en comentarios',
        '["customer_comment"]',
        '{"sentiment": "negative", "satisfaction_score": 3, "key_topics": ["slow_response", "camera_quality"], "urgency_level": "high", "requires_immediate_attention": true}'
    );
-- Agregar comentarios
COMMENT ON TABLE intelligence.prompt_templates IS 'Plantillas de prompts pre-configuradas para casos de uso comunes';