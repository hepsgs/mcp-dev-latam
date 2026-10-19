import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { ErrorRequestHandler, Express, RequestHandler } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyHttpInputProtection, createMcpServer, isMainModule } from "../index.js";
import type { OpenpayConfig } from "../config.js";

const connections: Array<{ client: Client; server: ReturnType<typeof createMcpServer> }> = [];

function config(overrides: Partial<OpenpayConfig> = {}): OpenpayConfig {
  return {
    merchantId: "merchant_test",
    privateKey: "sk_test_12345678",
    environment: "sandbox",
    baseUrl: "https://sandbox-api.openpay.mx/v1/merchant_test",
    allowMutations: false,
    allowPayouts: false,
    requestTimeoutMs: 1_000,
    http: {
      enabled: false,
      host: "127.0.0.1",
      port: 3_000,
      token: "",
      rateLimitPerMinute: 60,
    },
    ...overrides,
  };
}

async function connect(serverConfig: OpenpayConfig) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer(serverConfig);
  const client = new Client({ name: "openpay-test", version: "1.0.0" });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  connections.push({ client, server });
  return client;
}

afterEach(async () => {
  await Promise.all(connections.splice(0).map(({ client, server }) =>
    Promise.all([client.close(), server.close()]),
  ));
});

describe("Openpay MCP public contract", () => {
  it("publishes token-only card schemas and blocks mutations by default", async () => {
    const client = await connect(config());
    const { tools } = await client.listTools();
    const createCard = tools.find((tool) => tool.name === "create_card");
    const createCharge = tools.find((tool) => tool.name === "create_charge");

    expect(createCard?.inputSchema.required).toContain("token_id");
    expect(createCard?.inputSchema.properties).not.toHaveProperty("card_number");
    expect(createCard?.inputSchema.properties).not.toHaveProperty("cvv2");
    expect(createCharge?.inputSchema.properties).not.toHaveProperty("card");

    const result = await client.callTool({
      name: "create_customer",
      arguments: { name: "Test", email: "test@example.com" },
    });
    expect(result.isError).toBe(true);
    expect(result.content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: expect.stringMatching(/disabled/i) }),
      ]),
    );
  });

  it("authenticates before parsing and returns safe JSON body errors", () => {
    const handlers: Array<RequestHandler | ErrorRequestHandler> = [];
    const app = {
      use(handler: RequestHandler | ErrorRequestHandler) {
        handlers.push(handler);
        return app;
      },
    } as unknown as Express;
    const parser = vi.fn() as unknown as RequestHandler;
    applyHttpInputProtection(app, parser, "secret");

    expect(handlers[1]).toBe(parser);
    const response = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
    response.status.mockReturnValue(response);
    (handlers[0] as RequestHandler)(
      { get: vi.fn().mockReturnValue(undefined) } as never, response as never, vi.fn(),
    );
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");

    (handlers[2] as ErrorRequestHandler)({ status: 413 }, {} as never, response as never, vi.fn());
    expect(response.json).toHaveBeenLastCalledWith({ error: "Payload too large" });
  });

  it("resolves executable aliases before the main-module comparison", () => {
    expect(isMainModule("linked", "file:///canonical", () => "/canonical", () => new URL("file:///canonical"))).toBe(true);
  });
});