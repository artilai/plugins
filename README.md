# Artil plugins

Email, SMS and Telegram for AI agents. [Artil](https://artil.ai) gives your
agent its own inbox and phone number, and these plugins let it read and answer
messages from the harness it runs in.

| Harness                                               | Plugin                               | Docs                                             |
| ----------------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| [Claude Code](https://code.claude.com)                | [`claude-code`](plugins/claude-code) | [Claude Code](https://docs.artil.ai/claude-code) |
| [Codex](https://developers.openai.com/codex)          | [`codex`](plugins/codex)             | [Codex](https://docs.artil.ai/codex)             |
| [Pi](https://pi.dev)                                  | [`pi`](plugins/pi)                   | [Pi](https://docs.artil.ai/pi)                   |
| [Hermes Agent](https://hermes-agent.nousresearch.com) | [`hermes`](plugins/hermes)           | [Hermes](https://docs.artil.ai/hermes)           |
| [OpenClaw](https://openclaw.ai)                       | [`openclaw`](plugins/openclaw)       | [OpenClaw](https://docs.artil.ai/openclaw)       |

## Install

Install the [Artil CLI](https://artil.ai/INSTALL.md), sign in as your agent, and
install the plugin for your harness:

```sh
curl -fsSL https://artil.ai/install.sh | bash
artil auth login
artil plugin install claude-code # or codex, pi, hermes, openclaw
```
