# Openpay Community Release Completion
Objective: finish the security guards and 0.3.0 release artifacts after PR #5.
Branch: `fix/openpay-release-guards` | Delivery: stacked-to-main | Runner: `npx vitest --run packages/payments/openpay/src/__tests__` and `npm run build --prefix packages/payments/openpay`
Forecast: approximately 260 authored lines across two work units; generated lockfile lines excluded.

## Specs

S1. Deliver the community fork requested as: "podrias hacer el fork y mejorarlo, para que lo liberemos para la comunidad". Acceptance: security guards land first, followed by a separate 0.3.0 release slice.
S2. Preserve the safety requirement: "si, la idea es que sea seguro usarlo". Acceptance: production API use requires explicit production opt-in; standalone `.` and `..` resource segments are rejected; sensitive aliases are redacted; malformed successful JSON behavior has regression coverage.
S3. Continue the recommended two-PR plan authorized by: "dale". Acceptance: T1 and T2 are independently reviewable stacked-to-main work units; push, PR creation, and merge remain separately authorized remote operations.

## Tasks

- [x] T1 — S2-S3 — inline (no writer trigger; one cohesive security unit) — add release guards and regression tests — commit: `403d847` — review: high, approved and acknowledged (`review-a7f37c4d16743ef9`)
- [ ] T2 — S1-S3 — inline after T1 delivery — align 0.3.0 metadata, server manifest, test script, and release documentation — commit: pending

## Log

L1 (2026-10-19): "podrias hacer el fork y mejorarlo, para que lo liberemos para la comunidad"
L2 (2026-10-19): "si, la idea es que sea seguro usarlo"
L3 (2026-10-19): "dale"
L4 (2026-10-19): PR #5 merged as 053d5079b504d45cbee272b89d4854ce03b4edb8. Post-merge mapping identified T1 and T2; the rate-limit stale-IP eviction remains an optional non-release advisory.
L5 (2026-10-19): T1 RED reproduced three missing guards: production-origin bypass through custom-host settings, standalone dot path segments, and sensitive-key aliases. GREEN: Openpay suite passed 19/19, TypeScript build passed, and `git diff --check` passed. Independent verification found a DNS-equivalent trailing-dot production-host bypass; the bounded correction added canonical host normalization and regression coverage. Recheck passed with no remaining findings. Work-unit commit: `403d847`.
L6 (2026-10-19): Native high-risk review completed with risk, readability, and reliability lenses. All three returned no findings; authority was approved and acknowledged under lineage `review-a7f37c4d16743ef9` for target `sha256:e7c858b7ed9794afd64b66c93d4e52fa797a863ed46a541254dcbd061bc0bcda`.
