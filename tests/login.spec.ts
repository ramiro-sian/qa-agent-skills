// Implements features/login.feature. Each test.step mirrors a Gherkin step word for word;
// `npm run validate` fails if the two drift apart.
import { expect, test } from './fixtures';

const rejectedLogins = [
  { case: 'wrong password', email: 'qa.user@example.com', password: 'Wrong123!', message: 'Email or password is incorrect.' },
  { case: 'unknown email', email: 'nobody@example.com', password: 'Passw0rd!', message: 'Email or password is incorrect.' },
  { case: 'locked account', email: 'locked.user@example.com', password: 'Passw0rd!', message: 'This account is locked. Contact support.' },
  { case: 'missing email', email: '', password: 'Passw0rd!', message: 'Email is required.' },
  { case: 'missing password', email: 'qa.user@example.com', password: '', message: 'Password is required.' },
];

test.describe('Feature: Customer login', { tag: '@REQ-001' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await test.step('Given I am on the login page', async () => {
      await loginPage.goto();
    });
  });

  test('Customer logs in with valid credentials', { tag: ['@smoke', '@AC-001.1'] }, async ({ loginPage, catalogPage }) => {
    await test.step('When I log in as "qa.user@example.com" with password "Passw0rd!"', async () => {
      await loginPage.logIn('qa.user@example.com', 'Passw0rd!');
    });
    await test.step('Then I see the product catalog', async () => {
      await catalogPage.expectLoaded();
    });
  });

  for (const row of rejectedLogins) {
    test(`Login is rejected with a clear message: ${row.case}`, { tag: ['@regression', '@AC-001.2', '@AC-001.3', '@AC-001.4'] }, async ({ loginPage }) => {
      await test.step(`When I log in as "${row.email}" with password "${row.password}"`, async () => {
        await loginPage.logIn(row.email, row.password);
      });
      await test.step(`Then I see the login error "${row.message}"`, async () => {
        await expect(loginPage.error).toHaveText(row.message);
      });
      await test.step('And I remain on the login page', async () => {
        await loginPage.expectLoaded();
      });
    });
  }

  test('Visitor without a session is sent to the login page', { tag: ['@regression', '@AC-001.5'] }, async ({ loginPage, catalogPage }) => {
    await test.step('When I open the product catalog without logging in', async () => {
      await catalogPage.goto();
    });
    await test.step('Then I am on the login page', async () => {
      await loginPage.expectLoaded();
    });
    await test.step('And I see the notice "Please log in to continue."', async () => {
      await expect(loginPage.notice).toHaveText('Please log in to continue.');
    });
  });

  test('Customer logs out and loses access to the catalog', { tag: ['@smoke', '@AC-001.6'] }, async ({ loginPage, catalogPage }) => {
    await test.step('Given I am logged in as "qa.user@example.com" with password "Passw0rd!"', async () => {
      await loginPage.logIn('qa.user@example.com', 'Passw0rd!');
      await catalogPage.expectLoaded();
    });
    await test.step('When I log out', async () => {
      await catalogPage.logOut();
    });
    await test.step('Then I am on the login page', async () => {
      await loginPage.expectLoaded();
    });
    await test.step('And I cannot open the product catalog without logging in again', async () => {
      await catalogPage.goto();
      await loginPage.expectLoaded();
      await expect(loginPage.notice).toHaveText('Please log in to continue.');
    });
  });
});
