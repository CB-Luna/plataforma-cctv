#!/bin/bash
# swagger.sh - Script para regenerar documentación Swagger

set -e

echo "📚 Regenerating Swagger documentation..."

# Regenerar docs - escanear main.go y todos los handlers
~/go/bin/swag init -g cmd/main.go --dir ./ --parseDependency --parseInternal

echo "✅ Swagger documentation updated!"
echo ""
echo "Files generated:"
echo "  - docs/docs.go"
echo "  - docs/swagger.json"
echo "  - docs/swagger.yaml"
echo ""
echo "View at: http://localhost:8080/swagger/index.html"
