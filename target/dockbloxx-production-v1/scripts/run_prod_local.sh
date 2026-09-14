#!/usr/bin/env bash
# Run the production build locally using the standalone server.
#
# This is the correct way to prod-test locally when next.config.ts has
# `output: "standalone"` — `next start` is incompatible with that setting
# and also has broken Ctrl+C signal handling. Plain `node` respects SIGINT.
#
# Usage:
#   ./scripts/run_prod_local.sh           # assumes .next/standalone exists
#   ./scripts/run_prod_local.sh --build   # runs `npm run build` first

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${1:-}" == "--build" ]]; then
  echo "→ Building..."
  npm run build
fi

if [[ ! -d ".next/standalone" ]]; then
  echo "✗ .next/standalone not found. Run with --build first, or run 'npm run build'."
  exit 1
fi

echo "→ Copying static assets into standalone bundle..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "→ Starting server on http://localhost:3000 (Ctrl+C to stop)"
node .next/standalone/server.js
