#!/usr/bin/env bash
# Paste a fresh Figma token into .env without it touching shell history.
# Usage: ./scripts/figma-setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

printf 'Paste your NEW Figma token (input hidden), then press Enter:\n> '
read -rs TOKEN
printf '\n'

if [[ -z "$TOKEN" ]]; then echo "No token entered. Nothing changed." >&2; exit 1; fi
if [[ "$TOKEN" != figd_* ]]; then
  echo "Warning: Figma tokens normally start with 'figd_'. Saving anyway." >&2
fi

python3 - "$TOKEN" <<'PY'
import sys, pathlib, re
token = sys.argv[1]
p = pathlib.Path('.env')
s = p.read_text()
if re.search(r'^#?\s*FIGMA_TOKEN=.*$', s, re.M):
    s = re.sub(r'^#?\s*FIGMA_TOKEN=.*$', f'FIGMA_TOKEN={token}', s, flags=re.M)
else:
    s += f'\nFIGMA_TOKEN={token}\n'
p.write_text(s)
print('Saved to .env')
PY

echo "Verifying..."
python3 - <<'PY'
import pathlib, re, urllib.request, urllib.error
tok = re.search(r'^FIGMA_TOKEN=(.+)$', pathlib.Path('.env').read_text(), re.M).group(1).strip()
req = urllib.request.Request('https://api.figma.com/v1/me', headers={'X-Figma-Token': tok})
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        print("Token works. Run: node scripts/figma-pull.mjs --inspect")
except urllib.error.HTTPError as e:
    print(f"Figma rejected it ({e.code}). Check the token and its scopes.")
PY
