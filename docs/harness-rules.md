# Harness rules

`npm run validate` (`scripts/validate.mjs`) is the deterministic gate for work done by AI agents and people alike. It writes `reports/validation.json` so an agent can read the issues and fix them in a loop.

| Rule | Checks | Why it matters |
| --- | --- | --- |
| R1 | Each requirement file has a `REQ-###` id | Everything traces back to it |
| F1 | Feature files are well formed | Broken Gherkin silently drops scenarios |
| F2 | Each feature has exactly one `@REQ-###` tag that exists in `requirements/` | Traceability starts here |
| F3 | Scenario names are unique within a feature | Tests are matched by name |
| F4 | Each scenario has exactly one of `@smoke` / `@regression` | Pipelines select suites by tag |
| F5 | Each scenario has `@AC-###.#` tags defined in its requirement | Proves which criterion it covers |
| F6 | Each scenario has a When and a Then (Background counts) | A scenario without an action or outcome tests nothing |
| F7 | At most 8 steps per scenario | Long scenarios hide more than one behavior |
| F8 | No UI mechanics in steps (click, button, selector, wait…) | Keeps scenarios readable and stable when the UI changes |
| F9 | Outlines have Examples covering every `<placeholder>` | Prevents unbound parameters |
| C1 | Every acceptance criterion is covered by at least one scenario | Coverage gaps are visible before release |
| T1 | Each feature and scenario has a matching Playwright test | No scenario is left unautomated |
| T2 | `test.step` titles mirror the Gherkin steps word for word, in order | The report reads like the specification |
| T3 | No orphan tests without a scenario | No hidden, unreviewed tests |
