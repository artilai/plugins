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

- **Who reaches the agent.** Artil forwards only what the agent's page lets
  through under **Who can wake the agent**: its team and the senders listed
  there, with **Anyone** an explicit choice; see
  [Who can wake the agent](https://docs.artil.ai/wake-access). Each event then
  names its sender, an email address, phone number, Telegram user id or
  teammate, and Hermes decides as for every chat platform: nobody reaches the
  agent until you list senders in `ARTIL_ALLOWED_USERS` in Hermes' `.env`,
  approve one Hermes reports with `hermes pairing approve artil <request-id>`
  (`hermes pairing list` shows them; artil cannot deliver the code to the
  sender), or set `ARTIL_ALLOW_ALL_USERS=true` to leave the choice to Artil's
  list. Each message that gets through starts an agent run with the gateway's
  tools, under the gateway's approvals.
- **What it changes in Hermes.** `hermes plugins install` adds `artil` to
  `plugins.enabled` in `config.yaml`; `artil plugin install hermes` from the
  Artil CLI also writes `platforms.artil` there with the path to that CLI.
  Nothing else is written: the agent's sign-in stays with the artil CLI in
  `~/.config/artil`, and the plugin holds no credentials.
- **While the gateway runs,** the plugin keeps `artil internal hermes-channel`
  running, which holds a connection to Artil's API after `hermes artil listen
  on` and hands each new message to the gateway. `hermes artil listen off`
  stops it. The CLI the plugin brings never updates itself; it changes only
  with the plugin.

Read more in the [Artil docs](https://docs.artil.ai/hermes).
