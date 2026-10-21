import { expect, test } from "bun:test";
import { exists, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { artilRunning, eventually } from "@artil-ai/channel/testing";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import artil from "./index";
import { signInChoices } from "./sign-in";

type Handler = (event: unknown, ctx: unknown) => void;

// A signed-in artil: auth status succeeds and every other command runs the script.
function signedInArtil(script: string) {
  return `[ "$1" = auth ] && exit 0\n${script}`;
}

type PiStartedOptions = { choice?: string; token?: string };

function piStarted({ choice = signInChoices.later, token = "" }: PiStartedOptions = {}) {
  const handlers = new Map<string, Handler>();
  const sent: unknown[][] = [];
  const notified: unknown[][] = [];
  const asked: unknown[][] = [];
  const pi = {
    on: (event: string, handler: Handler) => handlers.set(event, handler),
    sendMessage: (...args: unknown[]) => sent.push(args),
  };
  const ui = {
    notify: (...args: unknown[]) => notified.push(args),
    select: async (...args: unknown[]) => {
      asked.push(args);

      return choice;
    },
    input: async () => token,
  };

  // SAFETY: the extension only calls on and sendMessage, and notify, select and input in the UI.
  artil(pi as unknown as ExtensionAPI);
  handlers.get("session_start")?.({}, { hasUI: true, ui });

  return { sent, notified, asked, shutdown: () => handlers.get("session_shutdown")?.({}, {}) };
}

test("hands each notice to the session as a follow-up that starts a turn", async () => {
  await artilRunning(
    signedInArtil(
      `printf '%s\\n' '{"content":"Ada sent an email","meta":{"message_id":"mail:1","channel":"email"}}'; exec cat`,
    ),
  );
  const pi = piStarted();

  await eventually(() => pi.sent.length > 0);
  pi.shutdown();

  expect(pi.asked).toEqual([]);
  expect(pi.sent).toEqual([
    [
      {
        customType: "artil-messages",
        content: "Ada sent an email",
        display: true,
        details: { message_id: "mail:1", channel: "email" },
      },
      { deliverAs: "followUp", triggerTurn: true },
    ],
  ]);
});

test("tells the person in Pi why artil stopped", async () => {
  await artilRunning(signedInArtil(`echo "Sign in as one with: artil auth login" >&2; exit 1`));
  const pi = piStarted();

  await eventually(() => pi.notified.length > 0);

  expect(pi.notified).toEqual([
    ["Pi no longer hears about new messages. Sign in as one with: artil auth login", "error"],
  ]);
});

// Signs in once artil auth login runs, through the browser or with the token ARTIL_TOKEN gives.
const signsInWhenAsked = `signed_in="$(dirname "$0")/signed-in"
case "$1 $2" in
  "auth status") [ -f "$signed_in" ] ;;
  "auth login") echo "Signed in with \${ARTIL_TOKEN:-the browser}."; touch "$signed_in" ;;
  *) printf '%s\\n' '{"content":"Ada sent an email"}'; exec cat ;;
esac`;

test("offers to sign in when signed out, then listens without a reload", async () => {
  await artilRunning(signsInWhenAsked);
  const pi = piStarted({ choice: signInChoices.browser });

  await eventually(() => pi.sent.length > 0);
  pi.shutdown();

  expect(pi.asked).toEqual([
    [
      "Sign in to Artil, so Pi hears about your agent's new messages",
      ["Sign in in the browser", "Paste a token", "Not now"],
    ],
  ]);
  expect(pi.notified).toEqual([["Signed in with the browser.", "info"]]);
});

test("signs in with a pasted token, handed to artil outside its arguments", async () => {
  await artilRunning(signsInWhenAsked);
  const pi = piStarted({ choice: signInChoices.token, token: " artil_secret " });

  await eventually(() => pi.sent.length > 0);
  pi.shutdown();

  expect(pi.notified).toEqual([["Signed in with artil_secret.", "info"]]);
});

test("leaves a signed-out session alone when the person does not sign in", async () => {
  const command = await artilRunning(`[ "$1" = auth ] && exit 1\ntouch "$0.listened"; exec cat`);
  const pi = piStarted();

  await eventually(() => pi.asked.length > 0);
  await Bun.sleep(50);

  expect(await exists(`${command}.listened`)).toBe(false);
  expect(pi.notified).toEqual([]);
});

test("runs the artil it brings when the PATH has none", async () => {
  // Node runs the bundled artil. An empty config folder and a closed port keep it from any real
  // sign-in, so signing in fails and says why.
  process.env.PATH = dirname(Bun.which("node") ?? "");
  process.env.ARTIL_CONFIG_HOME = await mkdtemp(join(tmpdir(), "artil-config-"));
  process.env.ARTIL_BASE_URL = "http://127.0.0.1:9";
  const pi = piStarted({ choice: signInChoices.browser });

  await eventually(() => pi.notified.some(([, type]) => type === "error"));

  expect(pi.notified.at(-1)?.[0]).toContain("Could not sign in to Artil. Error\n  Could not reach");
});
