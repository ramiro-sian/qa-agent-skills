import { expect, type Locator, type Page } from '@playwright/test';

export class CartPage {
  readonly heading: Locator;
  readonly items: Locator;
  readonly total: Locator;
  readonly checkout: Locator;
  readonly continueShopping: Locator;
  readonly emptyMessage: Locator;

  constructor(private readonly page: Page) {
    this.emptyMessage = page.getByText('Your cart is empty.');
    this.heading = page.getByRole('heading', { name: 'Your cart' });
    this.items = page.getByRole('listitem');
    this.total = page.getByTestId('cart-total');
    this.checkout = page.getByRole('button', { name: 'Checkout' });
    this.continueShopping = page.getByRole('link', { name: 'Continue shopping' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  item(product: string): Locator {
    return this.items.filter({ hasText: product });
  }
}
