# Project guide for Claude

This repo turns requirements into automated tests through three Agent Skills, gated by a deterministic harness.

## Flow

1. `requirements/REQ-###-*.md` — acceptance criteria (`AC-###.#`) and test data. Source of truth.
2. `features/*.feature` — written with the `gherkin-scenario-designer` skill.
3. `tests/*.spec.ts` — written with the `playwright-bdd-implementer` skill (TypeScript, page objects in `tests/pages/`).
4. Failures — analyzed with the `failure-triage` skill.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run validate` | Harness: Gherkin rules, AC coverage, Gherkin ↔ test traceability (`docs/harness-rules.md`) |
| `npm run typecheck` | TypeScript check |
| `npm test` / `npm run test:smoke` | Playwright suite / smoke only (starts the demo app automatically) |
| `npm run triage` | Failure table linked to requirements (`reports/triage.md`) |
| `npm run check` | Everything above except triage, in order |

## Rules

- Work is done only when `npm run check` passes, or when remaining failures are classified as product defects with a written defect report.
- Never edit requirements or feature files to make a test pass.
- The demo app in `demo-app/` is the system under test; do not change it while writing tests.
