---
name: secrets
description: This skill should be used when a task needs one of the Artil agent's API keys or passwords, when the user asks to "store this key", "save the token as a secret" or "list the agent's secrets", or when signing up for a service as the agent. Uses and stores the Artil agent's secrets.
---

# Artil secrets

Use the installed `artil` CLI and its existing agent login:

- List the names: `artil secrets list --json`.
- Store a value by piping in the command that prints it, so the value stays
  out of the conversation: `<command> | artil secrets set '<NAME>' --json`.
  Take one field of JSON output with `--json-path '.data.token'`.

The secrets are environment variables in every Bash command once the user has
run `artil secrets link claude-code` and started a new session. Use them as
`$NAME` and never print their values. A value you store reaches the next Bash
command. If a listed secret is missing from the environment, tell the user to
run `artil secrets link claude-code` and start a new session.

To sign up for a service as the agent, use the email address
`artil auth status` shows, read the verification email with the email skill,
and store the key the service issues with `artil secrets set`.

Names use letters, digits and underscores, such as `SERVICE_API_KEY`.
Use `artil secrets <command> --help` for other options or syntax errors.

If `artil` is not found, install it with
`curl -fsSL https://artil.dev/install.sh | bash`, then run the commands
above as `~/.local/bin/artil`, which may not be on the PATH yet. If it
reports that nobody is signed in, or that it needs a login as one agent
account, tell the user to run `artil auth login` and choose an agent; it needs
a browser. Report any other error to the user.
