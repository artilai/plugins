Rules:

- Keep the code minimal and readable: the least code that handles the real cases, written like the code around it.
- Plugins run the `artil` CLI users already have. Use only commands a released CLI has, and keep working with the previous release.
- A plugin ships when its version goes up; the Hermes `plugin.yaml` carries the same version as its `package.json`.
- Title commits and PRs `type(scope): summary`, like `fix(pi): say why artil stopped`. Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `chore`; the scope is the plugin.
