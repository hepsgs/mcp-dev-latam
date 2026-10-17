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
- [x] T2 · S2 · inline · Provider client and public MCP contract GREEN 13/13; commits: `d040bf1`, `85776ca`
- [x] T3 · S2-S3 · inline · Secure HTTP, dependency alignment, 0.3.0 metadata, migration docs, and existing CI coverage verified · commit: `837d6ba`
- [~] T4 · S1-S3 · inline · Independent verification found four blockers; one bounded correction applied and recheck pending · commit: pending

## Log

- L1 · 2026-10-17 · User: “podrias hacer el fork y mejorarlo, para que lo liberemos para la comunidad”
- L2 · 2026-10-17 · User chose the connected GitHub account; fork created at `hepsgs/mcp-dev-latam`.
- L3 · 2026-10-17 · User: “si, la idea es que sea seguro usarlo”
- L4 · 2026-10-17 · Exploration found no Openpay-specific tests, unauthenticated/broken HTTP mode, missing timeout and fraud header, weak schemas, raw PAN/CVV exposure, and version drift.
- L5 · 2026-10-17 · RED: focused Vitest failed because `security.ts` did not exist; GREEN: 8/8 focused security tests pass after implementing configuration, capability gates, charge validation, HTTP token checks, and redaction.
- L6 · 2026-10-17 · User approved `stacked-to-main`; each work unit will remain independently testable and reversible.






- L7 · 2026-10-17 · Rewrote the unpublished 501-line commit with user approval into two reviewable work units: 288 and 253 lines; no files were lost.


- L8 · 2026-10-17 · Provider client RED on missing module, then GREEN 2/2 with timeout, X-Forwarded-For, safe errors, and response redaction.

- L9 · 2026-10-17 · Public MCP contract GREEN 13/13; HTTP smoke returned 401 without Bearer auth and 200 with auth plus Cache-Control: no-store. Declared Express 5.3.0 and upgraded the direct MCP SDK to 1.32.1 after audit identified the older resolved version as vulnerable.
- L10 · 2026-10-17 · HTTP rate-limit smoke returned 200 then 429 at a one-request limit. Package 0.3.0 tests 13/13 and build pass; catalog audit reports no Openpay findings and zero HIGH findings repository-wide.
- L11 · 2026-10-17 · Independent verification found four blockers: missing sibling modules in the npm artifact, direct production-host opt-in bypass, raw card fields escaping through other tools, and no public-interface read-only regression. One correction batch added package files/prepack controls, blocked sandbox-to-production host selection, enforced raw-card rejection for every tool, and added public regression tests. Focused tests pass 14/14; packed installation imports successfully.
