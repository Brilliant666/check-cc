#!/usr/bin/env bash
set -euo pipefail

# CheckCC VPS one-command deployment.
# Intended for Ubuntu 22.04/24.04 and Debian 12 with Docker Engine + Compose v2.
#
# Usage:
#   cp .env.example .env
#   ./deploy/deploy.sh
#
# Optional:
#   CHECKCC_BIND=127.0.0.1 ./deploy/deploy.sh   # bind behind a reverse proxy
#   CHECKCC_PORT=8080 ./deploy/deploy.sh
#
# This script only builds and runs the container. Domain, TLS, and the outer
# reverse proxy are intentionally left to the server owner.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() { printf '[CheckCC] %s\n' "$1"; }
fail() { printf '[CheckCC] ERROR: %s\n' "$1" >&2; exit 1; }

if ! command -v docker >/dev/null 2>&1; then
  fail "Docker is not installed. Install Docker Engine first: https://docs.docker.com/engine/install/"
fi

if ! timeout 10 docker info >/dev/null 2>&1; then
  fail "Docker daemon is not running or the current user lacks permission. Run: sudo systemctl enable --now docker; sudo usermod -aG docker \$USER; then log in again."
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  fail "Docker Compose v2 is required. Install the docker-compose-plugin package."
fi

if [ ! -f .env ]; then
  cp .env.example .env
  log "Created .env from .env.example. Set NEXT_PUBLIC_SITE_URL before exposing the site."
fi

log "Building the static site and starting the container..."
"${COMPOSE[@]}" up -d --build --remove-orphans

log "Waiting for the container health check..."
for _ in $(seq 1 30); do
  STATUS="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' checkcc 2>/dev/null || true)"
  if [ "$STATUS" = "healthy" ]; then
    break
  fi
  if [ "$STATUS" = "unhealthy" ] || [ "$STATUS" = "exited" ]; then
    "${COMPOSE[@]}" logs --tail=80 checkcc || true
    fail "Container did not become healthy (status: ${STATUS})."
  fi
  sleep 2
done

if [ "${STATUS:-}" != "healthy" ]; then
  "${COMPOSE[@]}" logs --tail=80 checkcc || true
  fail "Timed out waiting for the health check."
fi

# Read the actual published mapping so shell overrides and .env both work.
MAPPING="$("${COMPOSE[@]}" port checkcc 80 2>/dev/null | head -n 1 || true)"
BIND="${MAPPING%:*}"
PORT="${MAPPING##*:}"
BIND="${BIND#[}"
BIND="${BIND%]}"
BIND="${BIND:-0.0.0.0}"
PORT="${PORT:-8080}"

if [ "$BIND" = "127.0.0.1" ] || [ "$BIND" = "localhost" ]; then
  URL="http://127.0.0.1:${PORT}"
elif [ "$BIND" = "0.0.0.0" ] || [ "$BIND" = "::" ]; then
  IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  URL="http://${IP:-127.0.0.1}:${PORT}"
else
  URL="http://${BIND}:${PORT}"
fi

SITE_URL="${NEXT_PUBLIC_SITE_URL:-$(sed -n 's/^NEXT_PUBLIC_SITE_URL=//p' .env | tail -n 1)}"

log "CheckCC is running."
log "Local URL: ${URL}"
log "Health:    ${URL}/healthz"
log "Logs:      ${COMPOSE[*]} logs -f checkcc"
log "Restart:   ${COMPOSE[*]} up -d --build"
log "Stop:      ${COMPOSE[*]} down"
log ""
log "Domain/TLS are not configured by this script. Point your reverse proxy at ${BIND}:${PORT}."
if [ -z "$SITE_URL" ]; then
  log "NEXT_PUBLIC_SITE_URL is empty: canonical, hreflang, OG URL, and sitemap entries are omitted."
fi
