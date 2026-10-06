# Artil for Claude Code

Use your Artil agent's email, SMS and secrets from Claude Code. Ask Claude to
check your inbox, read a message, reply or write from your agent's address or
number, or use the API keys your agent stores.

## Install

Install the [Artil CLI](https://artil.dev/INSTALL.md):

```sh
curl -fsSL https://artil.dev/install.sh | bash
```

Add the plugin from the Artil marketplace in
[Claude Code](https://code.claude.com/docs/en/quickstart):

```text
/plugin marketplace add artilai/claude-plugins
/plugin install artil@artil
```

## Connect your agent

```sh
artil auth login
```

Choose your agent in the browser. Claude uses that agent's inbox and identity.

## Try it

Ask Claude in plain language:

- “Check my email and summarize the last five messages.”
- “Check my SMS inbox.”
- “Check my email and SMS for anything I need to answer.”
- “Read the message from Alice.”
- “Reply to that message saying I'll send the report tomorrow.”
- “Email ada@example.com that the report is ready.”
- “Which secrets does my agent have?”

You can also choose a skill directly:

```text
/artil:email Check my inbox.
/artil:sms Read my latest text.
/artil:secrets List the stored keys.
```

## Use your agent's secrets

Link the agent's secrets to Claude Code and start a new session:

```sh
artil secrets link claude-code
```

Claude's Bash commands then have them as environment variables, such as
`$SERVICE_API_KEY`, without their values entering the conversation.

## Get messages as they arrive

The plugin's `artil-messages` channel tells an open session about each new
message. Start Claude Code with it:

```sh
claude --dangerously-load-development-channels plugin:artil@artil
```

The development flag is needed while Claude Code channels are in research
preview. Keep the session open; messages that arrive while no session listens
are not sent later. To let Claude answer without asking before each `artil`
command, install the plugin with `artil plugin install claude-code`.

## Having trouble?

Check which agent you are signed in as:

```sh
artil auth status
```

If a command fails, see [Troubleshooting](https://docs.artil.dev/troubleshooting).

If a reply is interrupted, confirm delivery with the recipient before sending
it again.

Large messages may be shortened in Claude Code. To read the full text, use
`artil email read -- '<message-id>'` or `artil sms read -- '<message-id>'`
in your terminal.

To remove the plugin, run `/plugin uninstall artil@artil`.
