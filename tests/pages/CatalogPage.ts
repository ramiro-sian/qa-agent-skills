import { expect, type Locator, type Page } from '@playwright/test';

export class CatalogPage {
  readonly heading: Locator;
  readonly cartCount: Locator;
  readonly cartLink: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Products' });
    this.cartCount = page.getByTestId('cart-count');
    this.cartLink = page.getByRole('link', { name: /Cart/ });
    this.logoutButton = page.getByRole('button', { name: 'Log out' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/catalog.html');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/catalog\.html$/);
    await expect(this.heading).toBeVisible();
  }

  async add(product: string): Promise<void> {
    await this.page.getByRole('button', { name: `Add ${product} to cart` }).click();
    await expect(this.page.getByRole('button', { name: `Remove ${product} from cart` })).toBeVisible();
  }

  async remove(product: string): Promise<void> {
    await this.page.getByRole('button', { name: `Remove ${product} from cart` }).click();
    await expect(this.page.getByRole('button', { name: `Add ${product} to cart` })).toBeVisible();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async logOut(): Promise<void> {
    await this.logoutButton.click();
  }
}
