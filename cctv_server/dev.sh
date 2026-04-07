#!/bin/bash
# dev.sh - Script para desarrollo con hot reload usando air

set -e

# Verificar si air está instalado
if ! command -v air &> /dev/null; then
    echo "📦 Installing air for hot reload..."
    go install github.com/air-verse/air@latest
fi

echo "🔥 Starting development server with hot reload..."
echo ""
echo "📚 Swagger UI: http://localhost:8080/swagger/index.html"
echo "🏥 Health Check: http://localhost:8080/health"
echo ""

# Ejecutar con air
air
