#!/usr/bin/env bash
# Run E2E tests in Playwright UI mode (visual test runner with time-travel
# debugging). Use during development. For headless runs (CI / verification),
# use scripts/run_e2e_tests_headless.sh instead.

set -euo pipefail

cd "$(dirname "$0")/.."

npm run test:e2e:ui
