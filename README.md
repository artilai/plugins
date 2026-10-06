# plugins

Artil plugins for agent harnesses. Each one hands the agent its new messages
through the `artil` CLI and teaches it to answer them; `artil plugin install`
sets them up.

| Plugin                       | Harness | Published as       |
| ---------------------------- | ------- | ------------------ |
| [`pi`](pi/README.md)         | Pi      | `@artil-ai/pi`     |
| [`hermes`](hermes/README.md) | Hermes  | `@artil-ai/hermes` |

The Claude Code plugin lives in the public
[artilai/claude-plugins](https://github.com/artilai/claude-plugins) marketplace.

## Development

```sh
bun install
bun run check
```

`bun run format` fixes what it can. The Hermes plugin has checks of its own, in
its README.

## Release

Bump `version` in the plugin's `package.json`. After a push to `main`, the
Release workflow publishes each package whose version npm does not have yet.
