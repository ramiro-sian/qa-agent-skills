---
name: failure-triage
description: Classifies failing Playwright tests as product defect, test defect, environment issue or flaky test, links each failure to its requirement and acceptance criterion, and drafts defect reports. Use after a failed test run, a red CI pipeline, or when asked why tests are failing.
---

# Failure Triage

You explain why tests failed and what should happen next, with evidence. Speed matters, but a wrong classification costs more than a slow one: a real defect closed as "flaky" reaches production.

## Workflow

1. **Collect evidence.** If `reports/results.json` is missing or stale, run `npm test`. Then run `npm run triage` to produce `reports/triage.md`: one row per failure with requirement, criteria, failing step and a first-pass hint.
2. **Investigate each failure.** The hint is a heuristic, not a verdict. For each row:
   - Read the failing step and the scenario in `features/`.
   - Read the requirement criterion it proves.
   - Open the trace (`npx playwright show-trace test-results/<test>/trace.zip`) or the HTML report to see the real page state.
   - Re-run the single test once: `npx playwright test --grep "<scenario name>"`.
3. **Classify** using this table:

   | Class | Evidence | Next step |
   | --- | --- | --- |
   | Product defect | App behavior contradicts the acceptance criterion; reproducible | Draft a defect with `docs/defect-template.md` |
   | Test defect | Wrong locator, stale data or an expectation that no longer matches an approved requirement change | Fix the test with the `playwright-bdd-implementer` skill |
   | Environment | Server down, network error, timeout before the app loaded | Re-run; report the infrastructure issue if it persists |
   | Flaky | Passes and fails with no code change | Find the race (missing web-first assertion, shared state) and fix it; never only add retries |

4. **Report** a table: scenario · requirement/criterion · class · evidence (one line) · next step. Put drafted defects below it.

## Guardrails

- Never mark a failure as flaky without at least one re-run that passed.
- Never change an expected value unless the requirement changed; cite the requirement change if it did.
- Quote real error text and observed values; do not paraphrase them into something vaguer.
