#!/usr/bin/env bash
set -euo pipefail

PASEO_VERSION="0.9.2"
PASEO_SHA256="848a86d424d98e40b3157cfb93804fad93a599b0fdfec1dfffe78cd9e7feeac3"
PASEO_DEB="Paseo-${PASEO_VERSION}-amd64.deb"
PASEO_URL="https://github.com/getpaseo/paseo/releases/download/v${PASEO_VERSION}/${PASEO_DEB}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RIG_USER="$(id --user --name)"
RIG_UID="$(id --user)"

if [[ "$RIG_UID" == "0" ]]; then
  echo "Run this script as the rig user, not as root." >&2
  exit 1
fi

if [[ "$(dpkg --print-architecture)" != "amd64" ]]; then
  echo "This example supports AMD64 Ubuntu rigs only." >&2
  exit 1
fi

if [[ -e "$HOME/.paseo" ]]; then
  echo "Paseo already has local state. Use a fresh snapshot base rig." >&2
  exit 1
fi

if [[ "$(dpkg-query -W -f='${Version}' paseo 2>/dev/null || true)" != "$PASEO_VERSION" ]]; then
  sudo apt-get update
  sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y \
    ca-certificates curl libasound2t64

  download_dir="$(mktemp -d)"
  trap 'rm -rf "$download_dir"' EXIT
  curl --fail --location --silent --show-error \
    "$PASEO_URL" --output "$download_dir/$PASEO_DEB"
  echo "$PASEO_SHA256  $download_dir/$PASEO_DEB" | sha256sum --check --status
  sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y \
    "$download_dir/$PASEO_DEB"
fi

install -D -m 0644 "$SCRIPT_DIR/paseo-daemon.service" \
  "$HOME/.config/systemd/user/paseo-daemon.service"

# Start the user service at boot, even when this user has no login session.
sudo loginctl enable-linger "$RIG_USER"
sudo systemctl start "user@${RIG_UID}.service"
export XDG_RUNTIME_DIR="/run/user/${RIG_UID}"
systemctl --user daemon-reload
systemctl --user enable paseo-daemon.service
systemctl --user is-enabled --quiet paseo-daemon.service
