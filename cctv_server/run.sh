#!/bin/bash
# run.sh - Script para ejecutar el servidor

set -e

# Verificar si existe .env
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo "⚠️  Please edit .env with your configuration"
    else
        echo "❌ Error: .env.example not found"
        exit 1
    fi
fi

# Compilar si no existe el binario
if [ ! -f bin/server ]; then
    echo "📦 No binary found. Building..."
    ./build.sh
fi

echo "🚀 Starting SyMTickets CCTV Server..."
echo ""
echo "📚 Swagger UI: http://localhost:8080/swagger/index.html"
echo "🏥 Health Check: http://localhost:8080/health"
echo ""

# Ejecutar servidor
./bin/server
