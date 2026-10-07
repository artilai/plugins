import { expect } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const path = process.env.PATH;

export async function eventually(check: () => boolean) {
  for (let attempt = 0; !check() && attempt < 400; attempt++) await Bun.sleep(5);

  expect(check()).toBe(true);
}

export async function artilRunning(script: string) {
  const directory = await mkdtemp(join(tmpdir(), "artil-"));
  const artil = join(directory, "artil");

  await writeFile(artil, `#!/bin/sh\n${script}\n`, { mode: 0o755 });
  process.env.PATH = `${directory}:${path}`;

  return artil;
}

export async function artilMissing() {
  process.env.PATH = await mkdtemp(join(tmpdir(), "no-artil-"));
}
