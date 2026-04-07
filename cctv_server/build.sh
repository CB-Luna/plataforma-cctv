#!/bin/bash
# build.sh - Script para compilar el servidor

set -e

echo "🔨 Building SyMTickets CCTV Server..."

# Limpiar binarios anteriores
rm -f bin/server

# Compilar
go build -o bin/server ./cmd/main.go

echo "✅ Build completed! Binary: bin/server"
echo ""
echo "To run the server:"
echo "  ./run.sh"
echo ""
