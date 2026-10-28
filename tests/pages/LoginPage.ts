import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly notice: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: 'Log in' });
    this.error = page.getByRole('alert');
    this.notice = page.getByRole('status');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async logIn(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(index\.html)?(\?.*)?$/);
    await expect(this.submit).toBeVisible();
  }
}
