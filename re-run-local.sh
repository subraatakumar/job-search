#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MODE="${1:-local}"
case "$MODE" in
  local)
    ENV_FILE="$SCRIPT_DIR/.env"
    COMPOSE_PROJECT="jobsearch-local"
    ;;
  prod)
    ENV_FILE="$SCRIPT_DIR/.env.prod"
    COMPOSE_PROJECT="jobsearch-prod"
    ;;
  *)
    echo "Usage: $0 [local|prod]"
    exit 1
    ;;
esac

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker is required. Install Docker Desktop and try again."
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  EXAMPLE_FILE="$SCRIPT_DIR/.env${MODE:+.$MODE}.example"
  [[ "$MODE" == "local" ]] && EXAMPLE_FILE="$SCRIPT_DIR/.env.example"
  echo "No $ENV_FILE file found. Creating it from $EXAMPLE_FILE."
  cp "$EXAMPLE_FILE" "$ENV_FILE"
  echo "Review $ENV_FILE before running again and set all secrets."
  exit 1
fi

if ! grep -q '^SESSION_SECRET=' "$ENV_FILE" || grep -q 'replace-with-at-least-32-random-characters' "$ENV_FILE"; then
  echo "Error: set a real SESSION_SECRET in $ENV_FILE before starting."
  exit 1
fi

echo "Stopping previous JobSearch containers..."
# Intentionally omit --volumes so the PostgreSQL data volume is preserved.
docker compose --project-name "$COMPOSE_PROJECT" --env-file "$ENV_FILE" -f compose.yml down --remove-orphans

echo "Building and starting JobSearch and PostgreSQL ($MODE)..."
docker compose --project-name "$COMPOSE_PROJECT" --env-file "$ENV_FILE" -f compose.yml up -d --build

echo "Waiting for JobSearch to become healthy..."
for _ in {1..30}; do
  HOST_PORT="$(grep '^JOBSEARCH_HOST_PORT=' "$ENV_FILE" | cut -d= -f2- || true)"
  HOST_PORT="${HOST_PORT:-3020}"
  if curl --fail --silent "http://127.0.0.1:${HOST_PORT}/api/health" >/dev/null; then
    echo "JobSearch ($MODE) is running at http://localhost:${HOST_PORT}"
    echo "Dashboard: http://localhost:${HOST_PORT}/dashboard"
    if [[ "$MODE" == "prod" ]]; then
      echo "Cloudflare Tunnel target: http://localhost:${HOST_PORT}"
    fi
    exit 0
  fi
  sleep 1
done

echo "Error: JobSearch did not become healthy within 30 seconds."
docker compose --project-name "$COMPOSE_PROJECT" --env-file "$ENV_FILE" -f compose.yml logs --tail=100 jobsearch
exit 1
