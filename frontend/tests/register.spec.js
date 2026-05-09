import { test, expect } from '@playwright/test';

const API_REGISTER = 'http://localhost:8080/auth/register';

const AUTH_RESPONSE = {
  token: 'eyJhbGci.fake.token',
  nickname: 'NewHero',
  avatarId: 'warrior',
  playerUuid: '22222222-2222-2222-2222-222222222222',
};

function mockRegister(page, { status = 200, body = AUTH_RESPONSE } = {}) {
  return page.route(API_REGISTER, (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  );
}

async function fillValidForm(page) {
  await page.fill('#email', 'newhero@test.com');
  await page.fill('#nickname', 'NewHero');
  await page.fill('#password', 'securepass123');
  await page.fill('#confirmPassword', 'securepass123');
}

test.describe('/register page', () => {
  test('renders form with all four fields, submit and login link', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('h1')).toContainText('3JRPG');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#nickname')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('shows inline error for invalid email', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#email', 'not-an-email');
    await page.fill('#nickname', 'Hero');
    await page.fill('#password', 'securepass123');
    await page.fill('#confirmPassword', 'securepass123');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.locator('.form-field-error').first()).toContainText('valid email');
  });

  test('shows inline error when nickname is too short', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#email', 'hero@test.com');
    await page.fill('#nickname', 'Hi');
    await page.fill('#password', 'securepass123');
    await page.fill('#confirmPassword', 'securepass123');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.locator('#nickname ~ .form-field-error')).toContainText('3–30 characters');
  });

  test('shows inline error when password is too short', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#email', 'hero@test.com');
    await page.fill('#nickname', 'Hero');
    await page.fill('#password', 'short');
    await page.fill('#confirmPassword', 'short');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.locator('#password ~ .form-field-error')).toContainText('at least 8 characters');
  });

  test('shows inline error when passwords do not match', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#email', 'hero@test.com');
    await page.fill('#nickname', 'Hero');
    await page.fill('#password', 'securepass123');
    await page.fill('#confirmPassword', 'differentpass');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.locator('#confirmPassword ~ .form-field-error')).toContainText('do not match');
  });

  test('does not call the API when client validation fails', async ({ page }) => {
    let apiCalled = false;
    await page.route(API_REGISTER, (route) => { apiCalled = true; route.continue(); });

    await page.goto('/register');
    await page.fill('#email', 'bad-email');
    await page.fill('#nickname', 'X');
    await page.fill('#password', 'short');
    await page.fill('#confirmPassword', 'different');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.waitForTimeout(200);
    expect(apiCalled).toBe(false);
  });

  test('redirects to /select after successful registration', async ({ page }) => {
    await mockRegister(page);
    await page.route('http://localhost:8080/**', (route) => route.abort());
    await mockRegister(page);

    await page.goto('/register');
    await fillValidForm(page);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL(/\/select/);
  });

  test('shows error modal when email is already registered (409)', async ({ page }) => {
    await mockRegister(page, {
      status: 409,
      body: { message: 'Email already in use' },
    });

    await page.goto('/register');
    await fillValidForm(page);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.locator('#alert-modal-title')).toContainText('Registration Failed');
    await expect(page.locator('.alert-message')).toContainText('already registered');
  });

  test('Login link navigates to /login', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('submit button is disabled while loading', async ({ page }) => {
    await page.route(API_REGISTER, async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTH_RESPONSE) });
    });

    await page.goto('/register');
    await fillValidForm(page);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByRole('button', { name: /Registering/ })).toBeDisabled();
  });
});
