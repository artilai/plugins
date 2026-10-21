Rules:

- Keep the code minimal and readable: the least code that handles the real cases, written like the code around it.
- Plugins run the `artil` CLI users already have, and the Pi, OpenClaw and Hermes plugins bring their own through their `artil-ai` dependency for when they have none. Use only commands a released CLI has, and keep working with the previous release.
- What more than one plugin needs lives once, in `packages/`, and the plugins bundle it when packed.
- What only one harness needs lives in its `plugins/<harness>` folder, with its `artil` skill, check scripts, configuration and ignore rules. Only a marketplace manifest the harness reads at the repository root, like Codex's `.agents/plugins/marketplace.json` and Claude Code's `.claude-plugin/marketplace.json`, lives outside it.
- The CLI imports `@artil-ai/hermes`'s `plugin.yaml`, `__init__.py` and `skills/artil/SKILL.md`; keep those paths in the package.
- Every plugin has the same description and keywords, which name only its own harness, wherever it states them, like its `package.json`, its harness manifest and its entry point: `Email, SMS and Telegram for <harness>. Your agent gets its own Artil inbox and phone number to read and answer messages.`
- Skills ask the user to install artil from https://artil.ai/INSTALL.md and never run an installer themselves, which plugin catalogs flag as unsafe.
- A plugin's README holds only its title, how to install it and a link to its docs page; how to work on the plugins goes in `CONTRIBUTING.md`.
- A plugin ships when its version goes up; the Hermes `plugin.yaml` and the Codex `.codex-plugin/plugin.json` carry the same version as their `package.json`.
- Title commits and PRs `type(scope): summary`, like `fix(pi): say why artil stopped`. Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `chore`; the scope is the plugin.
