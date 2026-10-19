# @artil-ai/pi

The Artil package for [Pi](https://pi.dev). An open Pi session hears about each
new message to the agent account, and the `artil` skill teaches Pi to read,
answer and send messages and use the agent's secrets with the `artil` CLI.

## Usage

```sh
pi install npm:@artil-ai/pi
```

Interactive and RPC sessions run `artil internal pi-channel`, so `artil` must be
on the PATH and signed in as the agent. See [Pi](https://docs.artil.ai/pi) in
the docs.

| Entry point             | What it does                                                            |
| ----------------------- | ----------------------------------------------------------------------- |
| `index.ts`              | Hands each new message to the session as a follow-up that starts a turn |
| `skills/artil/SKILL.md` | The `artil` skill, copied from the repository's `skills` when packed    |

## Development

`bun run build` bundles `dist/index.js` and copies the skill. Try the package
without installing it, from the repository root:

```sh
bun run build
pi -e ./plugins/pi
```
