// Implements features/cart.feature. Each test.step mirrors a Gherkin step word for word;
// `npm run validate` fails if the two drift apart.
import { expect, test } from './fixtures';

test.describe('Feature: Shopping cart', { tag: '@REQ-002' }, () => {
  test.beforeEach(async ({ loginPage, catalogPage }) => {
    await test.step('Given I am logged in as "qa.user@example.com" with password "Passw0rd!"', async () => {
      await loginPage.goto();
      await loginPage.logIn('qa.user@example.com', 'Passw0rd!');
      await catalogPage.expectLoaded();
    });
  });

  test('Adding products increases the cart count', { tag: ['@smoke', '@AC-002.1'] }, async ({ catalogPage }) => {
    await test.step('When I add "Trail Backpack" to the cart', async () => {
      await catalogPage.add('Trail Backpack');
    });
    await test.step('And I add "Water Bottle" to the cart', async () => {
      await catalogPage.add('Water Bottle');
    });
    await test.step('Then the cart count is 2', async () => {
      await expect(catalogPage.cartCount).toHaveText('2');
    });
  });

  test('Removing the last product hides the cart count', { tag: ['@regression', '@AC-002.2'] }, async ({ catalogPage }) => {
    await test.step('Given I have added "Rain Jacket" to the cart', async () => {
      await catalogPage.add('Rain Jacket');
      await expect(catalogPage.cartCount).toHaveText('1');
    });
    await test.step('When I remove "Rain Jacket" from the cart in the catalog', async () => {
      await catalogPage.remove('Rain Jacket');
    });
    await test.step('Then the cart count is hidden', async () => {
      await expect(catalogPage.cartCount).toBeHidden();
    });
  });

  test('Cart lists the selected products and their total', { tag: ['@smoke', '@AC-002.3', '@AC-002.5'] }, async ({ catalogPage, cartPage }) => {
    await test.step('Given I have added "Trail Backpack" to the cart', async () => {
      await catalogPage.add('Trail Backpack');
    });
    await test.step('And I have added "Rain Jacket" to the cart', async () => {
      await catalogPage.add('Rain Jacket');
    });
    await test.step('When I open the cart', async () => {
      await catalogPage.openCart();
      await cartPage.expectLoaded();
    });
    await test.step('Then the cart contains "Trail Backpack" priced "$49.99"', async () => {
      await expect(cartPage.item('Trail Backpack')).toContainText('$49.99');
    });
    await test.step('And the cart contains "Rain Jacket" priced "$89.50"', async () => {
      await expect(cartPage.item('Rain Jacket')).toContainText('$89.50');
    });
    await test.step('And the cart total is "$139.49"', async () => {
      await expect(cartPage.total).toHaveText('Total: $139.49');
    });
  });

  test('Empty cart blocks checkout', { tag: ['@regression', '@AC-002.4'] }, async ({ catalogPage, cartPage }) => {
    await test.step('When I open the cart', async () => {
      await catalogPage.openCart();
      await cartPage.expectLoaded();
    });
    await test.step('Then I see the message "Your cart is empty."', async () => {
      await expect(cartPage.emptyMessage).toBeVisible();
    });
    await test.step('And checkout is disabled', async () => {
      await expect(cartPage.checkout).toBeDisabled();
    });
  });

  test('Cart keeps its items between pages', { tag: ['@regression', '@AC-002.5'] }, async ({ catalogPage, cartPage }) => {
    await test.step('Given I have added "Water Bottle" to the cart', async () => {
      await catalogPage.add('Water Bottle');
    });
    await test.step('When I open the cart', async () => {
      await catalogPage.openCart();
      await cartPage.expectLoaded();
    });
    await test.step('And I go back to the catalog', async () => {
      await cartPage.continueShopping.click();
      await catalogPage.expectLoaded();
    });
    await test.step('Then the cart count is 1', async () => {
      await expect(catalogPage.cartCount).toHaveText('1');
    });
  });
});
