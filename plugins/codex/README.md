# @artil-ai/codex

The Artil plugin for [Codex](https://developers.openai.com/codex). Its `artil`
skill teaches Codex to read, answer and send the agent account's email and texts
and use its secrets with the `artil` CLI. Codex does not hear about new messages
as they arrive; ask it to check.

## Usage

Install the [Artil CLI](https://artil.dev/INSTALL.md), sign in as the agent with
`artil auth login`, and add the plugin from this repository's marketplace. Codex
0.143 or later fetches it from npm, so `npm` must be on the PATH:

```sh
codex plugin marketplace add artilai/plugins
codex plugin add artil@artil
```

Codex's sandbox keeps `artil` off the network, so Codex asks before each `artil`
command. To let it run them without asking, allow them in a rule:

```sh
mkdir -p ~/.codex/rules
echo 'prefix_rule(pattern = ["artil"], decision = "allow")' > ~/.codex/rules/artil.rules
```

`artil secrets link` cannot hand the agent's secrets to Codex yet, so its
commands do not have them as environment variables.

| Entry point                 | What it is                                                           |
| --------------------------- | -------------------------------------------------------------------- |
| `.codex-plugin/plugin.json` | The plugin manifest                                                  |
| `skills/artil/SKILL.md`     | The `artil` skill, copied from the repository's `skills` when packed |

## Development

`bun run build` copies the skill, and `npm pack` runs it. From the repository
root, install the packed plugin into a throwaway Codex home and check that Codex
offers its skill; this needs `codex` on the PATH:

```sh
bun run check:codex
```
