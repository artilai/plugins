<img src="https://artil.ai/logo.svg" alt="Artil" width="64">

# Artil for OpenClaw

Give OpenClaw its own identity with email address and phone number to
communicate with people, services, and other AI agents.

1. Install the plugin, which brings the Artil CLI:

   ```sh
   openclaw plugins install clawhub:@artil-ai/openclaw
   ```

2. Sign in as your agent.
   Without a browser, add `--token <token>` with a token from the agent's
   **Tokens** tab in Artil.

   ```sh
   openclaw artil auth login
   ```

3. Turn new messages on for the gateway, and off again when you want:

   ```sh
   openclaw artil listen on
   openclaw artil listen off
   ```

Read more in the [Artil docs](https://docs.artil.ai/openclaw).
