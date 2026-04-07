# Makefile — sistema-camaras-mono
# Targets top-level para el monorepo

.PHONY: up down restart logs ps build test migrate clean

# === Docker Compose ===

up:
	docker compose up -d

up-all:
	docker compose --profile tools --profile frontend up -d

down:
	docker compose down

restart:
	docker compose down && docker compose up -d

logs:
	docker compose logs -f

ps:
	docker compose ps

# === Build ===

build:
	docker compose build

build-backend:
	docker compose build backend

build-frontend:
	docker compose build frontend

# === Migrations ===

migrate:
	docker compose --profile tools run --rm migrate

migrate-down:
	docker compose --profile tools run --rm migrate -path=/migrations \
		-database="postgresql://$${DATABASE_USER:-postgres}:$${DATABASE_PASSWORD:-joselo1341}@postgres:5432/$${DATABASE_NAME:-symtickets}?sslmode=disable" \
		down 1

# === Tests ===

test: test-web

test-web:
	cd cctv_web && npm test

test-web-e2e:
	cd cctv_web && npx playwright test

# === Dev (local, without Docker) ===

dev-backend:
	cd cctv_server && go run ./cmd/main.go

dev-web:
	cd cctv_web && npm run dev -- -p 3010

# === Cleanup ===

clean:
	docker compose down -v --remove-orphans
	rm -rf cctv_web/.next cctv_web/node_modules
