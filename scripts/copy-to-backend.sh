#!/bin/bash
# Script para copiar o build estático e arquivos públicos para o backend

set -e

FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$(dirname "$FRONTEND_DIR")/backend"

echo "Copying build to backend..."

# Garante que o diretório public do backend existe
mkdir -p "$BACKEND_DIR/public"

# Copia build estático (out/) preservando o subdiretório admin/ (dashboard)
rsync -av --delete --exclude='admin' "$FRONTEND_DIR/out/" "$BACKEND_DIR/public/" 2>/dev/null || true

# Copia todo o public/ usando rsync para mesclar (preserva admin/)
rsync -av --exclude='_next' --exclude='admin' "$FRONTEND_DIR/public/" "$BACKEND_DIR/public/" 2>/dev/null || true

# Copy dashboard build if it exists (optional, dashboard has its own copy script)
DASHBOARD_DIR="$(dirname "$FRONTEND_DIR")/frontend_dashboard"
if [ -d "$DASHBOARD_DIR/out" ]; then
  echo "Copying dashboard build to backend/public/admin..."
  rm -rf "$BACKEND_DIR/public/admin"
  mkdir -p "$BACKEND_DIR/public/admin"
  cp -r "$DASHBOARD_DIR/out/." "$BACKEND_DIR/public/admin/"
  echo "Dashboard copy completed!"
else
  echo "Dashboard build not found, preserving existing admin/ if present."
fi

echo "Copy completed successfully!"
