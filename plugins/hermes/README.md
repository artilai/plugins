# @artil-ai/hermes

The Artil platform for the [Hermes](https://hermes-agent.nousresearch.com)
gateway. New email and texts to the agent account, and wake-ups from its team,
reach the gateway as notices that `artil internal hermes-channel` prints, from
where it left off; the agent answers them with the `artil` CLI.

## Usage

The `artil` CLI carries the plugin from this package. `artil plugin install
hermes` writes it to `$HERMES_HOME/plugins/artil` and turns it on in Hermes'
`config.yaml`, with the absolute path of `artil`, since the gateway's service
does not see your shell's PATH:

```yaml
plugins:
  enabled: [artil]
platforms:
  artil:
    enabled: true
    extra:
      command: /Users/you/.local/bin/artil
```

| Entry point         | What it is                                              |
| ------------------- | ------------------------------------------------------- |
| `artil/plugin.yaml` | The plugin manifest; Hermes 0.21.5 or later loads it    |
| `artil/__init__.py` | The `artil` gateway platform and its system-prompt hint |

## Development

From the repository root, lint and format the plugin with
[ruff](https://docs.astral.sh/ruff), then validate and test it inside the Hermes
image:

```sh
uvx ruff check && uvx ruff format --check
docker run --rm -v "$PWD/plugins/hermes:/plugin" -w /plugin --entrypoint hermes nousresearch/hermes-agent:latest plugins validate artil
docker run --rm -v "$PWD/plugins/hermes:/plugin" -w /plugin --entrypoint sh nousresearch/hermes-agent:latest -c \
  'uv pip install -q --python /opt/hermes/.venv/bin/python pytest && PYTHONPATH=/opt/hermes /opt/hermes/.venv/bin/python -m pytest -p no:cacheprovider tests'
```
