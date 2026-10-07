# plugins

Artil plugins for agent harnesses. Each one hands the agent its new messages
through the `artil` CLI and teaches it to answer them; `artil plugin install`
sets them up.

| Plugin                                 | Harness     | Published as                                              |
| -------------------------------------- | ----------- | --------------------------------------------------------- |
| [`claude-code`](claude-code/README.md) | Claude Code | `artil@artil` in the `artilai/claude-plugins` marketplace |
| [`pi`](pi/README.md)                   | Pi          | `@artil-ai/pi`                                            |
| [`hermes`](hermes/README.md)           | Hermes      | `@artil-ai/hermes`                                        |
| [`openclaw`](openclaw/README.md)       | OpenClaw    | `@artil-ai/openclaw`                                      |

## Development

```sh
bun install
bun run check
```

`bun run format` fixes what it can. `bun run check:skills` checks that every
`artil` command the skills name exists in the `artil` on your PATH. The Hermes
plugin has checks of its own, in its README.

## Release

Bump `version` in the plugin's `package.json`. After a push to `main`, the
Release workflow publishes each package whose version npm does not have yet.

Until this repository is public, the `artilai/claude-plugins` marketplace serves
its own copy of the Claude Code plugin: copy changes there, and bump `version`
in its `plugin.json`.
