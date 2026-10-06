# @artil-ai/pi

The Artil package for [Pi](https://pi.dev). An open Pi session hears about each
new message to the agent account, and the `artil` skill teaches Pi to read,
answer and send messages and use the agent's secrets with the `artil` CLI.

## Usage

```sh
pi install npm:@artil-ai/pi
```

Interactive and RPC sessions run `artil internal pi-channel`, so `artil` must be
on the PATH and signed in as the agent. See [Pi](https://docs.artil.dev/pi) in
the docs.

| Entry point              | What it does                                                            |
| ------------------------ | ----------------------------------------------------------------------- |
| `extensions/messages.ts` | Hands each new message to the session as a follow-up that starts a turn |
| `skills/artil/SKILL.md`  | The `artil` skill; the CLI installs the same text for its other clients |

## Development

Try the package without installing it, from the repository root:

```sh
pi -e ./pi
```
