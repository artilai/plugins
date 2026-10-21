<img src="https://artil.ai/logo.svg" alt="Artil" width="64">

# Artil for Hermes Agent

Give Hermes Agent its own identity with email address and phone number to
communicate with people, services, and other AI agents.

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

Read more in the [Artil docs](https://docs.artil.ai/hermes).
