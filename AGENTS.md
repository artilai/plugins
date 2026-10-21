Rules:

- Write the least code that handles the real cases, like the code around it.
- Plugins run the `artil` CLI the user has. All but Codex's bring their own through an `artil-ai` dependency for when there is none. Use only commands a released CLI has, and keep working with the previous release.
- Code more than one plugin needs lives in `packages/`. The rest of a plugin lives in `plugins/<harness>`, except a marketplace manifest its harness reads at the repository root.
- The CLI imports `@artil-ai/hermes`'s `plugin.yaml`, `__init__.py` and `skills/artil/SKILL.md`; keep those paths.
- Every plugin states the same description and keywords, naming only its own harness: `Email, SMS and Telegram for <harness>. Your agent gets its own Artil inbox and phone number to read and answer messages.`
- Skills never run an installer, which plugin catalogs flag as unsafe; one that needs artil asks the user to install it from https://artil.ai/INSTALL.md.
- A plugin's README holds only its title, how to install it and a link to its docs page.
- A plugin ships when the version in its `package.json` goes up, and its harness manifest carries the same version. The Release workflow publishes it to npm, and OpenClaw's to ClawHub too; Claude Code takes its plugin from this repository, with the dependencies `plugins/claude-code/package-lock.json` pins, so update that lockfile with `npm install --package-lock-only --workspaces=false` there.
- Before a pull request, run `bun run check` and the `check:<harness>` script of each plugin you changed, as CI does.
- Title commits and PRs `type(scope): summary`, like `fix(pi): say why artil stopped`. Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `chore`; the scope is the plugin.
