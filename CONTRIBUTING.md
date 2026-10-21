# Contributing

```sh
bun install
bun run check
bun run check:hermes      # needs uv and Docker
bun run check:claude-code # needs claude
bun run check:codex       # needs codex
bun run check:skills      # needs artil
```

Shared code lives in `packages/`, which each plugin bundles when it is built.
What only one harness needs, its `artil` skill and the scripts that check it
included, lives in its `plugins/<harness>` folder. The exceptions are the
marketplace manifests a harness reads only at the repository root:
`.agents/plugins/marketplace.json` lists the Codex plugin for
`codex plugin marketplace add artilai/plugins`, and
`.claude-plugin/marketplace.json` the Claude Code plugin for
`claude plugin marketplace add artilai/plugins`.

## Try a plugin

- Claude Code: after `bun install`, run `claude --plugin-dir ./plugins/claude-code`.
  `bun run check:claude-code` installs the plugin's dependencies from its
  `package-lock.json`, as Claude Code does, validates it and runs its `bin/artil`.
  After changing `artil-ai` in its `package.json`, update the lockfile in its
  folder with `npm install --package-lock-only --workspaces=false`.
- Pi: run `bun run build`, then `pi -e ./plugins/pi`.
- OpenClaw: in `plugins/openclaw`, `npm pack` builds the archive; install it
  with `openclaw plugins install npm-pack:./artil-ai-openclaw-*.tgz --force --accept-capabilities`.
- Codex: `bun run check:codex` installs the packed plugin into a throwaway Codex
  home and checks that Codex offers its skill.
- Hermes: `bun run check:hermes` lints the plugin with ruff, then validates and
  tests it inside the Hermes image. Install a commit of yours with
  `hermes plugins install "file://$PWD#plugins/hermes" --enable`, and accept its
  Node dependencies.

## Release

A pull request merges once the `Checks` job of CI passes. To release a plugin,
bump `version` in its `package.json` and push to `main`; the Release workflow
publishes it to npm, and the OpenClaw plugin to ClawHub as well. Claude Code
takes its plugin from this repository's marketplace instead, as `main` has it,
and updates it when its `plugin.json` version goes up.
