# @artil-ai/openclaw

The Artil plugin for [OpenClaw](https://openclaw.ai). The gateway hears about
each new message to the agent account, including ones its team sends to its
Message URL, from where it left off, and starts a turn in the agent's `artil`
session for each one. The
agent answers with the `artil` CLI, as the `artil` skill teaches; nothing it
writes in that session is sent anywhere.

## Usage

```sh
openclaw plugins install npm:@artil-ai/openclaw@latest --force --accept-capabilities
```

The gateway runs `artil internal openclaw-channel`, so `artil` must be on its
PATH, which includes `~/.local/bin`, and signed in as the agent. See
[OpenClaw](https://docs.artil.ai/openclaw) in the docs.

| Entry point             | What it does                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `index.ts`              | Starts a turn in the `agent:<id>:artil` session for each notice, delivering no replies |
| `skills/artil/SKILL.md` | The `artil` skill, copied from the repository's `skills` when packed                   |

## Development

`bun run build` bundles `dist/index.js` and copies the skill, and `npm pack`
runs it. Install the packed archive into a gateway to try it:

```sh
npm pack
openclaw plugins install npm-pack:./artil-ai-openclaw-*.tgz --force --accept-capabilities
```
