import { test, expect } from "@playwright/test";
import { USERS, LOGIN_INDEX, AppPage, NewDeclarationPage } from "./common-helpers";

test.beforeEach(async ({ context }) => {
  // Fresh browser context per test already isolates storage; only drop auth
  // keys here so mid-test re-logins keep seeded + created travel requests.
  await context.addInitScript(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("ghe.auth."))
        .forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  });
});

test.describe("Approval Workflow — Full Flow", () => {
  test("Full approval: LM → HR (high-value)", async ({ page }) => {
    const app = new AppPage(page);
    const declId = "TR-2024-0047";

    await app.login(USERS.sipho.email);
    await app.sidebar("Approval Queue");
    await app.clickReviewFor(declId);
    await app.pickDecision("Approved");
    await app.submitDecision();

    await app.login(USERS.lindiwe.email);
    await app.sidebar("Approval Queue");
    await app.clickReviewFor(declId);
    await app.pickDecision("Approved");
    await app.submitDecision();

    await app.verifyStatus(declId, "Approved");
  });

  test("Rejection at HR step", async ({ page }) => {
    const app = new AppPage(page);
    const declId = "TR-2024-0045";

    await app.login(USERS.sipho.email);
    await app.sidebar("Approval Queue");
    await app.clickReviewFor(declId);
    await app.pickDecision("Approved");
    await app.submitDecision();

    await app.login(USERS.lindiwe.email);
    await app.sidebar("Approval Queue");
    await app.clickReviewFor(declId);
    await app.pickDecision("Declined");
    await app.submitDecision();

    await app.verifyStatus(declId, "Declined");
  });

  test("Return at HR step → resubmit → full approval", async ({ page }) => {
    const app = new AppPage(page);
    const declId = "TR-2024-0044";

    await app.login(USERS.sipho.email);
    await app.sidebar("Approval Queue");
    await app.clickReviewFor(declId);
    await app.pickDecision("Approved");
    await app.submitDecision();

    await app.login(USERS.lindiwe.email);
    await app.sidebar("Approval Queue");
    await app.clickReviewFor(declId);
    await app.pickDecision("Return");
    await app.submitDecision();

    await app.verifyStatus(declId, "Returned");

    // Team member resubmits the returned request via Edit & Resubmit
    await app.login(USERS.nomvula.email);
    await app.sidebar("My Travel Requests");
    await app.search(declId);
    await app.page.getByRole("button", { name: "Edit & Resubmit" }).click();

    const declPage = new NewDeclarationPage(page);
    await declPage.agree();
    await declPage.submit();

    await app.login(USERS.sipho.email);
    await app.sidebar("Approval Queue");
    await app.clickReviewFor(declId);
    await app.pickDecision("Approved");
    await app.submitDecision();

    await app.login(USERS.lindiwe.email);
    await app.sidebar("Approval Queue");
    await app.clickReviewFor(declId);
    await app.pickDecision("Approved");
    await app.submitDecision();

    await app.verifyStatus(declId, "Approved");
  });

  test("Team member views approved declaration timeline", async ({ page }) => {
    const app = new AppPage(page);

    await app.login(USERS.nomvula.email);
    await app.sidebar("My Travel Requests");
    await app.search("TR-2025-0009");

    await app.page.locator("table button:has-text('View')").first().click();
    await app.page.waitForLoadState("networkidle");

    await app.assertVisible("Approval Workflow");
    await app.assertVisible("Approved");
  });
});

test.describe("Travel Request Creation", () => {
  test("Team member creates and submits a travel request", async ({ page }) => {
    const app = new AppPage(page);
    const decl = new NewDeclarationPage(page);

    await app.login(USERS.nomvula.email);
    await app.sidebar("New Travel Request");
    await decl.autoFilled(USERS.nomvula.name, USERS.sipho.name);
    await decl.fillTraveler("Nomvula Dlamini", "9001015800083", "nomvula@hb.co.za", "0821234567");
    await decl.itinerary("Cape Town", "E2E test travel for automated testing", "Durban", "Cape Town", "2026-07-15", "2026-07-18");
    await decl.agree();
    await decl.submit();

    const declId = await decl.getId();
    expect(declId).toBeTruthy();
    await decl.closeModal();

    await app.login(USERS.sipho.email);
    await app.sidebar("Approval Queue");
    await app.search(declId);
    await app.assertVisible(`table td:has-text("${declId}")`);
    await app.assertVisible(`table td span:has-text("Pending")`);
  });

  test("Approver creates and submits a travel request (LM verifies)", async ({ page }) => {
    const app = new AppPage(page);
    const decl = new NewDeclarationPage(page);

    await app.login(USERS.lindiwe.email);
    await app.sidebar("New Travel Request");
    await decl.autoFilled(USERS.lindiwe.name, USERS.sipho.name);
    await decl.fillTraveler("Lindiwe Zulu", "8505055800084", "lindiwe@hb.co.za", "0831234567");
    await decl.itinerary("Johannesburg", "E2E test travel for approver flow", "Durban", "Johannesburg", "2026-07-15", "2026-07-18");
    await decl.agree();
    await decl.submit();

    const declId = await decl.getId();
    expect(declId).toBeTruthy();
    await decl.closeModal();

    await app.login(USERS.lindiwe.email);
    await app.sidebar("Approval Queue");
    await app.search(declId);
    await app.assertVisible(`table td:has-text("${declId}")`);
    await app.assertVisible(`table td span:has-text("Pending")`);
  });
});

test.describe("Admin — User Management", () => {
  test("Admin creates a new user", async ({ page }) => {
    const app = new AppPage(page);

    await app.login(USERS.admin.email);
    await app.sidebar("Users");

    const ts = Date.now();
    const userName = `E2E User ${ts}`;
    const userEmail = `e2e-${ts}@hb.co.za`;

    page.on("dialog", async (dialog) => {
      const msg = dialog.message();
      if (msg.startsWith("User name")) await dialog.accept(userName);
      else if (msg.startsWith("Email")) await dialog.accept(userEmail);
      else if (msg.startsWith("Role")) await dialog.accept("approver");
      else if (msg.startsWith("Department")) await dialog.accept("Marketing");
      else await dialog.dismiss();
    });

    await app.page.getByRole("button", { name: "Add User" }).click();
    await app.page.waitForTimeout(1500);

    await app.assertVisible(`table td:has-text("${userName}")`);
    await app.assertVisible(`table td:has-text("${userEmail}")`);
  });

  test("Admin sees all navigation items", async ({ page }) => {
    const app = new AppPage(page);

    await app.login(USERS.admin.email);
    await app.sidebar("Dashboard");

    await app.assertVisible('aside nav button:has-text("Dashboard")');
    await app.assertVisible('aside nav button:has-text("Users")');
    await app.assertVisible('aside nav button:has-text("Workflows")');
    await app.assertVisible('aside nav button:has-text("Dropdowns")');
    await app.assertVisible('aside nav button:has-text("Config")');
    await app.assertVisible('aside nav button:has-text("Reports")');
  });
});

test.describe("Dashboard", () => {
  test("Approver dashboard shows KPIs", async ({ page }) => {
    const app = new AppPage(page);

    await app.login(USERS.sipho.email);
    await app.sidebar("Dashboard");

    await app.assertVisible("Approver Dashboard");
    await app.assertVisible("Pending Queue");
  });
});

test.describe("Reports", () => {
  test("Admin accesses reports", async ({ page }) => {
    const app = new AppPage(page);

    await app.login(USERS.admin.email);
    await app.sidebar("Reports");

    await app.assertVisible("Reports", { timeout: 5000 });
  });

  test("Approver can generate status breakdown report", async ({ page }) => {
    const app = new AppPage(page);

    await app.login(USERS.sipho.email);
    await app.sidebar("Reports");

    await app.assertVisible("Status Breakdown", { timeout: 5000 });
  });
});

test.describe("Dashboard — Admin", () => {
  test("Admin visits Dashboard page", async ({ page }) => {
    const app = new AppPage(page);

    await app.login(USERS.admin.email);
    await app.sidebar("Dashboard");

    await app.assertVisible("h1:has-text('Admin'), h1:has-text('Dashboard')");
  });
});

test.describe("Workflow — Admin Management", () => {
  test("Admin manages workflow rules", async ({ page }) => {
    const app = new AppPage(page);

    await app.login(USERS.admin.email);
    await app.sidebar("Workflows");

    await app.assertVisible("Approval Workflow", { timeout: 5000 });
  });
});

test.describe("Edge Cases & Error Handling", () => {
  test("Team member can view My Declarations tab", async ({ page }) => {
    const app = new AppPage(page);

    await app.login(USERS.nomvula.email);
    await app.sidebar("My Travel Requests");

    await app.assertVisible("My Travel Requests", { timeout: 5000 });
    await app.assertVisible("table");
  });

  test("New travel request form renders traveler and itinerary fields", async ({ page }) => {
    const app = new AppPage(page);
    const decl = new NewDeclarationPage(page);

    await app.login(USERS.nomvula.email);
    await app.sidebar("New Travel Request");
    await decl.autoFilled(USERS.nomvula.name, USERS.sipho.name);
  });

  test("Approver dashboard has Approval Queue link", async ({ page }) => {
    const app = new AppPage(page);

    await app.login(USERS.sipho.email);
    await app.sidebar("Dashboard");

    await app.assertVisible('button:has-text("Approval Queue")');
  });
});
