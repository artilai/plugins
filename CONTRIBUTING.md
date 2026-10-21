# Contributing

```sh
bun install
bun run check
bun run check:hermes # needs uv and Docker
bun run check:codex  # needs codex
bun run check:skills # needs artil
```

Shared code lives in `packages/`, which each plugin bundles when it is built.
What only one harness needs, its `artil` skill and the scripts that check it
included, lives in its `plugins/<harness>` folder. The exception is a
marketplace manifest the harness reads only at the repository root:
`.agents/plugins/marketplace.json` lists the Codex plugin for
`codex plugin marketplace add artilai/plugins`.

## Try a plugin

- Pi: run `bun run build`, then `pi -e ./plugins/pi`.
- OpenClaw: in `plugins/openclaw`, `npm pack` builds the archive; install it
  with `openclaw plugins install npm-pack:./artil-ai-openclaw-*.tgz --force --accept-capabilities`.
- Codex: `bun run check:codex` installs the packed plugin into a throwaway Codex
  home and checks that Codex offers its skill.
- Hermes: `bun run check:hermes` lints the plugin with ruff, then validates and
  tests it inside the Hermes image.

## Release

A pull request merges once the `Checks` job of CI passes. To release a plugin,
bump `version` in its `package.json` and push to `main`; the Release workflow
publishes it to npm, and the OpenClaw plugin to ClawHub as well. Claude Code
takes its plugin from the `artilai/claude-plugins` marketplace instead.
