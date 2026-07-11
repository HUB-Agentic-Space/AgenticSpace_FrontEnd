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

# Copy dashboard build if it exists
DASHBOARD_DIR="$(dirname "$FRONTEND_DIR")/frontend_dashboard"
if [ -d "$DASHBOARD_DIR/out" ]; then
  echo "Copying dashboard build to backend/public/admin..."
  rm -rf "$BACKEND_DIR/public/admin"
  mkdir -p "$BACKEND_DIR/public/admin"
  cp -r "$DASHBOARD_DIR/out/." "$BACKEND_DIR/public/admin/"
  echo "Dashboard copy completed!"
else
  echo "Dashboard build not found, skipping (run 'npm run build' in frontend_dashboard first)."
fi

echo "Copy completed successfully!"
