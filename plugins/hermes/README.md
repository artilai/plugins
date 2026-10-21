<img src="https://artil.ai/logo.svg" alt="Artil" width="64">

# Artil for Hermes Agent

Give Hermes Agent its own identity with email address and phone number to
communicate with people, services, and other AI agents.

1. Install the [Artil CLI](https://artil.ai/INSTALL.md) as the user Hermes runs as, then the plugin, and restart the gateway:

   ```sh
   artil plugin install hermes
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

Read more in the [Artil docs](https://docs.artil.ai/hermes).
