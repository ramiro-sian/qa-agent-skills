# Playwright conventions

## Locators, in order of preference

1. `getByRole(role, { name })` — matches what users and assistive tech see.
2. `getByLabel(text)` — form inputs.
3. `getByText(text)` — static content.
4. `getByTestId(id)` — only when there is no accessible name (for example, a count badge).
5. CSS or XPath — avoid; if unavoidable, isolate it in the page object with a comment explaining why.

## Assertions

- Use web-first assertions that retry: `await expect(locator).toHaveText(...)`, `toBeVisible()`, `toBeDisabled()`, `toHaveURL(...)`.
- Assert the exact text from the requirement.
- After an action that changes state, assert the new state inside the page object (for example, `add()` waits for the "Remove" button).

## Page objects

- One class per page in `tests/pages/`, exposed through fixtures in `tests/fixtures.ts`.
- Public `readonly` locators plus intent-level methods (`logIn`, `add`, `openCart`).
- Page objects do not contain test data or business assertions beyond confirming a page loaded.

## Example: Gherkin to test

```gherkin
@smoke @AC-002.1
Scenario: Adding products increases the cart count
  When I add "Trail Backpack" to the cart
  Then the cart count is 1
```

```ts
test('Adding products increases the cart count', { tag: ['@smoke', '@AC-002.1'] }, async ({ catalogPage }) => {
  await test.step('When I add "Trail Backpack" to the cart', async () => {
    await catalogPage.add('Trail Backpack');
  });
  await test.step('Then the cart count is 1', async () => {
    await expect(catalogPage.cartCount).toHaveText('1');
  });
});
```
