-- internal/database/queries/intelligence.sql
-- Queries para sistema de inteligencia artificial
-- ==================== MODEL CONFIGS ====================
-- name: CreateModelConfig :one
INSERT INTO intelligence.model_configs (
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
        description,
        capabilities,
        settings,
        created_by
    )
VALUES (
        $1,
        $2,
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
        $16,
        $17,
        $18
    )
RETURNING *;
-- name: GetModelConfig :one
SELECT *
FROM intelligence.model_configs
WHERE id = $1
    AND tenant_id = $2
LIMIT 1;
-- name: GetDefaultModelConfig :one
SELECT *
FROM intelligence.model_configs
WHERE tenant_id = $1
    AND is_default = true
    AND is_active = true
LIMIT 1;
-- name: ListModelConfigs :many
SELECT *
FROM intelligence.model_configs
WHERE tenant_id = $1
ORDER BY created_at DESC;
-- name: ListActiveModelConfigs :many
SELECT *
FROM intelligence.model_configs
WHERE tenant_id = $1
    AND is_active = true
ORDER BY is_default DESC,
    name;
-- name: UpdateModelConfig :one
UPDATE intelligence.model_configs
SET name = $2,
    api_endpoint = $3,
    default_temperature = $4,
    default_max_tokens = $5,
    max_requests_per_day = $6,
    monthly_budget_usd = $7,
    description = $8,
    settings = $9,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: SetDefaultModelConfig :exec
UPDATE intelligence.model_configs
SET is_default = CASE
        WHEN id = $2 THEN true
        ELSE false
    END
WHERE tenant_id = $1;
-- name: ToggleModelConfigActive :one
UPDATE intelligence.model_configs
SET is_active = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: DeleteModelConfig :exec
DELETE FROM intelligence.model_configs
WHERE id = $1
    AND tenant_id = $2;
-- ==================== PROMPT TEMPLATES ====================
-- name: CreatePromptTemplate :one
INSERT INTO intelligence.prompt_templates (
        tenant_id,
        name,
        category,
        system_prompt,
        user_prompt_template,
        model_config_id,
        temperature,
        max_tokens,
        response_format,
        description,
        variables,
        example_input,
        example_output,
        version,
        parent_template_id,
        created_by
    )
VALUES (
        $1,
        $2,
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
        $16
    )
RETURNING *;
-- name: GetPromptTemplate :one
SELECT *
FROM intelligence.prompt_templates
WHERE id = $1
LIMIT 1;
-- name: ListPromptTemplates :many
SELECT *
FROM intelligence.prompt_templates
WHERE (
        tenant_id = $1
        OR tenant_id IS NULL
    )
    AND is_active = true
ORDER BY tenant_id NULLS LAST,
    name;
-- name: ListPromptTemplatesByCategory :many
SELECT *
FROM intelligence.prompt_templates
WHERE category = $1
    AND (
        tenant_id = $2
        OR tenant_id IS NULL
    )
    AND is_active = true
ORDER BY tenant_id NULLS LAST,
    name;
-- name: GetLatestTemplateVersion :one
SELECT *
FROM intelligence.prompt_templates
WHERE name = $1
    AND tenant_id = $2
ORDER BY version DESC
LIMIT 1;
-- name: UpdatePromptTemplate :one
UPDATE intelligence.prompt_templates
SET system_prompt = $2,
    user_prompt_template = $3,
    temperature = $4,
    max_tokens = $5,
    description = $6,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: DeactivatePromptTemplate :one
UPDATE intelligence.prompt_templates
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: DeletePromptTemplate :exec
DELETE FROM intelligence.prompt_templates
WHERE id = $1
    AND tenant_id = $2;
-- ==================== API CALLS ====================
-- name: CreateAPICall :one
INSERT INTO intelligence.api_calls (
        tenant_id,
        model_config_id,
        prompt_template_id,
        provider,
        model,
        prompt_text,
        system_prompt,
        temperature,
        max_tokens,
        parameters,
        related_entity_type,
        related_entity_id,
        triggered_by,
        status,
        started_at
    )
VALUES (
        $1,
        $2,
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
        $15
    )
RETURNING *;
-- name: GetAPICall :one
SELECT *
FROM intelligence.api_calls
WHERE id = $1
    AND tenant_id = $2
LIMIT 1;
-- name: UpdateAPICallResponse :one
UPDATE intelligence.api_calls
SET response_text = $2,
    finish_reason = $3,
    prompt_tokens = $4,
    completion_tokens = $5,
    total_tokens = $6,
    estimated_cost_usd = $7,
    latency_ms = $8,
    completed_at = $9,
    status = $10,
    error_message = $11
WHERE id = $1
RETURNING *;
-- name: ListAPICallsByTenant :many
SELECT *
FROM intelligence.api_calls
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
-- name: ListAPICallsByEntity :many
SELECT *
FROM intelligence.api_calls
WHERE tenant_id = $1
    AND related_entity_type = $2
    AND related_entity_id = $3
ORDER BY created_at DESC;
-- name: GetTotalTokensUsed :one
SELECT COALESCE(SUM(total_tokens), 0)::BIGINT
FROM intelligence.api_calls
WHERE tenant_id = $1
    AND status = 'success';
-- name: GetTotalCost :one
SELECT COALESCE(SUM(estimated_cost_usd), 0)
FROM intelligence.api_calls
WHERE tenant_id = $1
    AND status = 'success';
-- ==================== ANALYSES ====================
-- name: CreateAnalysis :one
INSERT INTO intelligence.analyses (
        tenant_id,
        analysis_type,
        input_type,
        input_reference,
        input_data,
        result,
        confidence_score,
        api_call_id,
        model_used,
        processing_time_ms
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;
-- name: GetAnalysis :one
SELECT *
FROM intelligence.analyses
WHERE id = $1
    AND tenant_id = $2
LIMIT 1;
-- name: ListAnalysesByType :many
SELECT *
FROM intelligence.analyses
WHERE tenant_id = $1
    AND analysis_type = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
-- name: ListUnverifiedAnalyses :many
SELECT *
FROM intelligence.analyses
WHERE tenant_id = $1
    AND is_verified = false
ORDER BY created_at DESC
LIMIT $2;
-- name: VerifyAnalysis :one
UPDATE intelligence.analyses
SET is_verified = true,
    verified_by = $2,
    verified_at = CURRENT_TIMESTAMP,
    verification_notes = $3,
    is_correct = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
-- name: GetAnalysisAccuracyRate :one
SELECT COUNT(*) as total_verified,
    COUNT(
        CASE
            WHEN is_correct = true THEN 1
        END
    ) as correct_count,
    COALESCE(
        ROUND(
            COUNT(
                CASE
                    WHEN is_correct = true THEN 1
                END
            )::DECIMAL / NULLIF(COUNT(*), 0) * 100,
            2
        ),
        0
    ) as accuracy_rate
FROM intelligence.analyses
WHERE tenant_id = $1
    AND is_verified = true;
-- ==================== USAGE SUMMARY ====================
-- name: CreateUsageSummary :one
INSERT INTO intelligence.usage_summary (
        tenant_id,
        period_type,
        period_start,
        period_end,
        total_api_calls,
        successful_calls,
        failed_calls,
        total_tokens,
        total_prompt_tokens,
        total_completion_tokens,
        total_cost_usd,
        usage_by_provider,
        usage_by_model
    )
VALUES (
        $1,
        $2,
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
        $13
    )
RETURNING *;
-- name: GetUsageSummary :one
SELECT *
FROM intelligence.usage_summary
WHERE tenant_id = $1
    AND period_type = $2
    AND period_start = $3
    AND period_end = $4
LIMIT 1;
-- name: UpdateUsageSummary :one
UPDATE intelligence.usage_summary
SET total_api_calls = $2,
    successful_calls = $3,
    failed_calls = $4,
    total_tokens = $5,
    total_prompt_tokens = $6,
    total_completion_tokens = $7,
    total_cost_usd = $8,
    usage_by_provider = $9,
    usage_by_model = $10,
    updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = $1
    AND period_type = $11
    AND period_start = $12
    AND period_end = $13
RETURNING *;
-- name: ListUsageSummaries :many
SELECT *
FROM intelligence.usage_summary
WHERE tenant_id = $1
ORDER BY period_start DESC,
    period_type
LIMIT $2 OFFSET $3;
-- name: GetMonthlyUsage :one
SELECT *
FROM intelligence.usage_summary
WHERE tenant_id = $1
    AND period_type = 'month'
    AND period_start <= $2
    AND period_end >= $2
LIMIT 1;