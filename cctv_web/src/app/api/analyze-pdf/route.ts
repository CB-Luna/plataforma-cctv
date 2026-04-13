import { NextRequest, NextResponse } from "next/server";

// ── API Route: Analisis de PDF con Gemini ──
// Recibe un PDF como base64 y extrae especificaciones tecnicas de camaras CCTV

interface AnalyzePDFRequest {
  pdfBase64: string;
  fileName: string;
  apiKey: string;
  model?: string;
  query?: string;
}

function validateRequest(body: unknown): AnalyzePDFRequest | string {
  if (!body || typeof body !== "object") return "Body invalido";
  const b = body as Record<string, unknown>;
  if (typeof b.pdfBase64 !== "string" || !b.pdfBase64) return "pdfBase64 es requerido";
  if (typeof b.fileName !== "string" || !b.fileName) return "fileName es requerido";
  if (typeof b.apiKey !== "string" || !b.apiKey.trim()) return "apiKey es requerida";

  // Limitar tamano del PDF (max ~15MB en base64)
  const maxBase64Length = 20_000_000;
  if (b.pdfBase64.length > maxBase64Length) {
    return `PDF demasiado grande (max ~15MB). Tamano recibido: ${Math.round(b.pdfBase64.length / 1_000_000)}MB en base64`;
  }

  return {
    pdfBase64: b.pdfBase64 as string,
    fileName: b.fileName as string,
    apiKey: b.apiKey as string,
    model: typeof b.model === "string" ? b.model : "gemini-2.0-flash",
    query: typeof b.query === "string" ? b.query : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateRequest(body);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const start = Date.now();

    // Prompt del sistema para extraccion de specs de camaras CCTV
    const systemPrompt = `Eres un experto en sistemas CCTV y videovigilancia. Tu tarea es analizar documentos tecnicos (PDFs, datasheets, catalogos) de equipos de seguridad y extraer informacion estructurada.

Cuando analices un documento, extrae:
1. **Modelos de camaras** encontrados con sus especificaciones
2. **Especificaciones tecnicas** clave: resolucion, tipo de sensor, lente, IR, WDR, PoE, IP rating, temperatura operativa
3. **Analiticas** disponibles: deteccion de movimiento, reconocimiento facial, conteo de personas, LPR, etc.
4. **Certificaciones** y cumplimiento normativo

Responde SIEMPRE en espanol. Si el usuario hace una pregunta especifica, responde a esa pregunta con la informacion del documento.

Si no hay una pregunta especifica, extrae todos los modelos y specs en formato JSON estructurado con esta estructura:
{
  "modelos": [
    {
      "nombre": "string",
      "part_number": "string",
      "tipo": "string (dome/bullet/ptz/fisheye/multisensor/thermal/box/other)",
      "resoluciones": ["string"],
      "sensor": "string",
      "lente": "string",
      "ir": boolean,
      "ir_distancia": "string",
      "wdr": boolean,
      "poe": boolean,
      "ip_rating": "string",
      "temperatura_operativa": "string",
      "analiticas": ["string"],
      "certificaciones": ["string"],
      "notas": "string"
    }
  ],
  "fabricante": "string",
  "catalogo": "string",
  "total_modelos": number,
  "resumen": "string"
}`;

    const userMessage = validated.query
      ? `Analiza este documento PDF y responde a esta pregunta: ${validated.query}`
      : "Analiza este documento PDF y extrae todos los modelos de camaras con sus especificaciones tecnicas en formato JSON.";

    const geminiBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: validated.pdfBase64,
              },
            },
            { text: userMessage },
          ],
        },
      ],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${validated.model}:generateContent?key=${validated.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "(sin respuesta)";
    const usage = data.usageMetadata ?? {};
    const latencyMs = Date.now() - start;

    // Intentar parsear JSON si la respuesta contiene un bloque JSON
    let structured = null;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        structured = JSON.parse(jsonMatch[1]);
      } else if (text.trim().startsWith("{")) {
        structured = JSON.parse(text);
      }
    } catch {
      // Si no se puede parsear como JSON, devolver texto plano
    }

    return NextResponse.json({
      content: text,
      structured,
      fileName: validated.fileName,
      usage: {
        input_tokens: usage.promptTokenCount ?? 0,
        output_tokens: usage.candidatesTokenCount ?? 0,
      },
      latency_ms: latencyMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
