#!/usr/bin/env bash
#
# Upload the built site to S3 with correct cache headers.
#
# Cache strategy matters here. Three classes of file:
#
#   _astro/*        content-hashed by Astro  -> immutable, cache for a year
#   themes/*.css    NOT hashed; a brand tweak must go live without a redeploy
#                   -> short max-age so a rebuilt theme propagates quickly
#   *.html          entry points -> no-cache, always revalidate
#
# Usage: ./scripts/deploy-s3.sh <bucket> [prefix]
set -euo pipefail

BUCKET="${1:?usage: deploy-s3.sh <bucket> [prefix]}"
PREFIX="${2:-}"
DIST="$(cd "$(dirname "$0")/.." && pwd)/dist"
DEST="s3://${BUCKET}${PREFIX:+/$PREFIX}"

if [[ ! -d "$DIST" ]]; then
  echo "error: $DIST not found — run 'pnpm run build:all' first" >&2
  exit 1
fi
if [[ ! -d "$DIST/themes" ]]; then
  echo "error: $DIST/themes missing — tenant themes were not built" >&2
  exit 1
fi

echo "==> Uploading immutable assets"
aws s3 sync "$DIST" "$DEST" \
  --delete \
  --exclude '*' \
  --include '_astro/*' \
  --cache-control 'public,max-age=31536000,immutable'

echo "==> Uploading tenant themes"
aws s3 sync "$DIST/themes" "$DEST/themes" \
  --delete \
  --cache-control 'public,max-age=300,must-revalidate' \
  --content-type 'text/css'

echo "==> Uploading HTML and the rest"
aws s3 sync "$DIST" "$DEST" \
  --delete \
  --exclude '_astro/*' \
  --exclude 'themes/*' \
  --cache-control 'public,max-age=0,must-revalidate'

echo "==> Done: $DEST"
