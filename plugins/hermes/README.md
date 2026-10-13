# @artil-ai/hermes

The Artil platform for the [Hermes](https://hermes-agent.nousresearch.com)
gateway. New email and texts to the agent account, and messages its team sends
to its Message URL, reach the gateway as notices that
`artil internal hermes-channel` prints, from where it left off; the agent
answers them with the `artil` CLI.

## Usage

Install the [Artil CLI](https://artil.dev/INSTALL.md), sign in as the agent with
`artil auth login`, and let it set up the plugin and the `artil` skill:

```sh
artil plugin install hermes
```

Or install the plugin with Hermes:

```sh
hermes plugins install artilai/plugins/plugins/hermes --enable
```

The gateway runs the `artil` that `platforms.artil.extra.command` names in
Hermes' `config.yaml`, else the one on its PATH, else `~/.local/bin/artil`. See
[Hermes](https://docs.artil.dev/hermes) in the docs.

While the gateway runs, the plugin keeps `artil internal hermes-channel`
running, which reaches Artil with the CLI's login. The plugin sends nothing
itself: the agent answers with `artil` commands.

| Entry point   | What it is                                              |
| ------------- | ------------------------------------------------------- |
| `plugin.yaml` | The plugin manifest; Hermes 0.21.5 or later loads it    |
| `__init__.py` | The `artil` gateway platform and its system-prompt hint |

## Development

From the repository root, lint the plugin with [ruff](https://docs.astral.sh/ruff),
then validate and test it inside the Hermes image; this needs `uv` and Docker:

```sh
bun run check:hermes
```
