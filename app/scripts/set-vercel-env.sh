#!/usr/bin/env bash
# Push env from .env.local to Vercel (production + preview + development).
# Usage: vercel login && ./scripts/set-vercel-env.sh
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${1:-.env.local}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "Run: vercel login"
  exit 1
fi

# Link project if needed
if [[ ! -f .vercel/project.json ]]; then
  vercel link --yes
fi

set_var() {
  local key="$1"
  local val="$2"
  local env="$3"
  echo "Setting $key ($env)..."
  printf '%s' "$val" | vercel env add "$key" "$env" --force 2>/dev/null || \
    printf '%s' "$val" | vercel env add "$key" "$env"
}

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  key="${key// /}"
  [[ -z "$key" ]] && continue
  for target in production preview development; do
    set_var "$key" "$val" "$target"
  done
done < "$ENV_FILE"

# Server-side aliases for API routes
RPC="$(grep '^NEXT_PUBLIC_RPC=' "$ENV_FILE" | cut -d= -f2-)"
if [[ -n "$RPC" ]]; then
  for target in production preview development; do
    set_var "SOLANA_RPC_URL" "$RPC" "$target"
    set_var "HELIUS_RPC_URL" "$RPC" "$target"
  done
fi

echo "Done. Redeploy: vercel --prod"
