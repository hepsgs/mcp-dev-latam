import { describe, expect, it, vi } from "vitest";
import { loadOpenpayConfig } from "../config.js";
import { createOpenpayClient } from "../client.js";

const config = loadOpenpayConfig({
  OPENPAY_MERCHANT_ID: "merchant_123",
  OPENPAY_PRIVATE_KEY: "sk_test_secret",
});

describe("Openpay client", () => {
  it("adds Basic auth, the fraud IP header, a timeout signal, and redacts output", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        Authorization: expect.stringMatching(/^Basic /),
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.10",
      });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response(
        JSON.stringify({
          id: "tr_123",
          card_number: "4111111111111111",
        }),
        { status: 200 },
      );
    });
    const client = createOpenpayClient(config, fetchMock as typeof fetch);

    await expect(
      client.request("POST", "/charges", { amount: 100 }, {
        customerIp: "203.0.113.10",
      }),
    ).resolves.toEqual({
      id: "tr_123",
      card_number: "[REDACTED]",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sandbox-api.openpay.mx/v1/merchant_123/charges",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does not expose provider response bodies through errors", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          description: "declined for user@example.com",
          card_number: "4111111111111111",
        }),
        {
          status: 402,
          headers: { "x-request-id": "req_123" },
        },
      ),
    );
    const client = createOpenpayClient(config, fetchMock as typeof fetch);

    await expect(client.request("POST", "/charges", {})).rejects.toThrow(
      "Openpay API request failed (402, request req_123)",
    );
    await expect(client.request("POST", "/charges", {})).rejects.not.toThrow(
      /user@example\.com|4111111111111111/,
    );
  });

  it("normalizes malformed successful JSON without exposing its body", async () => {
    const fetchMock = vi.fn(async () =>
      new Response('{"card_number":"4111111111111111"', { status: 200 }),
    );
    const client = createOpenpayClient(config, fetchMock as typeof fetch);

    await expect(client.request("GET", "/charges/tr_123")).resolves.toEqual({
      message: "Openpay returned a non-JSON response",
    });
  });
});
