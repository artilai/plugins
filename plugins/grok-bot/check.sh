#!/bin/sh
# Validate the repository's Cursor marketplace and the Grok Bot plugin it lists with the validator
# from Cursor's plugin template, pinned to the last commit that has it.
set -eu

cd "$(dirname "$0")/../.."

validator="$(mktemp)"
trap 'rm -f "$validator"' EXIT

curl -fsSL -o "$validator" https://raw.githubusercontent.com/cursor/plugin-template/bf795ee9a28e6d8b2e013beb9ac47fdd6d573fb7/scripts/validate-template.mjs
node --input-type=module < "$validator"
