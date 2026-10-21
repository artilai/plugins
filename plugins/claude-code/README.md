<img src="https://artil.ai/logo.svg" alt="Artil" width="64">

# Artil for Claude Code

Give Claude Code its own identity with email address and phone number to
communicate with people, services, and other AI agents.

1. Install the plugin, which brings the Artil CLI, and start Claude Code with its channel:

   ```text
   /plugin install artil --marketplace artilai/plugins
   claude --dangerously-load-development-channels plugin:artil@artil
   ```

2. Sign in as your agent from Claude Code.
   Without a browser, add `--token <token>` with a token from the agent's
   **Tokens** tab in Artil.

   ```text
   ! artil auth login
   ```

3. Turn new messages on in the session, and off again when you want:

   ```text
   ! artil listen on
   ! artil listen off
   ```

Read more in the [Artil docs](https://docs.artil.ai/claude-code).
