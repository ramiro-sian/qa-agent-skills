# Gherkin style guide

## Declarative, not imperative

| Avoid (imperative) | Prefer (declarative) |
| --- | --- |
| When I type "a@b.com" into the email field and click the Log in button | When I log in as "a@b.com" with password "x" |
| Then the element .badge contains "2" | Then the cart count is 2 |
| And I wait 3 seconds | (nothing — waiting is the automation's job) |

The harness rejects these words in steps: click, button, textbox, field, xpath, css, selector, locator, wait, sleep, scroll, hover, "type into".

## Given / When / Then

- **Given** — the state before the action. Phrase it as a fact: "Given I have added "Rain Jacket" to the cart".
- **When** — the single action under test. Use one When per scenario where possible.
- **Then** — the observable outcome a user or system can verify.
- **And / But** — continue the previous keyword.

## Tags

| Tag | Where | Meaning |
| --- | --- | --- |
| `@REQ-###` | Feature | The requirement this feature verifies |
| `@AC-###.#` | Scenario | Acceptance criteria the scenario proves |
| `@smoke` | Scenario | Critical path; runs on every commit |
| `@regression` | Scenario | Full suite; runs before release |

## Scenario Outline

Use one when the flow is identical and only data changes. Add a `case` column with a short label: the automation uses it in the test title (`<Scenario name>: <case>`).

## Naming

- Scenario names state the outcome: "Empty cart blocks checkout", not "Test empty cart".
- Names are unique within a feature; the harness matches tests by name.
