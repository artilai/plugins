#!/bin/sh
# Install the Codex plugin as npm packs it into a throwaway Codex home, and check that Codex offers its skill.
set -eu

cd "$(dirname "$0")/../plugins/codex"

if [ "$(jq -r .version .codex-plugin/plugin.json)" != "$(jq -r .version package.json)" ]; then
  echo ".codex-plugin/plugin.json does not have the version in package.json." >&2
  exit 1
fi

CODEX_HOME="$(mktemp -d)"
export CODEX_HOME
marketplace="$CODEX_HOME/marketplace"

mkdir -p "$marketplace/.agents/plugins"
npm pack --silent --pack-destination "$CODEX_HOME" > /dev/null
tar -xzf "$CODEX_HOME"/artil-ai-codex-*.tgz -C "$marketplace"
echo '{"name":"artil","plugins":[{"name":"artil","source":{"source":"local","path":"./package"}}]}' \
  > "$marketplace/.agents/plugins/marketplace.json"

# Outside the repository, so Codex does not also find its marketplace, which installs from npm.
cd "$CODEX_HOME"
codex plugin marketplace add "$marketplace"
codex plugin add artil@artil

if ! codex debug prompt-input | grep -q 'artil:artil: '; then
  echo "Codex does not offer the artil skill." >&2
  exit 1
fi
