const skills = (await Array.fromAsync(new Bun.Glob("*/skills/*/SKILL.md").scan())).toSorted();
const problems: string[] = [];

function helpOf(words: string[]) {
  const usage = `artil ${words.join(" ")}`;
  const { success, stdout } = Bun.spawnSync(["artil", ...words, "--help"]);
  const help = stdout.toString();
  const lines = help.split("\n").map((line) => line.trim());

  return success && lines.some((line) => line === usage || line.startsWith(`${usage} `))
    ? help
    : undefined;
}

for (const skill of skills) {
  const text = await Bun.file(skill).text();

  for (const [, command = ""] of text.matchAll(/`artil ([^`]+)`/g)) {
    const [own = ""] = command.split(" -- ");
    const tokens = own.split(/\s+/);
    const words = tokens.filter((token) => /^[a-z]+$/.test(token));
    const flags = tokens.filter((token) => token.startsWith("--") && token !== "--help");
    const help = helpOf(words);

    if (help === undefined) {
      problems.push(`${skill}: artil ${words.join(" ")} is not a command`);
      continue;
    }

    for (const flag of flags.filter((flag) => !help.includes(flag))) {
      problems.push(`${skill}: artil ${words.join(" ")} has no ${flag}`);
    }
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(`Every artil command in ${skills.join(", ")} exists.`);
