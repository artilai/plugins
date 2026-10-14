import { listen } from "@artil-ai/channel";
import { resolveDefaultAgentId } from "openclaw/plugin-sdk/config-runtime";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const hint = [
  "Notices about new email, texts and Telegram messages to this Artil agent account, and messages its team sends to its Message URL, arrive in this session.",
  "Read each email, text or Telegram message with the artil command its notice names, and answer it with `artil email send --reply-to`, `artil sms send --reply-to` or `artil telegram send --reply-to`, as the artil skill describes; a message from the Message URL comes whole, and its notice says how to answer it.",
  "Answer only through artil, never with OpenClaw's own Telegram or other channels, which are other accounts.",
  "Nobody outside reads what you write in this session.",
].join(" ");

export default definePluginEntry({
  id: "artil",
  name: "Artil",
  description: "Hear about your Artil agent's new messages, and answer them with the artil CLI.",
  register(api) {
    if (api.registrationMode !== "full") return;

    let listening: (() => void) | undefined;

    api.registerService({
      id: "artil-messages",
      start({ config, logger }) {
        const sessionKey = `agent:${resolveDefaultAgentId(config)}:artil`;

        listening?.();
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
          stopped: (problem) =>
            logger.error(`OpenClaw no longer hears about new messages. ${problem}`),
        });
      },
      stop() {
        listening?.();
        listening = undefined;
      },
    });
  },
});
