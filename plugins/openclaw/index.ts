import { spawn } from "node:child_process";

import { listen } from "@artil-ai/channel";
import { addBundledArtil } from "@artil-ai/channel/bundled-artil";
import { resolveDefaultAgentId } from "openclaw/plugin-sdk/agent-scope-runtime";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const hint = [
  "Notices about new email, texts and Telegram messages to this Artil agent account, and messages its team sends to its Message URL, arrive in this session.",
  "Read each email, text or Telegram message with the artil command its notice names, and answer it with `artil email send --reply-to`, `artil sms send --reply-to` or `artil telegram send --reply-to`, as the artil skill describes; a message from the Message URL comes whole, and its notice says how to answer it.",
  "Answer only through artil, never with OpenClaw's own Telegram or other channels, which are other accounts.",
  "Nobody outside reads what you write in this session.",
].join(" ");

const retryAfter = 30_000;

const artilCommand = {
  name: "artil",
  description: "Run the artil command the Artil plugin brings, like: openclaw artil auth login",
  hasSubcommands: false,
};

// Runs artil with the person's arguments and exits as it does, so the plugin's copy works without
// artil on the PATH, and artil listen on knows it runs for OpenClaw.
function runArtil(args: ReadonlyArray<string>) {
  const { promise, resolve } = Promise.withResolvers<void>();

  addBundledArtil(import.meta.url);

  const artil = spawn("artil", args, {
    stdio: "inherit",
    env: { ...process.env, ARTIL_CLIENT: "openclaw" },
  });

  artil.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
    resolve();
  });
  artil.on("close", (code) => {
    process.exitCode = code ?? 1;
    resolve();
  });

  return promise;
}

export default definePluginEntry({
  id: "artil",
  name: "Artil",
  description:
    "Give OpenClaw its own identity with email address and phone number to communicate with people, services, and other AI agents.",
  register(api) {
    if (["cli-metadata", "discovery", "full"].includes(api.registrationMode)) {
      api.registerCli(
        ({ program }) => {
          program
            .command(artilCommand.name)
            .description(artilCommand.description)
            .argument("[args...]")
            .allowUnknownOption()
            .helpOption(false)
            .action(runArtil);
        },
        { descriptors: [artilCommand] },
      );
    }

    if (api.registrationMode !== "full") return;

    let listening: (() => void) | undefined;
    let retrying: ReturnType<typeof setTimeout> | undefined;

    function stopListening() {
      clearTimeout(retrying);
      listening?.();
      listening = undefined;
    }

    addBundledArtil(import.meta.url);

    api.registerService({
      id: "artil-messages",
      start({ config, logger }) {
        const sessionKey = `agent:${resolveDefaultAgentId(config)}:artil`;
        let reported = "";

        // artil stops when it cannot listen, so the gateway tries again until it can.
        function hear() {
          listening = listen({
            channel: "openclaw-channel",
            restart: "restart the gateway",
            deliver: ({ content, meta }) =>
              void api.runtime.subagent
                .run({
                  sessionKey,
                  message: content,
                  extraSystemPrompt: hint,
                  deliver: false,
                  ...(meta && { idempotencyKey: meta.message_id }),
                })
                .catch((error: unknown) =>
                  logger.error(`Could not hand OpenClaw a notice: ${error}`),
                ),
            stopped: (problem) => {
              if (problem !== reported) {
                logger.error(
                  `OpenClaw does not hear about new messages and tries again every ${retryAfter / 1000} seconds. ${problem}`,
                );
              }

              reported = problem;
              retrying = setTimeout(hear, retryAfter);
            },
          });
        }

        stopListening();
        hear();
      },
      stop: stopListening,
    });
  },
});
