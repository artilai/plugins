import { expect, test } from "bun:test";

// Cursor serves the plugin from Git without packing it, so it keeps its own copy of the skill,
// with a Grok Bot section at the end.
test("the skill is the repository's artil skill with a Grok Bot section", async () => {
  const shared = await Bun.file(new URL("../../skills/artil/SKILL.md", import.meta.url)).text();
  const shipped = await Bun.file(new URL("skills/artil/SKILL.md", import.meta.url)).text();

  expect(
    shipped.startsWith(`${shared}\n## Grok Bot\n`),
    "Copy skills/artil/SKILL.md into plugins/grok-bot/skills/artil/SKILL.md above its Grok Bot section.",
  ).toBe(true);
});
