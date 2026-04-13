import { NextRequest, NextResponse } from "next/server";

// ── Tipos de solicitud ──

interface ChatRequest {
  message: string;
  provider: "google" | "anthropic";
  model: string;
  apiKey: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  history?: { role: "user" | "assistant"; content: string }[];
}

// ── Validacion basica ──

function validateRequest(body: unknown): ChatRequest | string {
  if (!body || typeof body !== "object") return "Body invalido";
  const b = body as Record<string, unknown>;
  if (typeof b.message !== "string" || !b.message.trim()) return "message es requerido";
  if (!["google", "anthropic"].includes(b.provider as string)) return "provider invalido";
  if (typeof b.model !== "string" || !b.model.trim()) return "model es requerido";
  if (typeof b.apiKey !== "string" || !b.apiKey.trim()) return "apiKey es requerida";
  return {
    message: b.message as string,
    provider: b.provider as "google" | "anthropic",
    model: b.model as string,
    apiKey: b.apiKey as string,
    systemPrompt: typeof b.systemPrompt === "string" ? b.systemPrompt : undefined,
    temperature: typeof b.temperature === "number" ? b.temperature : 0.7,
    maxTokens: typeof b.maxTokens === "number" ? b.maxTokens : 4096,
    history: Array.isArray(b.history) ? b.history : [],
  };
}

// ── Llamada a Google Gemini ──

async function callGemini(req: ChatRequest): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const contents: { role: string; parts: { text: string }[] }[] = [];
  // Historial
  for (const msg of req.history ?? []) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }
  // Mensaje actual
  contents.push({ role: "user", parts: [{ text: req.message }] });

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: req.temperature,
      maxOutputTokens: req.maxTokens,
    },
  };
  if (req.systemPrompt) {
    body.systemInstruction = { parts: [{ text: req.systemPrompt }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent?key=${req.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "(sin respuesta)";
  const usage = data.usageMetadata ?? {};
  return {
    content: text,
    inputTokens: usage.promptTokenCount ?? 0,
    outputTokens: usage.candidatesTokenCount ?? 0,
  };
}

// ── Llamada a Anthropic ──

async function callAnthropic(req: ChatRequest): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const messages: { role: string; content: string }[] = [];
  for (const msg of req.history ?? []) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: "user", content: req.message });

  const body: Record<string, unknown> = {
    model: req.model,
    max_tokens: req.maxTokens ?? 4096,
    messages,
  };
  if (req.systemPrompt) {
    body.system = req.systemPrompt;
  }
  if (req.temperature !== undefined) {
    body.temperature = req.temperature;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": req.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "(sin respuesta)";
  return {
    content: text,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

// ── Handler POST ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateRequest(body);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const start = Date.now();
    let result: { content: string; inputTokens: number; outputTokens: number };

    if (validated.provider === "google") {
      result = await callGemini(validated);
    } else {
      result = await callAnthropic(validated);
    }

    const latencyMs = Date.now() - start;

    return NextResponse.json({
      content: result.content,
      usage: {
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
      },
      latency_ms: latencyMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
