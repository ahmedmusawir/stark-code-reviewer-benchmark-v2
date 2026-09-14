#!/usr/bin/env bash
# Run integration tests (route handlers + external service mocks).
# Targets tests/api/ specifically.

set -euo pipefail

cd "$(dirname "$0")/.."

npx jest tests/api --testPathPatterns=tests/api
