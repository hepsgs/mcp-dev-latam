import { describe, expect, it } from "vitest";
import { loadOpenpayConfig } from "../config.js";

const credentials = {
  OPENPAY_MERCHANT_ID: "merchant_123",
  OPENPAY_PRIVATE_KEY: "sk_test_secret",
};

describe("loadOpenpayConfig", () => {
  it("defaults to sandbox, read-only tools, loopback HTTP, and bounded requests", () => {
    const config = loadOpenpayConfig(credentials);

    expect(config.environment).toBe("sandbox");
    expect(config.baseUrl).toBe(
      "https://sandbox-api.openpay.mx/v1/merchant_123",
    );
    expect(config.allowMutations).toBe(false);
    expect(config.allowPayouts).toBe(false);
    expect(config.requestTimeoutMs).toBe(10_000);
    expect(config.http.host).toBe("127.0.0.1");
    expect(config.http.enabled).toBe(false);
  });

  it("requires an explicit production opt-in", () => {
    expect(() =>
      loadOpenpayConfig({ ...credentials, OPENPAY_ENV: "production" }),
    ).toThrow(/OPENPAY_ENABLE_PRODUCTION/);

    expect(() =>
      loadOpenpayConfig({
        ...credentials,
        OPENPAY_BASE_URL: "https://api.openpay.mx",
        OPENPAY_ALLOW_CUSTOM_BASE_URL: "true",
      }),
    ).toThrow(/production provider host/i);
  });

  it("rejects custom provider hosts unless explicitly allowed", () => {
    expect(() =>
      loadOpenpayConfig({
        ...credentials,
        OPENPAY_BASE_URL: "https://example.invalid",
      }),
    ).toThrow(/OPENPAY_ALLOW_CUSTOM_BASE_URL/);
  });

  it("requires a strong bearer token whenever HTTP transport is enabled", () => {
    expect(() =>
      loadOpenpayConfig({ ...credentials, MCP_HTTP: "true" }),
    ).toThrow(/MCP_HTTP_TOKEN/);
  });

  it("refuses non-loopback HTTP binding without an explicit remote opt-in", () => {
    expect(() =>
      loadOpenpayConfig({
        ...credentials,
        MCP_HTTP: "true",
        MCP_HTTP_TOKEN: "a".repeat(32),
        MCP_HTTP_HOST: "0.0.0.0",
      }),
    ).toThrow(/MCP_HTTP_ALLOW_REMOTE/);
  });
});
