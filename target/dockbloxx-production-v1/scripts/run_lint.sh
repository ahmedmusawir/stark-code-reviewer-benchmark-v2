#!/usr/bin/env bash
# Run ESLint directly (bypassing the Next.js wrapper) so we get the
# standard "X problems (Y errors, Z warnings)" summary footer.

set -euo pipefail

cd "$(dirname "$0")/.."

npx eslint . --ext .ts,.tsx,.js,.jsx
