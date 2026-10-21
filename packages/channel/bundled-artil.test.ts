import { expect, test } from "bun:test";
import { mkdir, mkdtemp, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { pathToFileURL } from "node:url";

import { addBundledArtil } from "./bundled-artil";

async function plugin(withArtil: boolean) {
  const root = await realpath(await mkdtemp(join(tmpdir(), "plugin-")));
  const artil = join(root, "node_modules", "artil-ai");

  if (withArtil) {
    await mkdir(artil, { recursive: true });
    await writeFile(join(artil, "package.json"), "{}");
  }

  return { url: pathToFileURL(join(root, "index.js")).href, artil };
}

test("puts the artil the plugin depends on last on the PATH, once", async () => {
  const { url, artil } = await plugin(true);

  process.env.PATH = "/usr/bin";
  addBundledArtil(url);
  addBundledArtil(url);

  expect(process.env.PATH).toBe(["/usr/bin", artil].join(delimiter));
});

test("leaves the PATH alone for a plugin installed without its dependencies", async () => {
  const { url } = await plugin(false);

  process.env.PATH = "/usr/bin";
  addBundledArtil(url);

  expect(process.env.PATH).toBe("/usr/bin");
});
