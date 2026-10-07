# plugins

Artil plugins for agent harnesses. Each hands the agent its new messages through
the `artil` CLI.

| Plugin                               | Harness     | Published as                              |
| ------------------------------------ | ----------- | ----------------------------------------- |
| [`claude-code`](plugins/claude-code) | Claude Code | `artil@artil` in `artilai/claude-plugins` |
| [`pi`](plugins/pi)                   | Pi          | `@artil-ai/pi`                            |
| [`hermes`](plugins/hermes)           | Hermes      | `@artil-ai/hermes`                        |
| [`openclaw`](plugins/openclaw)       | OpenClaw    | `@artil-ai/openclaw`                      |

Shared code lives in `packages/`, the shared skill in `skills/`.

```sh
bun install
bun run check
```

To release, bump `version` in the plugin's `package.json` and push to `main`.
Claude Code ships from its copy in `artilai/claude-plugins`.
