import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";

type Outcome = { readonly ok: boolean; readonly problem: string };

type RunArtilOptions = {
  readonly show?: (line: string) => void;
  readonly env?: Record<string, string>;
};

// Runs artil, handing on each line it prints, and resolves once it exits.
function runArtil(
  args: ReadonlyArray<string>,
  { show = () => {}, env = {} }: RunArtilOptions = {},
) {
  const { promise, resolve } = Promise.withResolvers<Outcome>();
  const artil = spawn("artil", args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });
  let problem = "";

  createInterface({ input: artil.stdout }).on("line", (line) => {
    if (line.trim()) show(line.trim());
  });
  artil.stderr.on("data", (chunk: Buffer) => {
    problem += chunk.toString();
  });
  artil.on("error", (error) => resolve({ ok: false, problem: error.message }));
  artil.on("close", (code) => resolve({ ok: code === 0, problem: problem.trim() }));

  return promise;
}

export const signInChoices = {
  browser: "Sign in in the browser",
  token: "Paste a token",
  later: "Not now",
} as const;

// The token reaches artil through its environment, so it stays out of the session and the
// process list.
async function loginEnv(ui: ExtensionUIContext, choice: string | undefined) {
  if (choice === signInChoices.browser) return {};
  if (choice !== signInChoices.token) return undefined;

  const token = (await ui.input("Artil token", "artil_…"))?.trim();

  return token ? { ARTIL_TOKEN: token } : undefined;
}

// Signed out, Pi offers to sign in, so the session listens without a reload.
export async function signedIn(ui: ExtensionUIContext) {
  if ((await runArtil(["auth", "status"])).ok) return true;

  const choice = await ui.select(
    "Sign in to Artil, so Pi hears about your agent's new messages",
    Object.values(signInChoices),
  );
  const env = await loginEnv(ui, choice);

  if (!env) return false;

  const { ok, problem } = await runArtil(["auth", "login"], {
    show: (line) => ui.notify(line, "info"),
    env,
  });

  if (!ok) ui.notify(`Could not sign in to Artil. ${problem}`, "error");

  return ok;
}
