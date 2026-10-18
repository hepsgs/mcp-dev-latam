import type { OpenpayConfig } from "./config.js";
import { redactSensitive } from "./security.js";

export interface RequestOptions {
  customerIp?: string;
}

export interface OpenpayClient {
  request(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<unknown>;
}

export function createOpenpayClient(
  config: OpenpayConfig,
  fetchImpl: typeof fetch = fetch,
): OpenpayClient {
  const basic = Buffer.from(`${config.privateKey}:`).toString("base64");

  return {
    async request(method, path, body, options = {}) {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        config.requestTimeoutMs,
      );
      timeout.unref?.();

      const headers: Record<string, string> = {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      };
      if (options.customerIp) {
        headers["X-Forwarded-For"] = options.customerIp;
      }

      try {
        const response = await fetchImpl(`${config.baseUrl}${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const requestId =
            response.headers.get("x-request-id") ||
            response.headers.get("x-openpay-request-id");
          await response.body?.cancel().catch(() => undefined);
          throw new Error(
            `Openpay API request failed (${response.status}${
              requestId ? `, request ${requestId}` : ""
            })`,
          );
        }

        const text = await response.text();
        if (!text) return {};
        try {
          return redactSensitive(JSON.parse(text));
        } catch {
          return { message: "Openpay returned a non-JSON response" };
        }
      } catch (error) {
        if (
          error instanceof Error &&
          (error.name === "AbortError" || controller.signal.aborted)
        ) {
          throw new Error("Openpay API request timed out");
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
