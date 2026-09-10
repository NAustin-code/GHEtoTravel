import { test, expect } from "@playwright/test";
import { USERS, login } from "./common-helpers";

test.describe("Mobile interactions", () => {
  test.skip(({ isMobile }) => !isMobile, "Runs in the mobile Playwright project");

  test("team member can open the travel request form and see usable controls", async ({ page }) => {
    await login(page, USERS.nomvula.email);
    await page.getByRole("button", { name: "New Travel Request" }).click();
    await expect(page.getByText(/New Travel Request/i).first()).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "Submit Travel Request" })).toBeVisible();
  });

  test("mobile sidebar remains usable for an approver", async ({ page }) => {
    await login(page, USERS.sipho.email);
    await expect(page.locator("aside")).toBeVisible();
    await page.getByRole("button", { name: "Approval Queue" }).click();
    await expect(page.getByText(/Approval Queue/i).first()).toBeVisible();
  });
});
