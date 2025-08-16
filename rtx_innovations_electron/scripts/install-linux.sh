#!/usr/bin/env bash
set -euo pipefail

REPO="Raylyrix/RTXAPPS"
API="https://api.github.com/repos/${REPO}/releases/latest"

echo "Fetching latest release..."
URL=$(curl -fsSL "$API" | grep -Eo 'browser_download_url":\s*"[^"]+(AppImage|\.deb)"' | head -n1 | cut -d'"' -f4)
if [ -z "${URL:-}" ]; then echo "Could not find Linux artifact"; exit 1; fi
FILE=$(basename "$URL")
echo "Downloading $FILE ..."
curl -fL "$URL" -o "$FILE"

if [[ "$FILE" == *.deb ]]; then
  echo "Installing .deb ..."
  sudo apt update || true
  sudo apt install -y "./$FILE"
else
  echo "Installing AppImage ..."
  chmod +x "$FILE"
  echo "Run with: ./$FILE"
fi

echo "Done"


