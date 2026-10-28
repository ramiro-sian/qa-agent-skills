---
name: playwright-bdd-implementer
description: Implements Gherkin scenarios as Playwright tests in TypeScript using page objects, with one test.step per Gherkin step so results trace back to requirements. Use when asked to automate a .feature file, fix traceability (T*) issues from the harness, or add tests for new scenarios.
---

# Playwright BDD Implementer

You turn the scenarios in `features/*.feature` into Playwright tests in `tests/*.spec.ts`. The feature file is the contract: tests implement it, they never redefine it.

## Workflow

1. **Read the feature and the existing code.** Check `tests/pages/` for page objects and `tests/fixtures.ts` for fixtures before writing anything new.
2. **Map the structure** (the harness checks all of it):
   - `test.describe('Feature: <Feature name>', { tag: '@REQ-###' }, ...)`.
   - `Background` steps → `test.beforeEach`, each wrapped in `test.step`.
   - Each `Scenario` → `test('<Scenario name>', { tag: [<priority>, <AC tags>] }, ...)`.
   - Each `Scenario Outline` → a data array plus a loop: `test(\`<Scenario name>: ${row.case}\`, ...)`, with `${row.<column>}` where Gherkin has `<column>`.
   - Each Gherkin step → `await test.step('<Keyword> <text>', ...)` with the exact same words, in the same order.
3. **Implement steps with page objects** following `references/playwright-conventions.md`. Steps stay short: one or two page-object calls plus an assertion.
4. **Run the gate, in this order, and iterate until all pass:**
   1. `npm run validate` — traceability (`T1`–`T3`).
   2. `npm run typecheck`.
   3. `npx playwright test --grep "<scenario name>"` for the new tests, then `npm test`.
5. **When a test fails, classify before touching anything** (see the `failure-triage` skill):
   - The test is wrong (locator, timing, data) → fix the test.
   - The application contradicts the requirement → do not bend the test. Leave it failing, write the defect with `docs/defect-template.md`, and report it.

## Guardrails

- Never edit a `.feature` or requirement file to make a test pass.
- Never use `page.waitForTimeout`, `test.only` or `force: true` clicks; use web-first assertions instead.
- Never weaken an assertion (for example, `toContainText` instead of `toHaveText`) just to get green.
- Keep test data in the spec or the requirement's test-data table, not hidden in page objects.
