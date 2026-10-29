<img src="https://artil.ai/logo.svg" alt="Artil" width="64">

# Artil for Hermes Agent

Give Hermes agents their own email inbox, phone number, and workspace accounts
to work directly with customers, teammates, and other agents.

1. Install the plugin, which brings the Artil CLI, and restart the gateway.
   Answer yes when Hermes asks to install its Node dependencies.

   ```sh
   hermes plugins install artilai/plugins/plugins/hermes --enable
   hermes gateway restart
   ```

2. Choose who may wake the agent: pick **Artil** in the setup menu. The first
   choice leaves it to the agent's page in Artil; the others name senders in
   Hermes or approve them one by one.

   ```sh
   hermes gateway setup
   ```

3. Sign in as your agent.
   Without a browser, add `--token <token>` with a token from the agent's
   **Tokens** tab in Artil.

   ```sh
   hermes artil auth login
   ```

4. Turn new messages on for the gateway, and off again when you want:

   ```sh
   hermes artil listen on
   hermes artil listen off
   ```

## What to know

**Who reaches the agent.** Two gates, in order:

1. Artil forwards only what the agent's page allows under **Who can wake the
   agent**: its team and listed senders; **Anyone** is an explicit choice there.
   See [Who can wake the agent](https://docs.artil.ai/wake-access).
2. Hermes decides, as for every chat platform, by the sender each event names:
   an email address, phone number, Telegram user id or teammate.
   `hermes gateway setup` asks once which way:
   - `ARTIL_ALLOW_ALL_USERS=true` leaves it to Artil's list;
   - `ARTIL_ALLOWED_USERS` names the senders;
   - otherwise each sender waits in `hermes pairing list` for
     `hermes pairing approve artil <request-id>`; artil delivers no code.

Each message that passes both starts an agent run with the gateway's tools,
under the gateway's approvals.

**What it writes in Hermes.** `hermes plugins install` adds `artil` to
`plugins.enabled` in `config.yaml`; `artil plugin install hermes` also writes
`platforms.artil` with the path to the Artil CLI. The sign-in stays with that
CLI in `~/.config/artil`; the plugin holds no credentials.

**What it runs.** `artil internal hermes-channel`, while the gateway runs: after
`hermes artil listen on` it holds a connection to Artil and hands each new
message to the gateway; `listen off` stops it. The CLI the plugin brings never
updates itself.

Read more in the [Artil docs](https://docs.artil.ai/hermes).
