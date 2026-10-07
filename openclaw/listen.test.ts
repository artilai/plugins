import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { listenForMessages } from "./listen";

async function eventually(check: () => boolean) {
  for (let attempt = 0; !check() && attempt < 400; attempt++) await Bun.sleep(5);

  expect(check()).toBe(true);
}

async function artilRunning(script: string) {
  const directory = await mkdtemp(join(tmpdir(), "artil-openclaw-"));
  const artil = join(directory, "artil");

  await writeFile(artil, `#!/bin/sh\n${script}\n`, { mode: 0o755 });

  return artil;
}

function listening(artil: string) {
  const delivered: unknown[] = [];
  const problems: string[] = [];

  const stop = listenForMessages({
    artil,
    deliver: (notice) => delivered.push(notice),
    stopped: (problem) => problems.push(problem),
  });

  return { stop, delivered, problems };
}

test("delivers each notice artil prints", async () => {
  const artil = await artilRunning(
    `printf '{"content":"%s","meta":{"message_id":"mail:1"}}\\n' "$*"; exec cat`,
  );
  const { stop, delivered } = listening(artil);

  await eventually(() => delivered.length > 0);

  expect(delivered).toEqual([
    { content: "internal openclaw-channel", meta: { message_id: "mail:1" } },
  ]);

  stop();
});

test("stops artil by closing its input, so it saves where it left off", async () => {
  const artil = await artilRunning(`cat > /dev/null; touch "$0.saved"`);
  const { stop, problems } = listening(artil);

  stop();

  await eventually(() => existsSync(`${artil}.saved`));

  expect(problems).toEqual([]);
});

test("says why artil stopped", async () => {
  const artil = await artilRunning(`echo "Sign in as one with: artil auth login" >&2; exit 1`);
  const { problems } = listening(artil);

  await eventually(() => problems.length > 0);

  expect(problems).toEqual(["Sign in as one with: artil auth login"]);
});

test("says how to get artil when it is missing", async () => {
  const { problems } = listening(join(tmpdir(), "no-such-dir", "artil"));

  await eventually(() => problems.length > 0);

  expect(problems).toEqual([
    "The artil command is not on the PATH. Install it with curl -fsSL https://artil.dev/install.sh | bash, then restart the gateway.",
  ]);
});
