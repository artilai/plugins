import { expect, mock, test } from "bun:test";

import { artilRunning, eventually } from "@artil-ai/channel/testing";
import type {
  OpenClawPluginApi,
  OpenClawPluginService,
  OpenClawPluginServiceContext,
} from "openclaw/plugin-sdk/plugin-entry";

// OpenClaw's SDK only loads in Node, so these stand in for the two functions the plugin takes from it.
mock.module("openclaw/plugin-sdk/agent-scope-runtime", () => ({
  resolveDefaultAgentId: () => "main",
}));
mock.module("openclaw/plugin-sdk/plugin-entry", () => ({
  definePluginEntry: (entry: unknown) => entry,
}));

const { default: plugin } = await import("./index");

test("starts a turn in the agent's artil session for each notice, delivering no replies", async () => {
  await artilRunning(
    `printf '%s\\n' '{"content":"Ada sent an email","meta":{"message_id":"mail:1","channel":"email"}}' '{"content":"Someone on your team woke you up."}'; exec cat`,
  );
  const runs: unknown[] = [];
  let service: OpenClawPluginService | undefined;

  // SAFETY: the plugin only reads registrationMode and calls registerService and runtime.subagent.run.
  plugin.register({
    registrationMode: "full",
    registerService: (registered: OpenClawPluginService) => (service = registered),
    runtime: { subagent: { run: async (params: unknown) => runs.push(params) } },
  } as unknown as OpenClawPluginApi);

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
