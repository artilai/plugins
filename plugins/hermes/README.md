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

2. Sign in as your agent.
   Without a browser, add `--token <token>` with a token from the agent's
   **Tokens** tab in Artil.

   ```sh
   hermes artil auth login
   ```

3. Turn new messages on for the gateway, and off again when you want:

   ```sh
   hermes artil listen on
   hermes artil listen off
   ```

## What to know

- **Who reaches the agent** is set in Artil, on the agent's page under **Who
  can wake the agent**: its team and the senders listed there, which for a new
  agent is the person who created it. **Anyone** has to be turned on there.
  artil forwards only what Artil let through and names the sender in each
  event, so Hermes takes the decision as made in Artil, as it does for a relay,
  and keeps the sender in its sessions and logs. Each message that gets through
  starts an agent run with the gateway's tools, under the gateway's approvals.
  More in [Who can wake the agent](https://docs.artil.ai/wake-access).
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
