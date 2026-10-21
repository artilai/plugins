import { listen } from "@artil-ai/channel";
import { addBundledArtil } from "@artil-ai/channel/bundled-artil";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { signedIn } from "./sign-in";

export default function hearNewMessages(pi: ExtensionAPI) {
  let listening: (() => void) | undefined;
  let sessions = 0;

  addBundledArtil(import.meta.url);

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
