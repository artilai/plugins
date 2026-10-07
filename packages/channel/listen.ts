import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export type Notice = {
  readonly content: string;
  readonly meta?: {
    readonly message_id: string;
    readonly channel: "email" | "sms";
    readonly from?: string;
  };
};

type ListenOptions = {
  readonly channel: `${string}-channel`;
  readonly restart: string;
  readonly deliver: (notice: Notice) => void;
  readonly stopped: (problem: string) => void;
};

export function listen({ channel, restart, deliver, stopped }: ListenOptions) {
  const artil = spawn("artil", ["internal", channel]);
  let problem = "";
  let stopping = false;

  artil.on("error", (error: NodeJS.ErrnoException) => {
    problem =
      error.code === "ENOENT"
        ? `The artil command is not on the PATH. Install it with curl -fsSL https://artil.dev/install.sh | bash, or add ~/.local/bin to the PATH, then ${restart}.`
        : error.message;
  });
  artil.stderr.on("data", (chunk: Buffer) => {
    problem += chunk.toString();
  });
  artil.on("close", () => {
    if (!stopping) stopped(problem.trim());
  });
  createInterface({ input: artil.stdout }).on("line", (line) => {
    // SAFETY: artil internal <channel> prints each notice as one JSON object per line.
    deliver(JSON.parse(line) as Notice);
  });

  // Closing its input lets artil save where it left off. It may print one more notice as it goes.
  return function stop() {
    stopping = true;
    artil.stdin.end();
    setTimeout(() => artil.kill(), 5000).unref();
  };
}
