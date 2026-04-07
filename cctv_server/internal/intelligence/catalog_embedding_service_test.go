package intelligence

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/symtickets/cctv_server/internal/database"
)

func TestBuildCatalogModelDocument(t *testing.T) {
	specifications, err := json.Marshal(map[string]interface{}{
		"video": map[string]interface{}{
			"resolution": "4MP",
			"poe":        true,
		},
		"ir_range_m": 30,
	})
	if err != nil {
		t.Fatalf("marshal specifications: %v", err)
	}

	partNumber := "DS-2CD2143G2-IU"
	row := catalogModelRow{
		ID:             pgtype.UUID{Valid: true},
		BrandName:      "Hikvision",
		EquipmentType:  "camera_ip",
		Name:           "Mini Dome 4MP",
		PartNumber:     &partNumber,
		Specifications: specifications,
	}

	title, summary, content := buildCatalogModelDocument(row)

	if title != "Hikvision Mini Dome 4MP" {
		t.Fatalf("unexpected title: %s", title)
	}
	if !strings.Contains(summary, "Marca: Hikvision") {
		t.Fatalf("summary should contain brand, got: %s", summary)
	}
	if !strings.Contains(content, "video.resolution: 4MP") {
		t.Fatalf("content should contain flattened spec, got: %s", content)
	}
	if !strings.Contains(content, "video.poe: si") {
		t.Fatalf("content should normalize booleans, got: %s", content)
	}
}

func TestParseGoogleEmbeddingSettings(t *testing.T) {
	settings, err := json.Marshal(map[string]interface{}{
		"vertex_project_id":     "demo-project",
		"vertex_location":       "us-central1",
		"query_task_type":       "RETRIEVAL_QUERY",
		"document_task_type":    "RETRIEVAL_DOCUMENT",
		"output_dimensionality": 3072,
		"service_account": map[string]interface{}{
			"project_id":   "demo-project",
			"private_key":  "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
			"client_email": "demo@example.iam.gserviceaccount.com",
		},
	})
	if err != nil {
		t.Fatalf("marshal settings: %v", err)
	}

	config := database.IntelligenceModelConfig{
		Name:      "Gemini Embeddings",
		Provider:  "google",
		ModelName: "gemini-embedding-2-preview",
		Settings:  settings,
	}

	parsed, err := parseGoogleEmbeddingSettings(config)
	if err != nil {
		t.Fatalf("parse settings: %v", err)
	}

	if parsed.VertexProjectID != "demo-project" {
		t.Fatalf("unexpected project id: %s", parsed.VertexProjectID)
	}
	if parsed.VertexLocation != "us-central1" {
		t.Fatalf("unexpected location: %s", parsed.VertexLocation)
	}
	if !strings.Contains(parsed.ServiceAccountJSON, "\"client_email\"") {
		t.Fatalf("expected nested service_account to be converted into JSON")
	}
}

func TestFormatVectorLiteral(t *testing.T) {
	vector := formatVectorLiteral([]float64{0.25, 1.5, -3})
	if vector != "[0.25,1.5,-3]" {
		t.Fatalf("unexpected vector literal: %s", vector)
	}
}
