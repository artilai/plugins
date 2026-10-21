import { createRequire } from "node:module";
import { delimiter, dirname } from "node:path";

// A plugin's package depends on artil-ai, whose folder holds the artil command. A plugin installed
// without its dependencies, like from a local folder, has none.
function bundledArtil(pluginUrl: string) {
  try {
    return dirname(createRequire(pluginUrl).resolve("artil-ai/package.json"));
  } catch {
    return undefined;
  }
}

// The harness's commands and the channel fall back to the plugin's artil when the PATH has none.
export function addBundledArtil(pluginUrl: string) {
  const artil = bundledArtil(pluginUrl);
  const path = process.env.PATH?.split(delimiter) ?? [];

  if (artil && !path.includes(artil)) process.env.PATH = [...path, artil].join(delimiter);
}
