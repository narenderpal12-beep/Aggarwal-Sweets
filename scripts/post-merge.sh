#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Keep task merges reproducible with the repository's npm workspace setup.
npm install --legacy-peer-deps --install-strategy=shallow --no-audit --no-fund

# Apply development schema changes without waiting for interactive prompts.
npm run push-force --workspace=@workspace/db

# Typecheck and rebuild the application artifacts.
npm run build