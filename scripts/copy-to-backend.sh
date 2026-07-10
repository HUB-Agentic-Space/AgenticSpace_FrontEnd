#!/bin/bash
# Script para copiar o build estático e arquivos públicos para o backend

set -e

FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$(dirname "$FRONTEND_DIR")/backend"

echo "Copying build to backend..."

# Remove e recria diretório public do backend
rm -rf "$BACKEND_DIR/public"
mkdir -p "$BACKEND_DIR/public"

# Copia build estático (out/)
cp -r "$FRONTEND_DIR/out/." "$BACKEND_DIR/public/"

# Copia todo o public/ usando rsync para mesclar
rsync -av --exclude='_next' "$FRONTEND_DIR/public/" "$BACKEND_DIR/public/" 2>/dev/null || true

echo "Copy completed successfully!"
