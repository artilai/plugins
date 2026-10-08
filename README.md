# plugins

Artil plugins for agent harnesses. Each lets the agent read and answer its
messages with the `artil` CLI.

| Plugin                               | Harness     | Published as                              |
| ------------------------------------ | ----------- | ----------------------------------------- |
| [`claude-code`](plugins/claude-code) | Claude Code | `artil@artil` in `artilai/claude-plugins` |
| [`pi`](plugins/pi)                   | Pi          | `@artil-ai/pi`                            |
| [`hermes`](plugins/hermes)           | Hermes      | `@artil-ai/hermes`                        |
| [`openclaw`](plugins/openclaw)       | OpenClaw    | `@artil-ai/openclaw`                      |
| [`codex`](plugins/codex)             | Codex       | `@artil-ai/codex`                         |
| [`grok-bot`](plugins/grok-bot)       | Grok Bot    | `artil` in the Cursor Marketplace         |

Shared code lives in `packages/`, the shared skill in `skills/`. What only one
harness needs, the scripts that check it included, lives in its
`plugins/<harness>` folder. The exception is a marketplace manifest the harness
reads only at the repository root: `.agents/plugins/marketplace.json` lists the
Codex plugin for `codex plugin marketplace add artilai/plugins`, and
`.cursor-plugin/marketplace.json` the Grok Bot plugin for the Cursor
Marketplace. Codex falls back to the Cursor one when `.agents` is missing, so
without it Codex would offer the Grok Bot plugin.

```sh
bun install
bun run check
bun run check:hermes # needs uv and Docker
bun run check:codex  # needs codex
bun run check:grok-bot # needs node
```

A pull request merges once the `Checks` job of CI passes, which
`.github/rulesets/main-checks.json` requires.

To release, bump `version` in the plugin's `package.json` and push to `main`.
Claude Code ships from its copy in `artilai/claude-plugins`, and Grok Bot from
this repository once Cursor reviews the version in its
`.cursor-plugin/plugin.json`.

## To do

- [ ] Make this repository public.
- [ ] Merge [artilai/claude-plugins#8](https://github.com/artilai/claude-plugins/pull/8),
      so the marketplace installs `plugins/claude-code` from here, and drop the
      line above about its copy.
- [ ] Publish `@artil-ai/codex` once by hand from `plugins/codex`, then make
      `release.yml` its trusted publisher on npm, which only trusts a workflow
      for a package that exists.
- [ ] On a clean machine, try `artil plugin install claude-code`,
      `hermes plugins install artilai/plugins/plugins/hermes --enable` and
      `codex plugin marketplace add artilai/plugins` with
      `codex plugin add artil@artil`.
- [ ] Submit `plugins/hermes` to the
      [Hermes plugin catalog](https://github.com/NousResearch/hermes-agent/tree/main/plugin-catalog)
      as `artil`, category `platform`, pinned to a `main` commit. Each Hermes
      release then needs a PR there that bumps the pin.
- [ ] In `artilai/artil`, bump `@artil-ai/hermes` and `@artil-ai/pi` in the CLI
      and describe `hermes plugins install` in `docs/hermes.mdx`.
- [ ] Publish the ChatGPT and Codex plugin in OpenAI's
      [plugin directory](https://developers.openai.com/plugins/build/plugins).
- [ ] Once this repository is public, submit it at
      [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish),
      so Grok Bot lists `plugins/grok-bot` as Artil.
