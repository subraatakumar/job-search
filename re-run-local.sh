#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker is required. Install Docker Desktop and try again."
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "No .env file found. Creating one from .env.example."
  cp .env.example .env
  echo "Review $SCRIPT_DIR/.env before running again, especially SESSION_SECRET."
  exit 1
fi

if ! grep -q '^SESSION_SECRET=' .env || grep -q 'replace-with-at-least-32-random-characters' .env; then
  echo "Error: set a real SESSION_SECRET in $SCRIPT_DIR/.env before starting."
  exit 1
fi

echo "Stopping previous JobSearch containers..."
# Intentionally omit --volumes so the PostgreSQL data volume is preserved.
docker compose -f compose.yml down --remove-orphans

echo "Building and starting JobSearch and PostgreSQL..."
docker compose -f compose.yml up -d --build

echo "Waiting for JobSearch to become healthy..."
for _ in {1..30}; do
  if curl --fail --silent http://127.0.0.1:3020/api/health >/dev/null; then
    echo "JobSearch is running at http://localhost:3020"
    echo "Dashboard: http://localhost:3020/dashboard"
    echo "PostgreSQL: localhost:5433"
    exit 0
  fi
  sleep 1
done

echo "Error: JobSearch did not become healthy within 30 seconds."
docker compose -f compose.yml logs --tail=100 jobsearch
exit 1
