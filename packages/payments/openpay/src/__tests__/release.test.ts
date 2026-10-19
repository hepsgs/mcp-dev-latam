import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as { name: string; version: string; scripts?: Record<string, string> };
const serverJson = JSON.parse(
  readFileSync(new URL("../../server.json", import.meta.url), "utf8"),
) as { version: string; packages: Array<{ identifier: string; version: string }> };
const indexSource = readFileSync(new URL("../index.ts", import.meta.url), "utf8");

describe("Openpay release metadata", () => {
  it("keeps the 0.3.0 package, registry, and runtime versions aligned", () => {
    expect(packageJson.name).toBe("@deviatik/mcp-openpay");
    expect(packageJson.version).toBe("0.3.0");
    expect(serverJson.version).toBe("0.3.0");
    expect(serverJson.packages[0]?.identifier).toBe("@deviatik/mcp-openpay");
    expect(serverJson.packages[0]?.version).toBe("0.3.0");
    expect(indexSource).toContain('{ name: "mcp-openpay", version: "0.3.0" }');
  });

  it("provides a package-level test command for the Openpay suite", () => {
    expect(packageJson.scripts?.test).toBe(
      "vitest run --root ../../.. packages/payments/openpay/src/__tests__",
    );
  });
});
