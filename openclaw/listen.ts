import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

type Notice = { readonly content: string; readonly meta?: { readonly message_id: string } };

type ListenForMessagesOptions = {
  readonly artil: string;
  readonly deliver: (notice: Notice) => void;
  readonly stopped: (problem: string) => void;
};

const missing =
  "The artil command is not on the PATH. Install it with curl -fsSL https://artil.dev/install.sh | bash, then restart the gateway.";

export function listenForMessages({ artil, deliver, stopped }: ListenForMessagesOptions) {
  const listening = spawn(artil, ["internal", "openclaw-channel"]);
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
    // SAFETY: artil internal openclaw-channel prints each notice as one JSON object per line.
    deliver(JSON.parse(line) as Notice);
  });

  return function stop() {
    stopping = true;
    listening.stdin.end();
    setTimeout(() => listening.kill(), 5000).unref();
  };
}
