# SyMTickets CCTV - Backend Server

## 🚀 Inicio Rápido

### Requisitos
- Go 1.23+
- PostgreSQL 17+
- golang-migrate

### Configuración de Base de Datos

```bash
# Credenciales de desarrollo
Host: localhost
Puerto: 5433
Usuario: postgres
Password: joselo1341
Base de datos: symtickets
```

### Crear Base de Datos

```bash
# Conectar a PostgreSQL
PGPASSWORD=joselo1341 psql -h localhost -p 5433 -U postgres

# Crear base de datos
CREATE DATABASE symtickets;
\q
```

### Ejecutar Migraciones

```bash
# Instalar golang-migrate
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Ejecutar todas las migraciones
migrate -path internal/database/migrations \
        -database "postgres://postgres:joselo1341@localhost:5433/symtickets?sslmode=disable" up

# Ver estado
migrate -path internal/database/migrations \
        -database "postgres://postgres:joselo1341@localhost:5433/symtickets?sslmode=disable" version

# Revertir última migración
migrate -path internal/database/migrations \
        -database "postgres://postgres:joselo1341@localhost:5433/symtickets?sslmode=disable" down 1
```

### Estructura del Proyecto

```
cctv_server/
├── cmd/
│   └── main.go
├── internal/
│   ├── database/
│   │   ├── migrations/      # 16 archivos de migración (up/down)
│   │   ├── queries/         # Queries SQL para sqlc
│   │   └── sqlc/            # Código generado (no editar)
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   └── repositories/
├── .env.example
├── go.mod
└── README.md
```

### Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```bash
DATABASE_URL=postgres://postgres:joselo1341@localhost:5433/symtickets?sslmode=disable
JWT_SECRET=tu-secreto-jwt
SERVER_PORT=8080
MINIO_BASE_URL=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=symtickets
```

Para bootstrap de un modelo Claude desde CLI:

```bash
ANTHROPIC_API_KEY=tu_api_key_real
```

### Stack Docker Local Recomendado

Desde la raíz del proyecto:

```bash
docker compose up -d postgres valkey nats minio pgadmin
```

Puertos por defecto del entorno local:

```bash
PostgreSQL: 5433
Valkey: 6379
NATS client: 4222
NATS monitor: 8222
MinIO API: 9000
MinIO Console: 9001
PgAdmin: 5050
```

## 🚀 Ejecutar Servidor

### Opción 1: Usando scripts (recomendado)

```bash
# Compilar y ejecutar
./run.sh

# Solo compilar
./build.sh

# Desarrollo con hot reload
./dev.sh

# Regenerar documentación Swagger
./swagger.sh
```

### Opción 2: Comandos manuales

```bash
# Compilar
go build -o bin/server ./cmd/main.go

# Ejecutar
./bin/server

# O directamente con go run
go run cmd/main.go
```

## Claude / Anthropic

La administración web de modelos IA ya usa `intelligence.model_configs` y permite alta/edición de modelos `anthropic` desde `/ai-models`.

Si prefieres bootstrap por CLI para un tenant existente:

```bash
cd cctv_server
ANTHROPIC_API_KEY=tu_api_key_real \
go run ./scripts/bootstrap_anthropic_model \
  --tenant-id TU_TENANT_UUID \
  --name "Claude Inventory Assistant" \
  --model "claude-sonnet-4-5-20250929" \
  --set-default
```

Modo simulación:

```bash
ANTHROPIC_API_KEY=tu_api_key_real \
go run ./scripts/bootstrap_anthropic_model \
  --tenant-id TU_TENANT_UUID \
  --dry-run
```

## Gemini Embedding / Vertex AI

El primer corte backend de búsqueda semántica de modelos de cámaras usa:

- `provider = google`
- `model_name = gemini-embedding-2-preview`
- tablas `intelligence.embedding_documents` y `intelligence.embedding_vectors`
- endpoint `GET /api/v1/inventory/models/search/semantic`

Configuración recomendada en `intelligence.model_configs.settings`:

```json
{
  "vertex_project_id": "mi-proyecto-gcp",
  "vertex_location": "us-central1",
  "service_account_json": "{...json de service account...}",
  "query_task_type": "RETRIEVAL_QUERY",
  "document_task_type": "RETRIEVAL_DOCUMENT",
  "output_dimensionality": 3072
}
```

Alternativas por variables de entorno:

- `GOOGLE_VERTEX_PROJECT_ID`
- `GOOGLE_VERTEX_LOCATION`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
- `GOOGLE_VERTEX_ACCESS_TOKEN`

## Storage Actual

- almacenamiento operativo: `MinIO`
- arranque local: `docker compose` + `start-backend-local.sh`

Endpoints nuevos:

- `POST /api/v1/intelligence/embeddings/reindex/models`
- `POST /api/v1/intelligence/embeddings/reindex/model/:id`
- `GET /api/v1/inventory/models/search/semantic?query=camara+poe+4mp`

## 📚 Documentación Swagger

Una vez que el servidor esté corriendo, accede a:

**Swagger UI:** http://localhost:8080/swagger/index.html

### Endpoints Disponibles

- **Health Check:** `GET /health`
- **Swagger JSON:** `GET /swagger/doc.json`
- **Clients:**
  - `GET /api/v1/clients` - Listar clientes
  - `GET /api/v1/clients/:id` - Obtener cliente
  - `POST /api/v1/clients` - Crear cliente

### Regenerar Documentación

Después de agregar anotaciones Swagger a nuevos handlers:

```bash
./swagger.sh
# O manualmente:
~/go/bin/swag init -g cmd/main.go
```

## 🔐 Autenticación

Todos los endpoints bajo `/api/v1/*` requieren autenticación JWT.

Header requerido:
```
Authorization: Bearer <tu-jwt-token>
```
