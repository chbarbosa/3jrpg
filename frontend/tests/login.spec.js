import { test, expect } from '@playwright/test';

const API_LOGIN = 'http://localhost:8080/auth/login';

const AUTH_RESPONSE = {
  token: 'eyJhbGci.fake.token',
  nickname: 'Hero',
  avatarId: 'warrior',
  playerUuid: '11111111-1111-1111-1111-111111111111',
};

function mockLogin(page, { status = 200, body = AUTH_RESPONSE } = {}) {
  return page.route(API_LOGIN, (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  );
}

test.describe('/login page', () => {
  test('renders form with email, password, submit and register link', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('3JRPG');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('shows error modal when credentials are rejected by server', async ({ page }) => {
    await mockLogin(page, {
      status: 401,
      body: { message: 'Invalid credentials' },
    });

    await page.goto('/login');
    await page.fill('#email', 'wrong@test.com');
    await page.fill('#password', 'badpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('#alert-modal-title')).toContainText('Login Failed');
    await expect(page.locator('.alert-message')).toContainText('Invalid credentials');
  });

  test('shows generic error message when server returns no message', async ({ page }) => {
    await mockLogin(page, { status: 401, body: {} });

    await page.goto('/login');
    await page.fill('#email', 'x@test.com');
    await page.fill('#password', 'anypassword');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('.alert-message')).toContainText('Login failed. Please check your credentials.');
  });

  test('redirects to /select after successful login', async ({ page }) => {
    await mockLogin(page);
    // Network errors on subsequent API calls (active run, etc.) are caught by the app
    await page.route('http://localhost:8080/**', (route) => route.abort());
    await mockLogin(page);

    await page.goto('/login');
    await page.fill('#email', 'hero@test.com');
    await page.fill('#password', 'securepass123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/select/);
  });

  test('Register link navigates to /register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('submit button is disabled while loading', async ({ page }) => {
    await page.route(API_LOGIN, async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTH_RESPONSE) });
    });

    await page.goto('/login');
    await page.fill('#email', 'hero@test.com');
    await page.fill('#password', 'securepass123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('button', { name: /Logging in/ })).toBeDisabled();
  });
});
