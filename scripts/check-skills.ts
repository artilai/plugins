import { existsSync } from "node:fs";

const tracked = Bun.spawnSync(["git", "ls-files", "*/SKILL.md"]).stdout.toString();
const skills = tracked.trim().split("\n");
const problems: string[] = [];

// A plugin's skills run the artil it brings; Codex brings none, so its skill runs the one installed.
function artilOf(skill: string) {
  const brought = `${skill.slice(0, skill.indexOf("/skills/"))}/node_modules/.bin/artil`;

  return existsSync(brought) ? brought : "artil";
}

function helpOf(artil: string, words: string[]) {
  const usage = `artil ${words.join(" ")}`;
  const { success, stdout } = Bun.spawnSync([artil, ...words, "--help"]);
  const help = stdout.toString();
  const lines = help.split("\n").map((line) => line.trim());
  const line = lines.find((line) => line === usage || line.startsWith(`${usage} `));

  return success && line !== undefined ? { help, usage: line } : undefined;
}

// Trailing words may be positional arguments, like the place in artil secrets link pi, as long
// as the command's usage has room for them.
function commandOf(artil: string, words: string[]) {
  for (let end = words.length; end > 0; end--) {
    const found = helpOf(artil, words.slice(0, end));
    const room = found?.usage.match(/<[^>]+>/g)?.length ?? 0;

    if (found && words.length - end <= room)
      return { words: words.slice(0, end), help: found.help };
  }

  return undefined;
}

for (const skill of skills) {
  const text = await Bun.file(skill).text();
  const artil = artilOf(skill);

  for (const [, command = ""] of text.matchAll(/`artil ([^`]+)`/g)) {
    const [own = ""] = command.split(" -- ");
    const tokens = own.split(/\s+/);
    const words = tokens.filter((token) => /^[a-z]+$/.test(token));
    const flags = tokens.filter((token) => token.startsWith("--") && token !== "--help");
    const found = commandOf(artil, words);

    if (found === undefined) {
      problems.push(`${skill}: artil ${words.join(" ")} is not a command`);
      continue;
    }

    for (const flag of flags.filter((flag) => !found.help.includes(flag))) {
      problems.push(`${skill}: artil ${found.words.join(" ")} has no ${flag}`);
    }
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(`Every artil command in ${skills.join(", ")} exists.`);
