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

## To do

- [ ] Make this repository public.
- [ ] Merge [artilai/claude-plugins#8](https://github.com/artilai/claude-plugins/pull/8),
      so the marketplace installs `plugins/claude-code` from here, and drop the
      line above about its copy.
- [ ] On a clean machine, try `artil plugin install claude-code` and
      `hermes plugins install artilai/plugins/plugins/hermes --enable`.
- [ ] Submit `plugins/hermes` to the
      [Hermes plugin catalog](https://github.com/NousResearch/hermes-agent/tree/main/plugin-catalog)
      as `artil`, category `platform`, pinned to a `main` commit. Each Hermes
      release then needs a PR there that bumps the pin.
- [ ] In `artilai/artil`, bump `@artil-ai/hermes` and `@artil-ai/pi` in the CLI
      and describe `hermes plugins install` in `docs/hermes.mdx`.
