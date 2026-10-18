import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { OpenpayConfig } from "./config.js";

const MUTATING_TOOLS = new Set([
  "create_charge",
  "capture_charge",
  "refund_charge",
  "create_customer",
  "update_customer",
  "delete_customer",
  "create_card",
  "delete_card",
  "create_bank_account",
  "delete_bank_account",
  "create_plan",
  "create_subscription",
  "cancel_subscription",
  "create_payout",
  "create_webhook",
  "delete_webhook",
]);

const SENSITIVE_KEYS = new Set([
  "card_number",
  "cvv",
  "cvv2",
  "password",
  "private_key",
  "authorization",
  "clabe",
]);

export function assertToolAllowed(name: string, config: OpenpayConfig): void {
  if (MUTATING_TOOLS.has(name) && !config.allowMutations) {
    throw new Error(
      `${name} is disabled; set OPENPAY_ALLOW_MUTATIONS=true after reviewing the operation`,
    );
  }
  if (name === "create_payout" && !config.allowPayouts) {
    throw new Error(
      "create_payout is disabled; set OPENPAY_ALLOW_PAYOUTS=true after reviewing payout controls",
    );
  }
}

function containsRawCardData(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsRawCardData);
  return Object.entries(value).some(
    ([key, nested]) =>
      ["card", "card_number", "cvv", "cvv2"].includes(key.toLowerCase()) ||
      containsRawCardData(nested),
  );
}

function requiredString(
  value: unknown,
  name: string,
  maximum = 100,
): string {
  if (typeof value !== "string" || !value.trim() || value.length > maximum) {
    throw new Error(
      `${name} must be a non-empty string up to ${maximum} characters`,
    );
  }
  return value;
}

function assertAmount(value: unknown): asserts value is number {
  const scaled = typeof value === "number" ? value * 100 : Number.NaN;
  const roundingError = Math.abs(scaled - Math.round(scaled));
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(scaled)) * 2;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 999_999_999 ||
    roundingError > tolerance
  ) {
    throw new Error(
      "amount must be positive and have at most two decimal places",
    );
  }
}

export interface ValidatedCharge {
  body: Record<string, unknown>;
  customerIp: string;
}

export function validateChargeInput(
  input: Record<string, unknown>,
  production = false,
): ValidatedCharge {
  if (containsRawCardData(input)) {
    throw new Error(
      "Raw card data is prohibited; tokenize with Openpay.js and pass source_id",
    );
  }

  const method = requiredString(input.method, "method", 32);
  if (!["card", "bank_account", "store"].includes(method)) {
    throw new Error("method must be card, bank_account, or store");
  }
  assertAmount(input.amount);
  requiredString(input.order_id, "order_id");

  const customerIp = requiredString(input.customer_ip, "customer_ip", 45);
  if (isIP(customerIp) === 0) {
    throw new Error("customer_ip must be a valid IPv4 or IPv6 address");
  }

  if (method === "card") {
    requiredString(input.source_id, "source_id");
    if (production) {
      requiredString(input.device_session_id, "device_session_id");
    }
  }
  if (input.currency !== undefined && input.currency !== "MXN") {
    throw new Error("currency must be MXN");
  }

  const { customer_ip: _customerIp, ...body } = input;
  return {
    body: { ...body, currency: input.currency ?? "MXN" },
    customerIp,
  };
}

export function pathSegment(value: unknown, name: string): string {
  const text = requiredString(value, name, 128);
  if (!/^[A-Za-z0-9._-]+$/.test(text)) {
    throw new Error(`${name} contains unsupported characters`);
  }
  return encodeURIComponent(text);
}

export function isAuthorizedHttpRequest(
  authorization: string | undefined,
  expectedToken: string,
): boolean {
  if (!authorization?.startsWith("Bearer ") || !expectedToken) return false;
  const supplied = Buffer.from(authorization.slice(7), "utf8");
  const expected = Buffer.from(expectedToken, "utf8");
  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
  );
}

export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase())
        ? "[REDACTED]"
        : redactSensitive(nested),
    ]),
  );
}
