import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type Notice = { readonly content: string; readonly meta?: Readonly<Record<string, string>> };

type ListenForMessagesOptions = {
  readonly artil: string;
  readonly deliver: (notice: Notice) => void;
  readonly stopped: (problem: string) => void;
};

const missing =
  "The artil command is not on the PATH. Install it with curl -fsSL https://artil.dev/install.sh | bash, or add ~/.local/bin to the PATH, then run /reload.";

export function listenForMessages({ artil, deliver, stopped }: ListenForMessagesOptions) {
  const listening = spawn(artil, ["internal", "pi-channel"]);
  let problem = "";
  let stopping = false;

  listening.on("error", (error: NodeJS.ErrnoException) => {
    problem = error.code === "ENOENT" ? missing : error.message;
  });
  listening.stderr.on("data", (chunk: Buffer) => {
    problem += chunk.toString();
  });
  listening.on("close", () => {
    if (!stopping) stopped(problem.trim());
  });
  createInterface({ input: listening.stdout }).on("line", (line) => {
    if (stopping) return;

    // SAFETY: artil internal pi-channel prints each notice as one JSON object per line.
    deliver(JSON.parse(line) as Notice);
  });

  return function stop() {
    stopping = true;
    listening.kill();
  };
}

export default function hearNewMessages(pi: ExtensionAPI) {
  let stop: (() => void) | undefined;

  pi.on("session_start", (_event, ctx) => {
    if (!ctx.hasUI) return;

    stop = listenForMessages({
      artil: "artil",
      deliver: ({ content, meta = {} }) =>
        pi.sendMessage(
          { customType: "artil-messages", content, display: true, details: meta },
          { deliverAs: "followUp", triggerTurn: true },
        ),
      stopped: (problem) =>
        ctx.ui.notify(`Pi no longer hears about new messages. ${problem}`, "error"),
    });
  });

  pi.on("session_shutdown", () => {
    stop?.();
    stop = undefined;
  });
}
