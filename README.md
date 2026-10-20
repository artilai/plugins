# Artil plugins

Email, SMS and Telegram for AI agents. [Artil](https://artil.ai) gives your
agent its own inbox and phone number, and these plugins let it read and answer
messages from the harness it runs in.

| Harness                                               | Plugin                               | Published as                                | Guide                                            |
| ----------------------------------------------------- | ------------------------------------ | ------------------------------------------- | ------------------------------------------------ |
| [Claude Code](https://code.claude.com)                | [`claude-code`](plugins/claude-code) | `artil@artil` from `artilai/claude-plugins` | [Claude Code](https://docs.artil.ai/claude-code) |
| [Codex](https://developers.openai.com/codex)          | [`codex`](plugins/codex)             | `@artil-ai/codex`                           | [Codex](https://docs.artil.ai/codex)             |
| [Pi](https://pi.dev)                                  | [`pi`](plugins/pi)                   | `@artil-ai/pi`                              | [Pi](https://docs.artil.ai/pi)                   |
| [Hermes Agent](https://hermes-agent.nousresearch.com) | [`hermes`](plugins/hermes)           | `@artil-ai/hermes`                          | [Hermes](https://docs.artil.ai/hermes)           |
| [OpenClaw](https://openclaw.ai)                       | [`openclaw`](plugins/openclaw)       | `@artil-ai/openclaw` on npm and ClawHub     | [OpenClaw](https://docs.artil.ai/openclaw)       |

## Install

Install the [Artil CLI](https://artil.ai/INSTALL.md), sign in as your agent, and
install the plugin for your harness:

```sh
curl -fsSL https://artil.ai/install.sh | bash
artil auth login
artil plugin install claude-code # or codex, pi, hermes, openclaw
```

Each plugin's README also shows how to install it with the harness's own
command.

## How it works

The plugins run the `artil` CLI you signed in, so they hold no credentials and
send nothing themselves. A channel tells the harness about each new message as
it arrives; Codex checks when asked. The `artil` skill teaches the agent to read,
answer and send messages with the CLI.

## Development

```sh
bun install
bun run check
bun run check:hermes # needs uv and Docker
bun run check:codex  # needs codex
bun run check:skills # needs artil
```

Shared code lives in `packages/` and the shared skill in `skills/`. What only one
harness needs, the scripts that check it included, lives in its
`plugins/<harness>` folder. The exception is a marketplace manifest the harness
reads only at the repository root: `.agents/plugins/marketplace.json` lists the
Codex plugin for `codex plugin marketplace add artilai/plugins`.

A pull request merges once the `Checks` job of CI passes. To release a plugin,
bump `version` in its `package.json` and push to `main`; the Release workflow
publishes it to npm, and the OpenClaw plugin to ClawHub as well. Claude Code
takes its plugin from the `artilai/claude-plugins` marketplace instead.

## License

[MIT](LICENSE)
