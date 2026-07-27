#!/bin/sh
set -e

MAX_RETRIES=30
RETRY_DELAY=2

echo "Running database migrations..."

attempt=0
until node dist/db/migrate.js; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$MAX_RETRIES" ]; then
    echo "Migrations failed after $MAX_RETRIES attempts, giving up."
    exit 1
  fi
  echo "Migration attempt $attempt failed (DB likely not ready yet), retrying in ${RETRY_DELAY}s..."
  sleep "$RETRY_DELAY"
done

echo "Migrations applied. Starting application..."
exec "$@"
