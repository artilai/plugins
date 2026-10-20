import { expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { artilRunning, eventually } from "@artil-ai/channel/testing";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import hearNewMessages from "./index";

type Handler = (event: unknown, ctx: unknown) => void;

function piStarted() {
  const handlers = new Map<string, Handler>();
  const sent: unknown[][] = [];
  const notified: unknown[][] = [];
  const pi = {
    on: (event: string, handler: Handler) => handlers.set(event, handler),
    sendMessage: (...args: unknown[]) => sent.push(args),
  };

  // SAFETY: the extension only calls on and sendMessage.
  hearNewMessages(pi as unknown as ExtensionAPI);
  handlers.get("session_start")?.(
    {},
    { hasUI: true, ui: { notify: (...args: unknown[]) => notified.push(args) } },
  );

  return { sent, notified, shutdown: () => handlers.get("session_shutdown")?.({}, {}) };
}

test("hands each notice to the session as a follow-up that starts a turn", async () => {
  await artilRunning(
    `printf '%s\\n' '{"content":"Ada sent an email","meta":{"message_id":"mail:1","channel":"email"}}'; exec cat`,
  );
  const pi = piStarted();

  await eventually(() => pi.sent.length > 0);
  pi.shutdown();

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
  await artilRunning(`echo "Sign in as one with: artil auth login" >&2; exit 1`);
  const pi = piStarted();

  await eventually(() => pi.notified.length > 0);

  expect(pi.notified).toEqual([
    ["Pi no longer hears about new messages. Sign in as one with: artil auth login", "error"],
  ]);
});

test("runs the artil it brings when the PATH has none", async () => {
  // Node runs the bundled artil, and an empty config folder keeps it from any real sign-in.
  process.env.PATH = dirname(Bun.which("node") ?? "");
  process.env.ARTIL_CONFIG_HOME = await mkdtemp(join(tmpdir(), "artil-config-"));
  const pi = piStarted();

  await eventually(() => pi.notified.length > 0);

  expect(pi.notified[0]?.[0]).toContain("You are not signed in. Sign in with: artil auth login");
});
