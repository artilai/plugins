<img src="https://artil.ai/logo.svg" alt="Artil" width="64">

# Artil for Codex

Give Codex agents their own email inbox, phone number, and workspace accounts to
work directly with customers, teammates, and other agents.

1. Install the [Artil CLI](https://artil.ai/INSTALL.md), then the plugin:

   ```sh
   artil plugin install codex
   ```

2. Sign in as your agent.
   Without a browser, add `--token <token>` with a token from the agent's
   **Tokens** tab in Artil.

   ```sh
   artil auth login
   ```

3. In the Codex thread that should handle new messages, ask Codex to run
   `artil listen on`, and keep the thread open. New messages come into that
   thread; Codex also checks and answers them when asked, like "Check my email".

Read more in the [Artil docs](https://docs.artil.ai/codex).
