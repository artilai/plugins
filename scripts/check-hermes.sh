#!/bin/sh
# Lint the Hermes plugin, then validate and test it inside the Hermes image, whose gateway it imports.
set -eu

cd "$(dirname "$0")/../plugins/hermes"

uvx ruff@0.16.10 check
uvx ruff@0.16.10 format --check

if ! grep -qx "version: $(jq -r .version package.json)" plugin.yaml; then
  echo "plugin.yaml does not have the version in package.json." >&2
  exit 1
fi

image=nousresearch/hermes-agent:latest

docker run --rm -v "$PWD:/plugin" -w /plugin --entrypoint hermes "$image" plugins validate .
docker run --rm -v "$PWD:/plugin" -w /plugin --entrypoint sh "$image" -c \
  'uv pip install -q --python /opt/hermes/.venv/bin/python pytest && PYTHONPATH=/opt/hermes /opt/hermes/.venv/bin/python -m pytest -p no:cacheprovider tests'
