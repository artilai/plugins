import { expect, test } from "bun:test";
import { existsSync } from "node:fs";

import { type Notice, listen } from "./listen";
import { artilMissing, artilRunning, eventually } from "./testing";

function listening() {
  const delivered: Notice[] = [];
  const problems: string[] = [];

  const stop = listen({
    channel: "pi-channel",
    restart: "run /reload",
    deliver: (notice) => delivered.push(notice),
    stopped: (problem) => problems.push(problem),
  });

  return { stop, delivered, problems };
}

test("delivers each notice artil prints", async () => {
  await artilRunning(
    `printf '{"content":"%s","meta":{"message_id":"mail:1","channel":"email"}}\\n' "$*"; exec cat`,
  );
  const { stop, delivered } = listening();

  await eventually(() => delivered.length > 0);

  expect(delivered).toEqual([
    { content: "internal pi-channel", meta: { message_id: "mail:1", channel: "email" } },
  ]);

  stop();
});

test("stops artil by closing its input, and delivers what it prints as it goes", async () => {
  const artil = await artilRunning(
    `cat > /dev/null; touch "$0.saved"; printf '%s\\n' '{"content":"Ada sent a text"}'`,
  );
  const { stop, delivered, problems } = listening();

  stop();

  await eventually(() => delivered.length > 0);

  expect(existsSync(`${artil}.saved`)).toBe(true);
  expect(delivered).toEqual([{ content: "Ada sent a text" }]);
  expect(problems).toEqual([]);
});

test("says why artil stopped", async () => {
  await artilRunning(`echo "Sign in as one with: artil auth login" >&2; exit 1`);
  const { problems } = listening();

  await eventually(() => problems.length > 0);

  expect(problems).toEqual(["Sign in as one with: artil auth login"]);
});

test("says how to get artil when it is missing", async () => {
  await artilMissing();
  const { problems } = listening();

  await eventually(() => problems.length > 0);

  expect(problems).toEqual([
    "The artil command is not on the PATH. Install it as https://artil.ai/INSTALL.md describes, then run /reload.",
  ]);
});
