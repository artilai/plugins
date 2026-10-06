import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { listenForMessages } from "./messages";

async function eventually(check: () => boolean) {
  for (let attempt = 0; !check() && attempt < 400; attempt++) await Bun.sleep(5);

  expect(check()).toBe(true);
}

function running(pid: number) {
  try {
    return process.kill(pid, 0);
  } catch {
    return false;
  }
}

async function artilRunning(script: string) {
  const directory = await mkdtemp(join(tmpdir(), "artil-pi-"));
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

test("delivers each notice artil prints until it is stopped", async () => {
  const artil = await artilRunning(
    `echo $$ > "$0.pid"; printf '{"content":"%s","meta":{"message_id":"mail:1"}}\\n' "$*"; exec cat`,
  );

  const { stop, delivered, problems } = listening(artil);

  await eventually(() => delivered.length > 0);

  expect(delivered).toEqual([{ content: "internal pi-channel", meta: { message_id: "mail:1" } }]);

  const pid = Number(readFileSync(`${artil}.pid`, "utf8"));

  stop();

  await eventually(() => !running(pid));

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
    "The artil command is not on the PATH. Install it with curl -fsSL https://artil.dev/install.sh | bash, or add ~/.local/bin to the PATH, then run /reload.",
  ]);
});
