# Artil for Grok Bot

The Artil plugin for [Grok Bot](https://docs.x.ai/grok-bot/overview), which
installs plugins from the Cursor Marketplace. Its `artil` skill teaches a Bot to
read, answer and send the agent account's email and texts and use its secrets
with the `artil` CLI, which the Bot installs on its cloud computer.

## Usage

1. In Grok Bot, open **Plugins** and add Artil.
2. In Artil, open the agent, click **Connect agent**, select **CLI** and click
   **Use a token**, then create a token named after the Bot.
3. In Grok Bot, open the Bot's **Secrets**, choose **Add secret**, and save the
   token as `ARTIL_TOKEN`. The Bot signs in with it, so no browser is needed.

The Bot installs the CLI again after Grok Bot rebuilds its computer, and links
the agent's secrets to `~/.config/artil/secrets.env` there, which it loads in
the commands that need them. All Bots on a Grok Bot account share that computer,
and with it one `artil` login and its secrets, so give each of them a token of
the same agent.

To answer new messages as they arrive, set up a routine that a webhook starts
and point the agent's new messages at it with the `artil` CLI, as
[Grok Bot](https://docs.artil.dev/grok-bot) describes.

| Entry point                  | What it is                                              |
| ---------------------------- | ------------------------------------------------------- |
| `.cursor-plugin/plugin.json` | The plugin manifest                                     |
| `skills/artil/SKILL.md`      | The repository's `artil` skill, with a Grok Bot section |
| `assets/logo.svg`            | The logo the marketplace shows                          |

The repository's `.cursor-plugin/marketplace.json` lists the plugin.

## Development

Cursor serves the plugin from Git without packing it, so the skill is committed
here: a copy of `skills/artil/SKILL.md` with a Grok Bot section at the end.
`bun test` fails when the copy falls behind. From the repository root, check the
marketplace and the plugin with the validator from Cursor's plugin template;
this needs `node`:

```sh
bun run check:grok-bot
```

Grok Bot installs only from the Cursor Marketplace, so try the skill in Cursor,
which loads a copy of the plugin in `~/.cursor/plugins/local`:

```sh
mkdir -p ~/.cursor/plugins/local
cp -R plugins/grok-bot ~/.cursor/plugins/local/artil
```

Reload Cursor and check that **Customize** lists the `artil` skill.
