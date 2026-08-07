import { test, expect } from "@playwright/test";

test.describe("anonymous link creation flow", () => {
  test("create a link, see it in the success card, open its stats, and follow the redirect", async ({ page }) => {
    const targetUrl = `https://example.com/e2e-target-${Date.now()}`;

    await page.goto("/");
    await page.getByLabel("Ссылка").fill(targetUrl);
    await page.getByRole("button", { name: "Сократить ссылку" }).click();

    const shortLink = page.locator('a[target="_blank"]');
    await expect(shortLink).toBeVisible();
    const shareUrl = await shortLink.getAttribute("href");
    expect(shareUrl).toBeTruthy();

    await expect(page.getByText(targetUrl)).toBeVisible();

    await page.getByRole("button", { name: "Смотреть статистику" }).click();
    await expect(page).toHaveURL(/\/s\//);
    await expect(page.getByText("Активна")).toBeVisible();

    const totalClicksCard = page.getByText("Всего переходов").locator("..");
    await expect(totalClicksCard.getByText("0", { exact: true })).toBeVisible();

    const response = await page.request.get(shareUrl as string, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toBe(targetUrl);
  });
});
