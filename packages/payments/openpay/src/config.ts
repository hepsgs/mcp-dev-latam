export type Environment = Record<string, string | undefined>;

export interface HttpConfig {
  enabled: boolean;
  host: string;
  port: number;
  token: string;
  rateLimitPerMinute: number;
}

export interface OpenpayConfig {
  merchantId: string;
  privateKey: string;
  environment: "sandbox" | "production";
  baseUrl: string;
  allowMutations: boolean;
  allowPayouts: boolean;
  requestTimeoutMs: number;
  http: HttpConfig;
}

function enabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function boundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
  name: string,
): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return parsed;
}

function requireCredential(
  env: Environment,
  name: "OPENPAY_MERCHANT_ID" | "OPENPAY_PRIVATE_KEY",
): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function isLoopback(host: string): boolean {
  return host === "127.0.0.1" || host === "::1" || host === "localhost";
}

function providerOrigin(
  env: Environment,
  environment: "sandbox" | "production",
): string {
  const official =
    environment === "production"
      ? "https://api.openpay.mx"
      : "https://sandbox-api.openpay.mx";
  const requested = env.OPENPAY_BASE_URL?.trim();
  if (!requested) return official;

  let url: URL;
  try {
    url = new URL(requested);
  } catch {
    throw new Error("OPENPAY_BASE_URL must be a valid absolute URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("OPENPAY_BASE_URL must use HTTPS");
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error("OPENPAY_BASE_URL must contain only an HTTPS origin");
  }
  if (
    environment !== "production" &&
    url.origin === "https://api.openpay.mx"
  ) {
    throw new Error(
      "The production provider host requires OPENPAY_ENV=production and OPENPAY_ENABLE_PRODUCTION=true",
    );
  }
  if (
    url.origin !== official &&
    !enabled(env.OPENPAY_ALLOW_CUSTOM_BASE_URL)
  ) {
    throw new Error(
      "Custom provider hosts require OPENPAY_ALLOW_CUSTOM_BASE_URL=true",
    );
  }
  return url.origin;
}

export function loadOpenpayConfig(
  env: Environment = process.env,
): OpenpayConfig {
  const merchantId = requireCredential(env, "OPENPAY_MERCHANT_ID");
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(merchantId)) {
    throw new Error("OPENPAY_MERCHANT_ID has an invalid format");
  }

  const privateKey = requireCredential(env, "OPENPAY_PRIVATE_KEY");
  if (privateKey.length < 8 || /\s/.test(privateKey)) {
    throw new Error("OPENPAY_PRIVATE_KEY has an invalid format");
  }

  const rawEnvironment = (env.OPENPAY_ENV || "sandbox").trim().toLowerCase();
  if (rawEnvironment !== "sandbox" && rawEnvironment !== "production") {
    throw new Error("OPENPAY_ENV must be 'sandbox' or 'production'");
  }
  const environment = rawEnvironment;
  if (
    environment === "production" &&
    !enabled(env.OPENPAY_ENABLE_PRODUCTION)
  ) {
    throw new Error("Production requires OPENPAY_ENABLE_PRODUCTION=true");
  }

  const allowMutations = enabled(env.OPENPAY_ALLOW_MUTATIONS);
  const allowPayouts = enabled(env.OPENPAY_ALLOW_PAYOUTS);
  if (allowPayouts && !allowMutations) {
    throw new Error(
      "OPENPAY_ALLOW_PAYOUTS=true also requires OPENPAY_ALLOW_MUTATIONS=true",
    );
  }

  const httpEnabled = enabled(env.MCP_HTTP);
  const httpToken = env.MCP_HTTP_TOKEN?.trim() || "";
  if (httpEnabled && httpToken.length < 32) {
    throw new Error(
      "MCP_HTTP_TOKEN must contain at least 32 characters when HTTP is enabled",
    );
  }
  const httpHost = env.MCP_HTTP_HOST?.trim() || "127.0.0.1";
  if (
    httpEnabled &&
    !isLoopback(httpHost) &&
    !enabled(env.MCP_HTTP_ALLOW_REMOTE)
  ) {
    throw new Error(
      "Non-loopback HTTP binding requires MCP_HTTP_ALLOW_REMOTE=true",
    );
  }

  const origin = providerOrigin(env, environment);
  return {
    merchantId,
    privateKey,
    environment,
    baseUrl: `${origin}/v1/${encodeURIComponent(merchantId)}`,
    allowMutations,
    allowPayouts,
    requestTimeoutMs: boundedInteger(
      env.OPENPAY_REQUEST_TIMEOUT_MS,
      10_000,
      1_000,
      30_000,
      "OPENPAY_REQUEST_TIMEOUT_MS",
    ),
    http: {
      enabled: httpEnabled,
      host: httpHost,
      port: boundedInteger(env.MCP_PORT, 3000, 1, 65_535, "MCP_PORT"),
      token: httpToken,
      rateLimitPerMinute: boundedInteger(
        env.MCP_HTTP_RATE_LIMIT_PER_MINUTE,
        60,
        1,
        1_000,
        "MCP_HTTP_RATE_LIMIT_PER_MINUTE",
      ),
    },
  };
}
