import { createRequire } from "node:module";
import { delimiter, dirname } from "node:path";

import { listen } from "@artil-ai/channel";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { signedIn } from "./sign-in";

// Pi installs artil-ai, whose folder holds the artil command, with this package. Bash commands
// and the channel fall back to that copy when the PATH has no artil of its own.
function addBundledArtil() {
  const artil = dirname(createRequire(import.meta.url).resolve("artil-ai/package.json"));
  const path = process.env.PATH?.split(delimiter) ?? [];

  if (!path.includes(artil)) process.env.PATH = [...path, artil].join(delimiter);
}

export default function hearNewMessages(pi: ExtensionAPI) {
  let listening: (() => void) | undefined;
  let sessions = 0;

  addBundledArtil();

  pi.on("session_start", (_event, ctx) => {
    if (!ctx.hasUI) return;

    const session = ++sessions;

    void signedIn(ctx.ui).then((ready) => {
      // The session may have ended while it signed in.
      if (!ready || session !== sessions) return;

      const stop = listen({
        channel: "pi-channel",
        restart: "run /reload",
        deliver: ({ content, meta = {} }) => {
          // A notice artil prints as it stops has no session left to go to.
          if (listening !== stop) return;

          pi.sendMessage(
            { customType: "artil-messages", content, display: true, details: meta },
            { deliverAs: "followUp", triggerTurn: true },
          );
        },
        stopped: (problem) =>
          ctx.ui.notify(`Pi no longer hears about new messages. ${problem}`, "error"),
      });

      listening = stop;
    });
  });

  pi.on("session_shutdown", () => {
    sessions++;
    listening?.();
    listening = undefined;
  });
}
