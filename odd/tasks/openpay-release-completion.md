# Openpay Community Release Completion
Objective: finish the security guards and 0.3.0 release artifacts after PR #5.
Branch: `codex/fix-openpay-npm-scope` | Delivery: stacked-to-main | Runner: `npx vitest --run packages/payments/openpay/src/__tests__` and `npm run build --prefix packages/payments/openpay`
Forecast: approximately 260 authored lines across two work units; generated lockfile lines excluded.

## Specs

S1. Deliver the community fork requested as: "podrias hacer el fork y mejorarlo, para que lo liberemos para la comunidad". Acceptance: security guards land first, followed by a separate 0.3.0 release slice.
S2. Preserve the safety requirement: "si, la idea es que sea seguro usarlo". Acceptance: production API use requires explicit production opt-in; standalone `.` and `..` resource segments are rejected; sensitive aliases are redacted; malformed successful JSON behavior has regression coverage.
S3. Continue the recommended two-PR plan authorized by: "dale". Acceptance: T1 and T2 are independently reviewable stacked-to-main work units; push, PR creation, and merge remain separately authorized remote operations.
S4. Publish under the npm organization requested as: "de las organizaciones la que debemos usar es deviatik". Acceptance: the Openpay package and its npm-facing documentation/manifest references use `@deviatik/mcp-openpay`; no `@codespar/mcp-openpay` package is published.

## Tasks

- [x] T1 — S2-S3 — inline (no writer trigger; one cohesive security unit) — add release guards and regression tests — commit: `403d847` — review: high, approved and acknowledged (`review-a7f37c4d16743ef9`)
- [x] T2 — S1-S3 — inline after T1 delivery — align 0.3.0 metadata, server manifest, test script, and release documentation — commit: `d30193f` — review: high, approved and acknowledged (`review-d36fb93c19bdd0c0`)
- [x] T3 — S4 — inline (no writer trigger; one cohesive package-identity correction) — change the npm package scope and verify before delivery — commits: `8ab2d40` plus pending CI correction — review: initial candidate approved (`review-6504ad160ab86191`); correction pending assessment

## Log

L1 (2026-10-19): "podrias hacer el fork y mejorarlo, para que lo liberemos para la comunidad"
L2 (2026-10-19): "si, la idea es que sea seguro usarlo"
L3 (2026-10-19): "dale"
L4 (2026-10-19): PR #5 merged as 053d5079b504d45cbee272b89d4854ce03b4edb8. Post-merge mapping identified T1 and T2; the rate-limit stale-IP eviction remains an optional non-release advisory.
L5 (2026-10-19): T1 RED reproduced three missing guards: production-origin bypass through custom-host settings, standalone dot path segments, and sensitive-key aliases. GREEN: Openpay suite passed 19/19, TypeScript build passed, and `git diff --check` passed. Independent verification found a DNS-equivalent trailing-dot production-host bypass; the bounded correction added canonical host normalization and regression coverage. Recheck passed with no remaining findings. Work-unit commit: `403d847`.
L6 (2026-10-19): Native high-risk review completed with risk, readability, and reliability lenses. All three returned no findings; authority was approved and acknowledged under lineage `review-a7f37c4d16743ef9` for target `sha256:e7c858b7ed9794afd64b66c93d4e52fa797a863ed46a541254dcbd061bc0bcda`.
L7 (2026-10-19): T2 RED reproduced misaligned 0.2.2 metadata and the missing package-level test command. GREEN: package tests passed 21/21, TypeScript build passed, the Openpay 0.3.0 dry-run package contained exactly 10 expected runtime files, catalog audit had no candidate-caused findings, and `git diff --check` passed. Independent verification and the parent spot-check passed. Work-unit commit: `d30193f`.
L8 (2026-10-19): Native high-risk review of T2 completed with risk, readability, and reliability lenses. All three returned no findings; authority was approved and acknowledged under lineage `review-d36fb93c19bdd0c0` for target `sha256:e94835c4aab1bccf203c20144971f2d8dff5f8716144a59a905c837612cbcb1b`.
L9 (2026-10-19): "de las organizaciones la que debemos usar es deviatik". The attempted `@codespar/mcp-openpay` publication failed with npm E404 before publishing. T3 reopens release delivery to correct the npm scope before any package or GitHub Release is created.
L10 (2026-10-19): T3 RED reproduced the `@codespar/mcp-openpay` package identity. GREEN: the focused release test passed 2/2, the Openpay suite passed 21/21, TypeScript build passed, the `@deviatik/mcp-openpay@0.3.0` dry-run package contained exactly 10 intended runtime files, and `git diff --check` passed. Independent verification covered S1-S4 with no candidate-caused blockers; npm identity `hepsgs` can publish to the requested `deviatik` organization and version 0.3.0 remains unpublished.
L11 (2026-10-19): Native high-risk review completed with risk, readability, and reliability lenses. All three returned no findings; authority was approved and acknowledged under lineage `review-6504ad160ab86191` for target `sha256:9802be1393368d500faf19a6167e5e24f311846397aaed4feab9ef8400a22d5f`.
L12 (2026-10-19): PR #8 CI passed security and build-and-test but failed catalog because `scripts/audit-catalog.py` hard-coded the upstream `@codespar/mcp-` npm scope. T3 reopened for a bounded correction that accepts any valid scoped `@<organization>/mcp-<slug>` identifier while requiring it to match the package manifest.
L13 (2026-10-19): The bounded CI correction generalized npm scope validation without weakening the server `name` or `mcpName` rules. Local catalog audit returned HIGH=0 with the existing MED=3 and LOW=1 unchanged. Synthetic probes accepted a matching `@deviatik/mcp-openpay` identifier and rejected malformed scopes, wrong slugs, manifest mismatches, and missing or unreadable package names. Independent blocker recheck passed.
