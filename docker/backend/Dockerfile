# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache git make curl

# Copiar go mod files
COPY go.mod go.sum ./
RUN go mod download

# Instalar sqlc
RUN go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# Copiar código fuente
COPY . .

# Generar código con sqlc
RUN sqlc generate

# Build de la aplicación
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata curl

WORKDIR /root/

# Copiar binario desde builder
COPY --from=builder /app/main .

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Ejecutar aplicación
CMD ["./main"]
