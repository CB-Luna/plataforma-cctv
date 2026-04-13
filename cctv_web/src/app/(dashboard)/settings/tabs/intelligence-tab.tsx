"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Brain,
  ChevronDown,
  ChevronRight,
  Cpu,
  Eye,
  EyeOff,
  MessageCircle,
  Power,
  PowerOff,
  RefreshCw,
  Save,
  Send,
  Settings2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import type { ModelConfig, CreateModelConfigRequest } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/hooks/use-permissions";
import {
  createModelConfig,
  listModelConfigs,
  updateModelConfig,
} from "@/lib/api/intelligence";

// ── Proveedores y modelos soportados ──

const AI_PROVIDERS = [
  {
    key: "google",
    label: "Google Gemini",
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite"],
  },
  {
    key: "anthropic",
    label: "Anthropic",
    models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-latest"],
  },
] as const;

type ProviderKey = (typeof AI_PROVIDERS)[number]["key"];

// ── Modulos fijos del sistema ──

interface ModuleDef {
  label: string;
  desc: string;
  icon: typeof Bot;
  color: string;
  defaultProvider: ProviderKey;
  defaultModel: string;
}

const MODULE_DEFS: Record<string, ModuleDef> = {
  chatbot_assistant: {
    label: "Asistente CCTV",
    desc: "Chatbot con acceso a datos del sistema",
    icon: MessageCircle,
    color: "blue",
    defaultProvider: "google",
    defaultModel: "gemini-2.5-flash",
  },
  camera_analyzer: {
    label: "Analisis de infraestructura",
    desc: "Gemini Embedding para detalles de camaras e inventario",
    icon: Brain,
    color: "violet",
    defaultProvider: "google",
    defaultModel: "gemini-2.5-flash",
  },
};

// ── Componente de seccion colapsable ──

function SectionToggle({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: typeof Bot;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="border-t px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

// ── Estado del formulario ──

interface FormState {
  nombre: string;
  provider: ProviderKey;
  modelo: string;
  apiKey: string;
  temperatura: number;
  maxTokens: number;
  activo: boolean;
  // Chatbot
  chatbotActivo: boolean;
  modoAvanzado: boolean;
  maxPreguntasPorHora: number;
  // Prompt
  promptSistema: string;
}

const DEFAULT_FORM: FormState = {
  nombre: "",
  provider: "google",
  modelo: "gemini-2.5-flash",
  apiKey: "",
  temperatura: 0.7,
  maxTokens: 4096,
  activo: true,
  chatbotActivo: true,
  modoAvanzado: false,
  maxPreguntasPorHora: 20,
  promptSistema: "",
};

// ── Utilidad: buscar config por module_key en settings ──

function findConfigForModule(
  configs: ModelConfig[],
  moduleKey: string,
): ModelConfig | undefined {
  return (
    configs.find(
      (c) =>
        (c.settings as Record<string, unknown>)?.module_key === moduleKey,
    ) ??
    configs.find((c) =>
      c.name.toLowerCase().includes(moduleKey.replace("_", " ")),
    )
  );
}

function configToForm(config: ModelConfig): FormState {
  const settings = (config.settings ?? {}) as Record<string, unknown>;
  return {
    nombre: config.name,
    provider: (config.provider as ProviderKey) || "google",
    modelo: config.model_name,
    apiKey: "",
    temperatura: config.default_temperature ?? 0.7,
    maxTokens: config.default_max_tokens ?? 4096,
    activo: config.is_active,
    chatbotActivo: (settings.chatbot_activo as boolean) ?? true,
    modoAvanzado: (settings.modo_avanzado as boolean) ?? false,
    maxPreguntasPorHora: (config.max_requests_per_hour as number) ?? 20,
    promptSistema: (settings.prompt_sistema as string) ?? "",
  };
}

// ── Componente principal ──

export function IntelligenceTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const canEdit = canAny("ai_models.update", "ai_models:update:own", "ai_models:update:all");

  const [selectedKey, setSelectedKey] = useState<string>("chatbot_assistant");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState({
    motor: true,
    reglas: true,
    avanzado: false,
    prueba: false,
  });

  // Estado de prueba de chat
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatTesting, setChatTesting] = useState(false);
  const [chatUsage, setChatUsage] = useState<{
    input_tokens: number;
    output_tokens: number;
    latency_ms: number;
  } | null>(null);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["model-configs"],
    queryFn: listModelConfigs,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateModelConfigRequest) => createModelConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Modulo inicializado correctamente");
    },
    onError: () => toast.error("Error al inicializar modulo"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateModelConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Configuracion guardada");
    },
    onError: () => toast.error("Error al guardar"),
  });

  // Config actual del modulo seleccionado
  const selectedConfig = findConfigForModule(models, selectedKey);

  // Poblar formulario cuando cambia la seleccion o los datos
  const populateForm = useCallback(
    (moduleKey: string) => {
      const cfg = findConfigForModule(models, moduleKey);
      if (cfg) {
        setForm(configToForm(cfg));
      } else {
        const def = MODULE_DEFS[moduleKey];
        setForm({
          ...DEFAULT_FORM,
          nombre: def?.label ?? moduleKey,
          provider: def?.defaultProvider ?? "google",
          modelo: def?.defaultModel ?? "gemini-2.5-flash",
        });
      }
    },
    [models],
  );

  useEffect(() => {
    populateForm(selectedKey);
  }, [selectedKey, populateForm]);

  function handleSelect(key: string) {
    setSelectedKey(key);
    setShowApiKey(false);
    setChatMessages([]);
    setChatInput("");
  }

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  }

  // Guardar configuracion
  async function handleSave() {
    setSaving(true);
    try {
      const moduleSettings: Record<string, unknown> = {
        module_key: selectedKey,
        prompt_sistema: form.promptSistema,
      };
      if (selectedKey === "chatbot_assistant") {
        moduleSettings.chatbot_activo = form.chatbotActivo;
        moduleSettings.modo_avanzado = form.modoAvanzado;
      }

      if (selectedConfig) {
        // Actualizar config existente
        const body: Record<string, unknown> = {
          name: form.nombre,
          provider: form.provider,
          model_name: form.modelo,
          default_temperature: form.temperatura,
          default_max_tokens: form.maxTokens,
          is_active: form.activo,
          max_requests_per_hour: form.maxPreguntasPorHora,
          settings: moduleSettings,
        };
        if (form.apiKey) {
          body.api_key_encrypted = form.apiKey;
        }
        updateMutation.mutate({ id: selectedConfig.id, data: body });
      } else {
        // Crear config nueva para este modulo
        const def = MODULE_DEFS[selectedKey];
        createMutation.mutate({
          name: form.nombre || def?.label || selectedKey,
          provider: form.provider,
          model_name: form.modelo,
          default_temperature: form.temperatura,
          default_max_tokens: form.maxTokens,
          is_active: form.activo,
          max_requests_per_hour: form.maxPreguntasPorHora,
          settings: moduleSettings,
          ...(form.apiKey ? { api_key_encrypted: form.apiKey } : {}),
        });
      }
    } finally {
      setSaving(false);
    }
  }

  // Toggle activo/inactivo
  function handleToggleActive() {
    if (!selectedConfig) return;
    updateMutation.mutate({
      id: selectedConfig.id,
      data: { is_active: !form.activo },
    });
    setForm((f) => ({ ...f, activo: !f.activo }));
  }

  // Prueba de chat — llama a /api/chat (Next.js API route → Gemini/Anthropic)
  async function handleChatTest() {
    if (!chatInput.trim()) return;
    // Verificar que haya API key disponible (del form actual o ya guardada)
    if (!form.apiKey && !selectedConfig?.has_api_key) {
      toast.error("Ingresa una clave API en la seccion Motor IA para probar el chat");
      return;
    }
    if (!form.apiKey) {
      toast.error("Re-ingresa la clave API para probar — el servidor no la devuelve por seguridad");
      return;
    }

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((m) => [...m, { role: "user", content: userMsg }]);
    setChatTesting(true);
    setChatUsage(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          provider: form.provider,
          model: form.modelo,
          apiKey: form.apiKey,
          systemPrompt: form.promptSistema || undefined,
          temperature: form.temperatura,
          maxTokens: form.maxTokens,
          history: chatMessages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      setChatMessages((m) => [
        ...m,
        { role: "assistant", content: data.content },
      ]);
      if (data.usage) {
        setChatUsage({
          input_tokens: data.usage.input_tokens,
          output_tokens: data.usage.output_tokens,
          latency_ms: data.latency_ms ?? 0,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setChatMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${msg}` },
      ]);
      toast.error("Error al llamar al proveedor IA");
    } finally {
      setChatTesting(false);
    }
  }

  const selectedProvider =
    AI_PROVIDERS.find((p) => p.key === form.provider) ?? AI_PROVIDERS[0];
  const isChatModule = selectedKey === "chatbot_assistant";
  const def = MODULE_DEFS[selectedKey];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">IA del sistema</h2>
          <p className="text-sm text-muted-foreground">
            Configura los modulos de inteligencia artificial de la plataforma
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Panel izquierdo: tarjetas de modulos ── */}
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-xl bg-muted"
                />
              ))
            : Object.entries(MODULE_DEFS).map(([key, d]) => {
                const cfg = findConfigForModule(models, key);
                const isSelected = selectedKey === key;
                const Icon = d.icon;
                const colorMap: Record<
                  string,
                  { ring: string; bg: string; icon: string }
                > = {
                  blue: {
                    ring: "ring-blue-500 border-blue-500",
                    bg: "bg-blue-50 dark:bg-blue-950",
                    icon: "text-blue-600",
                  },
                  violet: {
                    ring: "ring-violet-500 border-violet-500",
                    bg: "bg-violet-50 dark:bg-violet-950",
                    icon: "text-violet-600",
                  },
                };
                const c = colorMap[d.color] ?? colorMap.blue;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelect(key)}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? `${c.ring} ${c.bg} ring-1`
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 rounded-lg p-2 ${isSelected ? c.bg : "bg-muted"}`}
                      >
                        <Icon
                          className={`h-5 w-5 ${isSelected ? c.icon : "text-muted-foreground"}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{d.label}</span>
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${cfg?.is_active ? "bg-green-500" : "bg-muted-foreground/30"}`}
                            title={cfg?.is_active ? "Activo" : "Inactivo"}
                          />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {d.desc}
                        </p>
                        {cfg ? (
                          <p className="mt-1.5 text-xs text-muted-foreground/70">
                            {cfg.provider} / {cfg.model_name} ·{" "}
                            {cfg.is_active ? "Activo" : "Inactivo"}
                          </p>
                        ) : (
                          <p className="mt-1.5 text-xs italic text-amber-500">
                            Sin configurar
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
        </div>

        {/* ── Panel derecho: editor en secciones ── */}
        <div className="space-y-4 lg:col-span-2">
          {/* Resumen */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {def && <def.icon className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <h4 className="text-base font-semibold">
                      {def?.label ?? selectedKey}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {def?.desc ?? selectedKey}
                    </p>
                  </div>
                </div>
                {canEdit && selectedConfig && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleActive}
                  >
                    {form.activo ? (
                      <Power className="mr-1.5 h-3.5 w-3.5" />
                    ) : (
                      <PowerOff className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {form.activo ? "Activo" : "Desactivado"}
                  </Button>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-muted px-3 py-2">
                  <p className="text-xs text-muted-foreground">Proveedor</p>
                  <p className="text-sm font-medium">
                    {selectedConfig?.provider ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <p className="text-xs text-muted-foreground">Modelo</p>
                  <p className="truncate text-sm font-medium">
                    {selectedConfig?.model_name ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <p className="text-xs text-muted-foreground">Clave API</p>
                  <p className="text-sm font-medium">
                    {selectedConfig?.has_api_key ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Shield className="h-3 w-3" /> Registrada
                      </span>
                    ) : (
                      "Sin registrar"
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <p className="text-xs text-muted-foreground">Actualizado</p>
                  <p className="text-sm font-medium">
                    {selectedConfig
                      ? new Date(selectedConfig.updated_at).toLocaleDateString(
                          "es-MX",
                        )
                      : "—"}
                  </p>
                </div>
              </div>
              {!selectedConfig && (
                <div className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-center dark:border-amber-700 dark:bg-amber-950">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Este modulo no esta configurado. Completa los campos y guarda
                    para inicializarlo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Motor IA */}
          <SectionToggle
            title="Motor IA"
            icon={Cpu}
            open={openSections.motor}
            onToggle={() => toggleSection("motor")}
          >
            {/* Selector de proveedor */}
            <div className="mb-4">
              <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Proveedor
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {AI_PROVIDERS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    disabled={!canEdit}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        provider: p.key,
                        modelo: p.models[0],
                      }))
                    }
                    className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      form.provider === p.key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <Bot
                      className={`h-5 w-5 ${form.provider === p.key ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span
                      className={`text-sm font-medium ${form.provider === p.key ? "text-primary" : ""}`}
                    >
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre, modelo, API key */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre del modulo</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nombre: e.target.value }))
                  }
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <select
                  value={form.modelo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, modelo: e.target.value }))
                  }
                  disabled={!canEdit}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedProvider.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Clave API</Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={form.apiKey}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, apiKey: e.target.value }))
                    }
                    placeholder={
                      selectedConfig?.has_api_key
                        ? "Dejar vacio para mantener la actual"
                        : "Ingresa la clave API del proveedor"
                    }
                    disabled={!canEdit}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {selectedConfig?.has_api_key && (
                  <p className="flex items-center gap-1 text-xs text-green-600">
                    <Shield className="h-3 w-3" /> Clave registrada en el
                    servidor
                  </p>
                )}
              </div>
            </div>
          </SectionToggle>

          {/* Reglas del modulo */}
          <SectionToggle
            title="Reglas del modulo"
            icon={Shield}
            open={openSections.reglas}
            onToggle={() => toggleSection("reglas")}
          >
            {isChatModule ? (
              <>
                <p className="mb-4 text-xs text-muted-foreground">
                  Controla la disponibilidad y limites del asistente IA
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={form.chatbotActivo}
                      onCheckedChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          chatbotActivo: v === true,
                        }))
                      }
                      disabled={!canEdit}
                    />
                    <div>
                      <p className="text-sm font-medium">Chatbot activo</p>
                      <p className="text-xs text-muted-foreground">
                        Mostrar asistente a usuarios
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={form.modoAvanzado}
                      onCheckedChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          modoAvanzado: v === true,
                        }))
                      }
                      disabled={!canEdit}
                    />
                    <div>
                      <p className="text-sm font-medium">Modo avanzado</p>
                      <p className="text-xs text-muted-foreground">
                        Permitir consultas IA por API
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Limite de preguntas/hora</Label>
                    <Input
                      type="number"
                      min={1}
                      max={200}
                      value={form.maxPreguntasPorHora}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          maxPreguntasPorHora:
                            parseInt(e.target.value) || 20,
                        }))
                      }
                      disabled={!canEdit}
                    />
                    <p className="text-xs text-muted-foreground">
                      Rate limiting por usuario
                    </p>
                  </div>
                </div>
                {/* Prompt del chatbot */}
                <div className="mt-4 space-y-2">
                  <Label>Prompt del sistema</Label>
                  <Textarea
                    value={form.promptSistema}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        promptSistema: e.target.value,
                      }))
                    }
                    placeholder="Instrucciones para el asistente CCTV. Ej: Responde preguntas sobre camaras, NVRs, tickets y el inventario del sistema..."
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-xs text-muted-foreground">
                  Configuracion del analizador de infraestructura CCTV
                </p>
                {/* Prompt del analizador */}
                <div className="space-y-2">
                  <Label>Prompt del sistema</Label>
                  <Textarea
                    value={form.promptSistema}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        promptSistema: e.target.value,
                      }))
                    }
                    placeholder="Instrucciones para el analisis de infraestructura. Ej: Analizar fichas tecnicas de camaras, extraer especificaciones, generar embeddings para busqueda semantica..."
                    rows={4}
                    disabled={!canEdit}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este prompt guia al modelo cuando analiza documentos y fichas
                    tecnicas de equipos CCTV.
                  </p>
                </div>
              </>
            )}
          </SectionToggle>

          {/* Avanzado */}
          <SectionToggle
            title="Avanzado"
            icon={Settings2}
            open={openSections.avanzado}
            onToggle={() => toggleSection("avanzado")}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Temperatura:{" "}
                  <span className="font-mono text-primary">
                    {form.temperatura.toFixed(1)}
                  </span>
                </Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={form.temperatura}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      temperatura: parseFloat(e.target.value),
                    }))
                  }
                  disabled={!canEdit}
                  className="mt-2 w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Preciso (0)</span>
                  <span>Creativo (1)</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Limite de respuesta (tokens)</Label>
                <Input
                  type="number"
                  min={100}
                  max={16384}
                  value={form.maxTokens}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxTokens: parseInt(e.target.value) || 4096,
                    }))
                  }
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Maximo de tokens en la respuesta del modelo
                </p>
              </div>
            </div>
          </SectionToggle>

          {/* Prueba (solo chatbot) */}
          {isChatModule && (
            <SectionToggle
              title="Prueba"
              icon={MessageCircle}
              open={openSections.prueba}
              onToggle={() => toggleSection("prueba")}
            >
              <p className="mb-3 text-xs text-muted-foreground">
                Envia un mensaje de prueba al asistente para verificar su
                funcionamiento.{" "}
                {!form.apiKey && (
                  <span className="text-amber-500">
                    Ingresa la clave API arriba para habilitar la prueba.
                  </span>
                )}
              </p>
              <div className="rounded-lg border bg-muted/30">
                {/* Mensajes */}
                <div className="max-h-48 space-y-2 overflow-y-auto p-3">
                  {chatMessages.length === 0 && (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      Escribe un mensaje para probar el asistente
                    </p>
                  )}
                  {chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card shadow-sm"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatTesting && (
                    <div className="flex justify-start">
                      <div className="rounded-lg bg-card px-3 py-2 shadow-sm">
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                {/* Input */}
                <div className="flex items-center gap-2 border-t p-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleChatTest()
                    }
                    placeholder="Ej: cuantas camaras hay activas?"
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleChatTest}
                    disabled={!chatInput.trim() || chatTesting || !form.apiKey}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Metricas de uso */}
              {chatUsage && (
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Tokens entrada: <strong className="text-foreground">{chatUsage.input_tokens}</strong></span>
                  <span>Tokens salida: <strong className="text-foreground">{chatUsage.output_tokens}</strong></span>
                  <span>Latencia: <strong className="text-foreground">{chatUsage.latency_ms}ms</strong></span>
                </div>
              )}
            </SectionToggle>
          )}

          {/* Acciones inferiores */}
          {canEdit && (
            <div className="flex items-center justify-between border-t pt-4">
              {selectedConfig && (
                <Button
                  variant="outline"
                  onClick={handleToggleActive}
                >
                  {form.activo ? (
                    <PowerOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Power className="mr-2 h-4 w-4" />
                  )}
                  {form.activo ? "Desactivar modulo" : "Activar modulo"}
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className={selectedConfig ? "" : "ml-auto"}
              >
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar cambios
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
