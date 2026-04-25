import { expect, test as playwrightTest } from "@playwright/test";

if (!process.env.VITEST) {
  playwrightTest("redirects unauthenticated users to login", async ({
    page,
    baseURL
  }) => {
    const appUrl = baseURL ?? "http://127.0.0.1:3000";

    await page.goto(`${appUrl}/dashboard`);

    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole("main")).toContainText("Login");
  });
} else {
  globalThis.test?.skip?.(
    "Playwright auth journey runs in the E2E suite",
    () => {}
  );
}
