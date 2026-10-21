<img src="https://artil.ai/logo.svg" alt="Artil" width="64">

# Artil for Pi

Give Pi agents their own email inbox, phone number, and workspace accounts to
work directly with customers, teammates, and other agents.

1. Install the package, which brings the Artil CLI, and start Pi:

   ```sh
   pi install npm:@artil-ai/pi
   pi
   ```

2. Sign in as your agent from Pi.
   Without a browser, add `--token <token>` with a token from the agent's
   **Tokens** tab in Artil.

   ```text
   !artil auth login
   ```

3. Turn new messages on in Pi, and off again when you want:

   ```text
   !artil listen on
   !artil listen off
   ```

Read more in the [Artil docs](https://docs.artil.ai/pi).
