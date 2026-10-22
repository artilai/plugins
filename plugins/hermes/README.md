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

## What it does on your computer

- Hermes installs the Artil CLI, `artil-ai` from npm as `package-lock.json`
  pins it, into the plugin's folder, and the plugin adds it to the end of the
  gateway's PATH.
- While the gateway runs, the plugin keeps `artil internal hermes-channel`
  running. After `hermes artil listen on` it holds a connection to Artil's API
  and passes each new message to the gateway, and Artil shows the computer's
  name as the one listening.
- New messages skip Hermes' allowlists and pairing; who can wake the agent is
  set in Artil.
- The CLI keeps the sign-in from `hermes artil auth login`, and where the
  gateway left off, in its own folder, `~/.config/artil`. The plugin's code
  never reads them.
- The agent sends messages and stores secrets in Artil only by running
  `artil` commands in its terminal, under Hermes' approvals. The CLI sends no
  telemetry.

Read more in the [Artil docs](https://docs.artil.ai/hermes).
