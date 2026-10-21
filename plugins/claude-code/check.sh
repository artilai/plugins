#!/bin/sh
# Install the Claude Code plugin as Claude Code does, validate it, and check that it runs the artil it brings.
set -eu

cd "$(dirname "$0")"

if [ "$(jq -r .version .claude-plugin/plugin.json)" != "$(jq -r .version package.json)" ]; then
  echo ".claude-plugin/plugin.json does not have the version in package.json." >&2
  exit 1
fi

cached="$(mktemp -d)"
trap 'rm -rf "$cached"' EXIT

# Claude Code copies the plugin and installs what its lockfile pins, without running scripts.
rsync -a --exclude node_modules ./ "$cached/"
(cd "$cached" && npm ci --ignore-scripts --no-audit --no-fund --silent)
claude plugin validate "$cached"
# Node's folder and the system's, so no artil of the machine's own stands in for the plugin's.
PATH="$(dirname "$(command -v node)"):/usr/bin:/bin" "$cached/bin/artil" --version
