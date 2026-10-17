# Openpay MCP security hardening

Objective: harden the community Openpay MCP for safe public use while preserving documented provider behavior.
Branch: `feat/openpay-security-hardening`
Delivery: `ask-on-risk` · chain: `stacked-to-main` (forecast: ~700 authored changed lines) · Test runner: `npx vitest run packages/payments/openpay/src/__tests__/**/*.test.ts`

## Specs

### S1 — Community fork

User requirement (verbatim): “podrias hacer el fork y mejorarlo, para que lo liberemos para la comunidad”

Acceptance:
- The fork remains publishable as an independent community contribution.
- Security, tests, package metadata, and usage documentation ship with the behavior they describe.
- The implementation stays compatible with Openpay's official sandbox and production endpoints.

### S2 — Safe-by-default operation

User requirement (verbatim): “si, la idea es que sea seguro usarlo”

Approved safety profile:
- Raw PAN and CVV inputs are prohibited; charges use tokenized or stored sources.
- HTTP transport is disabled unless explicitly enabled, requires an authentication token, binds to loopback by default, and applies bounded request handling.
- Production access and money-moving mutations require explicit opt-in configuration.
- Provider requests have bounded timeouts, validated configuration, safe errors, and official-host protection.
- Charge requests carry the customer IP required by Openpay's fraud controls.
- Automated tests pin security boundaries and prior read-only behavior.

### S3 — Community-facing reliability

Acceptance:
- Runtime, package, and registry versions agree.
- Declared dependencies match runtime imports.
- README examples explain safe sandbox-first setup, capability gates, and migration from unsafe inputs.
- CI executes the Openpay package tests and build without real credentials.

## Tasks

- [x] T1 · S2 · inline (mapping trigger resolved by `map_openpay_fork`) · RED→GREEN 8/8; commits: `3deb0a1`, `d2adacf`
- [~] T2 · S2 · inline · Provider client RED→GREEN 2/2; tool wiring pending
- [ ] T3 · S2-S3 · inline · Harden HTTP transport and align dependencies/metadata/docs · commit: pending
- [ ] T4 · S1-S3 · inline · Run focused/full verification, independent high-risk verification, and prepare the public PR · commit: pending

## Log

- L1 · 2026-10-17 · User: “podrias hacer el fork y mejorarlo, para que lo liberemos para la comunidad”
- L2 · 2026-10-17 · User chose the connected GitHub account; fork created at `hepsgs/mcp-dev-latam`.
- L3 · 2026-10-17 · User: “si, la idea es que sea seguro usarlo”
- L4 · 2026-10-17 · Exploration found no Openpay-specific tests, unauthenticated/broken HTTP mode, missing timeout and fraud header, weak schemas, raw PAN/CVV exposure, and version drift.
- L5 · 2026-10-17 · RED: focused Vitest failed because `security.ts` did not exist; GREEN: 8/8 focused security tests pass after implementing configuration, capability gates, charge validation, HTTP token checks, and redaction.
- L6 · 2026-10-17 · User approved `stacked-to-main`; each work unit will remain independently testable and reversible.






- L7 · 2026-10-17 · Rewrote the unpublished 501-line commit with user approval into two reviewable work units: 288 and 253 lines; no files were lost.


- L8 · 2026-10-17 · Provider client RED on missing module, then GREEN 2/2 with timeout, X-Forwarded-For, safe errors, and response redaction.

