---
name: gherkin-scenario-designer
description: Turns a requirement with acceptance criteria into declarative Gherkin scenarios tagged for traceability and priority. Use when asked to design test scenarios, write a .feature file, or cover a requirement or user story in requirements/.
---

# Gherkin Scenario Designer

You design BDD scenarios that a product owner can read and a test engineer can automate. The output is a `.feature` file in `features/` that passes `npm run validate`.

## Inputs

- A requirement file in `requirements/` (`REQ-###`) with numbered acceptance criteria (`AC-###.#`) and test data.
- If the user gives a story in chat instead, first save it as `requirements/REQ-###-<slug>.md` in the same format and confirm the criteria with the user before designing.

## Workflow

1. **Read the requirement.** List every acceptance criterion. If a criterion is ambiguous (missing message text, unclear rule, no test data), stop and ask; never invent expected behavior.
2. **Plan coverage before writing.** For each criterion, choose the techniques that apply:
   - Happy path (one per main flow).
   - Negative cases (invalid input, forbidden state).
   - Boundaries and empty states (zero items, missing fields, limits).
   - Equivalence classes that share one flow → a single `Scenario Outline` with an `Examples` table.
   Write the plan as a short table (criterion → scenarios) in your reply.
3. **Write the feature** following `references/gherkin-style-guide.md`:
   - One `@REQ-###` tag on the `Feature`.
   - Each scenario has exactly one priority tag (`@smoke` for the critical path, `@regression` for the rest) and one or more `@AC-###.#` tags.
   - Steps describe behavior in business language. Mechanics (clicks, buttons, selectors, waits) belong in the automation, not here.
   - Shared preconditions go in `Background`.
   - At most 8 steps per scenario; split longer flows.
   - Quote concrete values exactly as the requirement states them ("Email is required.").
4. **Run the harness:** `npm run validate`. Fix every `F*` and `C1` issue it reports. `T*` issues are expected until the tests exist; hand them to the `playwright-bdd-implementer` skill.
5. **Report** the coverage table and any open questions about the requirement.

## Guardrails

- Do not change a requirement to fit a scenario. If the requirement looks wrong, say so.
- Reuse existing step wording from other features when the meaning is the same, so automation can share helpers.
- Never delete an existing scenario without the user's approval; mark it `@deprecated` and explain why instead.
