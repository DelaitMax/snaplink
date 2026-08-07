import { test, expect } from "@playwright/test";

test.describe("registration and protected routes", () => {
  test("registering logs the user in and unlocks /my-links", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = "correct-horse-battery-staple";

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Пароль").fill(password);
    await page.getByRole("button", { name: "Зарегистрироваться" }).click();

    await expect(page).toHaveURL(/\/my-links$/);
    await expect(page.getByRole("heading", { name: "Мои ссылки" })).toBeVisible();

    await page.goto("/my-links");
    await expect(page).toHaveURL(/\/my-links$/);
    await expect(page.getByRole("heading", { name: "Мои ссылки" })).toBeVisible();
  });

  test("visiting a protected route while logged out redirects to /login", async ({ page }) => {
    await page.goto("/my-links");
    await expect(page).toHaveURL(/\/login/);
  });
});
