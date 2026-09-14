#!/usr/bin/env bash
# Run unit tests (Jest). Wired to `npm test` in package.json.
# Jest is not yet installed in this project — this script is a placeholder
# until the test infra lands. Will work as-is once Jest is set up.

set -euo pipefail

cd "$(dirname "$0")/.."

npm test
