import { describe, expect, it } from "vitest";
import { loadOpenpayConfig } from "../config.js";
import {
  assertToolAllowed,
  isAuthorizedHttpRequest,
  redactSensitive,
  validateCardInput,
  validateChargeInput,
} from "../security.js";

const credentials = {
  OPENPAY_MERCHANT_ID: "merchant_123",
  OPENPAY_PRIVATE_KEY: "sk_test_secret",
};

describe("tool authorization", () => {
  it("is read-only by default and gates payouts separately", () => {
    const readOnly = loadOpenpayConfig(credentials);
    expect(() => assertToolAllowed("get_charge", readOnly)).not.toThrow();
    expect(() => assertToolAllowed("create_charge", readOnly)).toThrow(
      /OPENPAY_ALLOW_MUTATIONS/,
    );

    const mutations = loadOpenpayConfig({
      ...credentials,
      OPENPAY_ALLOW_MUTATIONS: "true",
    });
    expect(() => assertToolAllowed("create_charge", mutations)).not.toThrow();
    expect(() => assertToolAllowed("create_payout", mutations)).toThrow(
      /OPENPAY_ALLOW_PAYOUTS/,
    );
  });
});

describe("charge safety", () => {
  it("rejects raw card data and requires token, order, and customer IP", () => {
    expect(() =>
      validateChargeInput({
        method: "card",
        amount: 100,
        order_id: "order-1",
        customer_ip: "203.0.113.10",
        card: { card_number: "4111111111111111", cvv2: "123" },
      }),
    ).toThrow(/raw card/i);

    expect(() =>
      validateChargeInput({
        method: "card",
        amount: 100,
        order_id: "order-1",
        customer_ip: "203.0.113.10",
      }),
    ).toThrow(/source_id/);

    expect(() =>
      validateChargeInput({
        method: "card",
        source_id: "tok_test_123",
        amount: 100,
        order_id: "order-1",
        customer_ip: "203.0.113.10",
      }),
    ).not.toThrow();

    for (const amount of [0.29, 1.1]) {
      expect(() =>
        validateChargeInput({
          method: "card",
          source_id: "tok_test_123",
          amount,
          order_id: `order-${amount}`,
          customer_ip: "203.0.113.10",
        }),
      ).not.toThrow();
    }
  });
});

describe("card token safety", () => {
  it("accepts only client-side tokens and rejects raw PAN or CVV", () => {
    expect(() => validateCardInput({ token_id: "tok_test_123" })).not.toThrow();
    expect(() =>
      validateCardInput({ card_number: "4111111111111111", cvv2: "123" }),
    ).toThrow(/raw card/i);
  });
});
describe("HTTP authentication and redaction", () => {
  it("validates bearer tokens and redacts sensitive keys", () => {
    expect(
      isAuthorizedHttpRequest("Bearer " + "a".repeat(32), "a".repeat(32)),
    ).toBe(true);
    expect(
      isAuthorizedHttpRequest("Bearer " + "b".repeat(32), "a".repeat(32)),
    ).toBe(false);

    expect(
      redactSensitive({
        id: "tr_123",
        card_number: "4111111111111111",
        cvv2: "123",
        nested: { password: "secret" },
      }),
    ).toEqual({
      id: "tr_123",
      card_number: "[REDACTED]",
      cvv2: "[REDACTED]",
      nested: { password: "[REDACTED]" },
    });
  });
});
