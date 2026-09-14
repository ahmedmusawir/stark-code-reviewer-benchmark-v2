#!/usr/bin/env bash
# Run E2E tests in headless Chromium (default Playwright runner).
# For visual / debug mode, use scripts/run_e2e_tests_ui.sh instead.

set -euo pipefail

cd "$(dirname "$0")/.."

npm run test:e2e
