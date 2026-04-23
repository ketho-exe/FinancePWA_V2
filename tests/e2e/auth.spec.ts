import { expect, test } from "@playwright/test";

test("redirects unauthenticated users from dashboard to login", async ({
  page,
  baseURL
}) => {
  const appUrl = baseURL ?? "http://127.0.0.1:3000";

  await page.goto(`${appUrl}/dashboard`);

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("main")).toContainText("Login");
});
