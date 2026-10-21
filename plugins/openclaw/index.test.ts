import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { readFile } from "node:fs/promises";

import { artilRunning, eventually } from "@artil-ai/channel/testing";
import type {
  OpenClawPluginApi,
  OpenClawPluginService,
  OpenClawPluginServiceContext,
} from "openclaw/plugin-sdk/plugin-entry";

type Registrar = Parameters<OpenClawPluginApi["registerCli"]>[0];

// OpenClaw's SDK only loads in Node, so these stand in for the two functions the plugin takes from it.
mock.module("openclaw/plugin-sdk/agent-scope-runtime", () => ({
  resolveDefaultAgentId: () => "main",
}));
mock.module("openclaw/plugin-sdk/plugin-entry", () => ({
  definePluginEntry: (entry: unknown) => entry,
}));

const { default: plugin } = await import("./index");

afterEach(() => {
  process.exitCode = 0;
});

// Registers the plugin as OpenClaw's gateway would, keeping its service, CLI and subagent runs.
function registered() {
  const runs: unknown[] = [];
  let service: OpenClawPluginService | undefined;
  let cli: Registrar | undefined;

  // SAFETY: the plugin only reads registrationMode and calls registerCli, registerService and
  // runtime.subagent.run.
  plugin.register({
    registrationMode: "full",
    registerCli: (registrar: Registrar) => (cli = registrar),
    registerService: (registered: OpenClawPluginService) => (service = registered),
    runtime: { subagent: { run: async (params: unknown) => runs.push(params) } },
  } as unknown as OpenClawPluginApi);

  return { runs, service, cli };
}

test("starts a turn in the agent's artil session for each notice, delivering no replies", async () => {
  await artilRunning(
    `printf '%s\\n' '{"content":"Ada sent an email","meta":{"message_id":"mail:1","channel":"email"}}' '{"content":"Someone on your team woke you up."}'; exec cat`,
  );
  const { runs, service } = registered();

  // SAFETY: the service only reads config and logger.
  const context = { config: {}, logger: console } as unknown as OpenClawPluginServiceContext;

  await service?.start(context);
  await eventually(() => runs.length === 2);
  await service?.stop?.(context);

  const turn = {
    sessionKey: "agent:main:artil",
    extraSystemPrompt: expect.any(String),
    deliver: false,
  };

  expect(runs).toEqual([
    { ...turn, message: "Ada sent an email", idempotencyKey: "mail:1" },
    { ...turn, message: "Someone on your team woke you up." },
  ]);
});

test("adds openclaw artil, which runs artil with every argument and exits as it does", async () => {
  const artil = await artilRunning(`printf '%s\\n' "$ARTIL_CLIENT" "$@" > "$0.args"; exit 3`);
  const { cli } = registered();
  let action: ((args: string[]) => Promise<void>) | undefined;
  const command = {
    command: () => command,
    description: () => command,
    argument: () => command,
    allowUnknownOption: () => command,
    helpOption: () => command,
    action: (handler: typeof action) => {
      action = handler;

      return command;
    },
  };

  // SAFETY: the plugin only chains these commander calls on the program.
  await cli?.({ program: command } as unknown as Parameters<Registrar>[0]);
  await action?.(["auth", "login", "--token", "artil_secret"]);

  expect(await readFile(`${artil}.args`, "utf8")).toBe(
    "openclaw\nauth\nlogin\n--token\nartil_secret\n",
  );
  expect(process.exitCode).toBe(3);
});

test("tries again after artil stops, until it can listen", async () => {
  await artilRunning(`if [ -f "$0.signed-in" ]; then printf '%s\\n' '{"content":"Ada sent an email"}'; exec cat; fi
touch "$0.signed-in"; echo "You are not signed in." >&2; exit 1`);
  const { runs, service } = registered();
  const errors: unknown[] = [];

  // SAFETY: the service only reads config and calls logger.error.
  const context = {
    config: {},
    logger: { error: (message: unknown) => errors.push(message) },
  } as unknown as OpenClawPluginServiceContext;

  // Keeps the 30-second retry to run it at once, and lets every other timer run as it would.
  const retries: Array<() => void> = [];
  const wait = setTimeout;
  const timers = spyOn(globalThis, "setTimeout").mockImplementation(((
    callback: () => void,
    delay?: number,
  ) => {
    if (delay !== 30_000) return wait(callback, delay);

    retries.push(callback);

    return wait(() => {}, 0);
  }) as typeof setTimeout);

  await service?.start(context);
  await eventually(() => retries.length > 0);
  retries[0]?.();
  await eventually(() => runs.length > 0);
  await service?.stop?.(context);
  timers.mockRestore();

  expect(errors).toEqual([
    "OpenClaw does not hear about new messages and tries again every 30 seconds. You are not signed in.",
  ]);
});
