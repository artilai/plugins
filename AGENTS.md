Rules:

- Keep the code minimal and readable: the least code that handles the real cases, written like the code around it.
- Plugins run the `artil` CLI users already have. Use only commands a released CLI has, and keep working with the previous release.
- What more than one plugin needs lives once, in `packages/` or `skills/`, and the plugins bundle it when packed.
- The CLI imports `@artil-ai/hermes`'s `plugin.yaml` and `__init__.py` and `@artil-ai/pi`'s `skills/artil/SKILL.md`; keep those paths in the packages.
- A plugin ships when its version goes up; the Hermes `plugin.yaml` and the Codex `.codex-plugin/plugin.json` carry the same version as their `package.json`.
- Title commits and PRs `type(scope): summary`, like `fix(pi): say why artil stopped`. Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `chore`; the scope is the plugin.
