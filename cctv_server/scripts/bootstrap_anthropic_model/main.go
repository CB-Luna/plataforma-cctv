package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/config"
)

const defaultSystemPrompt = `Eres un asistente especializado en inventario CCTV para SymTickets.
Ayudas a analizar archivos Excel o CSV de clientes y companias para poblar inventario de NVRs, licencias y camaras.
Prioriza exactitud operacional, mapeos consistentes y respuestas claras en espanol.`

func main() {
	var (
		tenantID           = flag.String("tenant-id", "", "Tenant UUID donde se registrara el modelo")
		name               = flag.String("name", "Claude Inventory Assistant", "Nombre de la configuracion")
		modelName          = flag.String("model", "claude-sonnet-4-5-20250929", "Nombre del modelo Anthropic")
		apiEndpoint        = flag.String("api-endpoint", "https://api.anthropic.com/v1", "Endpoint base de Anthropic")
		apiVersion         = flag.String("api-version", "2023-06-01", "Version de API Anthropic")
		defaultTemperature = flag.Float64("temperature", 0.2, "Temperatura por defecto")
		defaultTopP        = flag.Float64("top-p", 0.9, "Top-P por defecto")
		defaultMaxTokens   = flag.Int("max-tokens", 1200, "Max tokens por defecto")
		maxTokensRequest   = flag.Int("max-tokens-request", 4000, "Limite maximo de tokens por request")
		maxRequestsDay     = flag.Int("max-requests-day", 1000, "Limite maximo diario")
		maxRequestsHour    = flag.Int("max-requests-hour", 100, "Limite maximo por hora")
		monthlyBudget      = flag.Float64("monthly-budget", 100, "Presupuesto mensual en USD")
		description        = flag.String("description", "Modelo Claude para analisis asistido de importacion de inventario CCTV", "Descripcion")
		systemPrompt       = flag.String("system-prompt", defaultSystemPrompt, "Prompt de sistema guardado en settings")
		setDefault         = flag.Bool("set-default", true, "Marcar como modelo default del tenant")
		setActive          = flag.Bool("active", true, "Marcar como modelo activo")
		dryRun             = flag.Bool("dry-run", false, "Simular sin escribir en la base")
	)
	flag.Parse()

	if strings.TrimSpace(*tenantID) == "" {
		log.Fatal("tenant-id is required")
	}

	apiKey := strings.TrimSpace(os.Getenv("ANTHROPIC_API_KEY"))
	if apiKey == "" {
		log.Fatal("ANTHROPIC_API_KEY environment variable is required")
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	ctx := context.Background()
	dbPool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	var tenantName string
	if err := dbPool.QueryRow(ctx, `select name from public.tenants where id = $1::uuid`, *tenantID).Scan(&tenantName); err != nil {
		log.Fatalf("tenant not found: %v", err)
	}

	capabilities, _ := json.Marshal(map[string]interface{}{
		"chat":              true,
		"structured_output": true,
		"inventory_import":  true,
	})
	settings, _ := json.Marshal(map[string]interface{}{
		"system_prompt": strings.TrimSpace(*systemPrompt),
	})

	if *dryRun {
		fmt.Printf("dry-run ok\n")
		fmt.Printf("tenant=%s (%s)\n", tenantName, *tenantID)
		fmt.Printf("name=%s provider=anthropic model=%s\n", *name, *modelName)
		fmt.Printf("endpoint=%s version=%s active=%t default=%t\n", *apiEndpoint, *apiVersion, *setActive, *setDefault)
		return
	}

	tx, err := dbPool.Begin(ctx)
	if err != nil {
		log.Fatalf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback(ctx)

	var modelID string
	err = tx.QueryRow(ctx, `
		insert into intelligence.model_configs (
			tenant_id,
			name,
			provider,
			model_name,
			api_key_encrypted,
			api_endpoint,
			api_version,
			default_temperature,
			default_max_tokens,
			default_top_p,
			max_tokens_per_request,
			max_requests_per_day,
			max_requests_per_hour,
			monthly_budget_usd,
			is_active,
			description,
			capabilities,
			settings
		)
		values (
			$1::uuid,
			$2,
			'anthropic',
			$3,
			$4,
			$5,
			$6,
			$7,
			$8,
			$9,
			$10,
			$11,
			$12,
			$13,
			$14,
			$15,
			$16::jsonb,
			$17::jsonb
		)
		on conflict (tenant_id, name) do update
		set provider = excluded.provider,
		    model_name = excluded.model_name,
		    api_key_encrypted = excluded.api_key_encrypted,
		    api_endpoint = excluded.api_endpoint,
		    api_version = excluded.api_version,
		    default_temperature = excluded.default_temperature,
		    default_max_tokens = excluded.default_max_tokens,
		    default_top_p = excluded.default_top_p,
		    max_tokens_per_request = excluded.max_tokens_per_request,
		    max_requests_per_day = excluded.max_requests_per_day,
		    max_requests_per_hour = excluded.max_requests_per_hour,
		    monthly_budget_usd = excluded.monthly_budget_usd,
		    is_active = excluded.is_active,
		    description = excluded.description,
		    capabilities = excluded.capabilities,
		    settings = excluded.settings,
		    updated_at = current_timestamp
		returning id::text`,
		*tenantID,
		strings.TrimSpace(*name),
		strings.TrimSpace(*modelName),
		apiKey,
		strings.TrimSpace(*apiEndpoint),
		strings.TrimSpace(*apiVersion),
		*defaultTemperature,
		*defaultMaxTokens,
		*defaultTopP,
		*maxTokensRequest,
		nullIfZero(*maxRequestsDay),
		nullIfZero(*maxRequestsHour),
		*monthlyBudget,
		*setActive,
		strings.TrimSpace(*description),
		string(capabilities),
		string(settings),
	).Scan(&modelID)
	if err != nil {
		log.Fatalf("failed to upsert model config: %v", err)
	}

	if *setDefault {
		if _, err := tx.Exec(ctx, `
			update intelligence.model_configs
			set is_default = case when id = $2::uuid then true else false end
			where tenant_id = $1::uuid
		`, *tenantID, modelID); err != nil {
			log.Fatalf("failed to set default model config: %v", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatalf("failed to commit transaction: %v", err)
	}

	fmt.Printf("anthropic model ready\n")
	fmt.Printf("tenant=%s (%s)\n", tenantName, *tenantID)
	fmt.Printf("model_config_id=%s\n", modelID)
	fmt.Printf("name=%s model=%s default=%t active=%t\n", *name, *modelName, *setDefault, *setActive)
}

func nullIfZero(value int) interface{} {
	if value <= 0 {
		return nil
	}
	return value
}
