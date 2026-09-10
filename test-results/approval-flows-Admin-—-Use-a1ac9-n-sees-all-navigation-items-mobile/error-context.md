# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: approval-flows.spec.ts >> Admin — User Management >> Admin sees all navigation items
- Location: e2e\approval-flows.spec.ts:188:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('aside nav, nav') to be visible
    28 × locator resolved to 2 elements. Proceeding with the first one: <nav class="flex-1 py-5 px-2">…</nav>

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - button "Dashboard" [ref=e6]
      - button "Users" [ref=e11]
      - button "Workflows" [ref=e18]
      - button "Dropdowns" [ref=e22]
      - button "Config" [ref=e25]
      - button "Reports" [ref=e30]
      - button "Approval Options" [ref=e35]
  - generic [ref=e40]:
    - banner [ref=e41]:
      - generic [ref=e45]:
        - generic [ref=e46]: Travel Request System
        - generic [aria-hidden] [ref=e47]: Travel Request System
      - generic [ref=e48]:
        - generic [ref=e49]: AU
        - button [ref=e51]
    - main [ref=e55]:
      - generic [ref=e56]:
        - generic [ref=e57]:
          - generic [ref=e58]:
            - heading "Admin Dashboard" [level=1] [ref=e59]
            - paragraph [ref=e60]: System Management Overview
          - button "Manage Users" [ref=e62]
        - generic [ref=e68]:
          - generic [ref=e69] [cursor=pointer]:
            - generic [ref=e70]: Total Users
            - generic [ref=e77]: "7"
          - generic [ref=e79] [cursor=pointer]:
            - generic [ref=e80]: Active Workflows
            - generic [ref=e84]: "2"
          - generic [ref=e86] [cursor=pointer]:
            - generic [ref=e87]: Travel Requests
            - generic [ref=e92]: "10"
          - generic [ref=e94]:
            - generic [ref=e95]: Value Threshold
            - generic [ref=e99]: R5000
        - generic [ref=e101]:
          - generic [ref=e102]:
            - generic [ref=e104]:
              - paragraph [ref=e105]: Quick Links
              - heading "Admin Tools" [level=3] [ref=e106]
            - generic [ref=e107]:
              - generic [ref=e108] [cursor=pointer]:
                - generic [ref=e109]:
                  - paragraph [ref=e110]: User Management
                  - paragraph [ref=e111]: Add, edit, or remove system users and roles.
                - button "Manage" [ref=e112]
              - generic [ref=e113] [cursor=pointer]:
                - generic [ref=e114]:
                  - paragraph [ref=e115]: Workflow Config
                  - paragraph [ref=e116]: Setup conditional routing and approver tiers.
                - button "Manage" [ref=e117]
              - generic [ref=e118] [cursor=pointer]:
                - generic [ref=e119]:
                  - paragraph [ref=e120]: Dropdown Data
                  - paragraph [ref=e121]: Manage travel types, departments, and companies.
                - button "Manage" [ref=e122]
              - generic [ref=e123] [cursor=pointer]:
                - generic [ref=e124]:
                  - paragraph [ref=e125]: System Config
                  - paragraph [ref=e126]: Update compliance thresholds and configuration.
                - button "Manage" [ref=e127]
          - generic [ref=e128]:
            - heading "System Healthy" [level=3] [ref=e132]
            - paragraph [ref=e133]: All services are running normally. 7 users and 10 travel requests in the system.
```

# Test source

```ts
  1   | import { expect, type Page } from "@playwright/test";
  2   | 
  3   | export const USERS = {
  4   |   nomvula:  { email: "nomvula@hb.co.za",  role: "teamMember", name: "Nomvula Dlamini" },
  5   |   sipho:    { email: "sipho@hb.co.za",    role: "approver",   name: "Sipho Nkosi" },
  6   |   lindiwe:  { email: "lindiwe@hb.co.za",  role: "approver",   name: "Lindiwe Zulu" },
  7   |   sandile:  { email: "sandile@hb.co.za",  role: "approver",   name: "Sandile Shabalala" },
  8   |   admin:    { email: "admin@hb.co.za",    role: "admin",      name: "Admin User" },
  9   | };
  10  | 
  11  | export const LOGIN_INDEX: Record<string, number> = {
  12  |   "nomvula@hb.co.za": 0,
  13  |   "sipho@hb.co.za": 1,
  14  |   "kabelo@npn.co.za": 2,
  15  |   "james@npn.co.za": 3,
  16  |   "lindiwe@hb.co.za": 4,
  17  |   "aisha@npn.co.za": 5,
  18  |   "admin@hb.co.za": 6,
  19  | };
  20  | 
  21  | export async function login(page: Page, email: string) {
  22  |   await page.goto("/");
  23  |   await page.waitForSelector("select", { timeout: 10000 });
  24  |   await page.selectOption("select", String(LOGIN_INDEX[email]));
  25  |   await page.click('button[type="submit"]');
  26  |   // Desktop renders the sidebar inside <aside>; mobile renders the compact
  27  |   // navigation as a top-level <nav>.
> 28  |   await page.waitForSelector("aside nav, nav", { timeout: 15000 });
      |              ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  29  | }
  30  | 
  31  | export async function clickSidebar(page: Page, label: string) {
  32  |   await page.locator(`aside nav button:has-text("${label}"):visible, nav button:has-text("${label}"):visible`).first().click();
  33  | }
  34  | 
  35  | export class AppPage {
  36  |   constructor(public page: Page) {}
  37  | 
  38  |   async open() {
  39  |     await this.page.goto("/");
  40  |     await this.page.waitForSelector("select", { timeout: 10000 });
  41  |   }
  42  | 
  43  |   async login(email: string) {
  44  |     await login(this.page, email);
  45  |   }
  46  | 
  47  |   async sidebar(label: string) {
  48  |     await clickSidebar(this.page, label);
  49  |   }
  50  | 
  51  |   async search(id: string) {
  52  |     const input = this.page.locator('input[placeholder*="ID,"]');
  53  |     if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
  54  |       await input.fill(id);
  55  |       await this.page.waitForTimeout(400);
  56  |     }
  57  |   }
  58  | 
  59  |   async clickReviewFor(id: string) {
  60  |     await this.search(id);
  61  |     await this.page.locator(`table tr:has(td:has-text("${id}")) button:has-text('Review')`).first().click();
  62  |   }
  63  | 
  64  |   async pickDecision(label: string) {
  65  |     await this.page
  66  |       .locator(`label:has-text("${label}")`)
  67  |       .first()
  68  |       .click();
  69  |     await this.page.waitForTimeout(300);
  70  |   }
  71  | 
  72  |   async submitDecision() {
  73  |     await this.page.click('button:has-text("Submit Decision")');
  74  |     await this.page.getByText("Decision submitted", { timeout: 10000 }).waitFor();
  75  |   }
  76  | 
  77  |   async verifyStatus(declarationId: string, status: string) {
  78  |     await this.sidebar("All Travel Requests");
  79  |     await this.page.getByRole("button", { name: "All", exact: true }).click();
  80  | 
  81  |     await this.search(declarationId);
  82  |     await expect(this.page.locator(`table td:has-text("${declarationId}")`).first()).toBeVisible({ timeout: 10000 });
  83  |     await expect(this.page.locator(`table td span:has-text("${status}")`).first()).toBeVisible({ timeout: 10000 });
  84  |   }
  85  | 
  86  |   async assertVisible(selector: string, timeoutOrOpts: number | { timeout?: number } = 10000, timeout = 10000) {
  87  |     const effective = typeof timeoutOrOpts === "number" ? timeoutOrOpts : timeoutOrOpts.timeout ?? timeout;
  88  |     const isCss = /[.#[\]:>+]/.test(selector) || /^(table|button|aside|nav|input|h1|h2|span|div|p|a)\b/.test(selector);
  89  |     const target = isCss ? this.page.locator(selector) : this.page.getByText(selector);
  90  |     await expect(target.first()).toBeVisible({ timeout: effective });
  91  |   }
  92  | }
  93  | 
  94  | export class NewDeclarationPage {
  95  |   constructor(public page: Page) {}
  96  | 
  97  |   async open() {
  98  |     await this.page.click('button:has-text("New Travel Request")');
  99  |   }
  100 | 
  101 |   async autoFilled(teamMember: string, manager: string) {
  102 |     await expect(this.page.getByText("New Travel Request").first()).toBeVisible({ timeout: 10000 });
  103 |     await expect(this.page.getByText("Traveler 1")).toBeVisible({ timeout: 10000 });
  104 |     await expect(this.page.locator('input[placeholder="Order number (if known)"]')).toBeVisible();
  105 |     void teamMember;
  106 |     void manager;
  107 |   }
  108 | 
  109 |   async fillTraveler(name: string, idDoc: string, email: string, cell: string) {
  110 |     await this.page.locator('input[placeholder="Full name"]').fill(name);
  111 |     await this.page.locator('input[placeholder="ID or passport number"]').fill(idDoc);
  112 |     await this.page.locator('input[placeholder="name@company.co.za"]').fill(email);
  113 |     await this.page.locator('input[placeholder="082 000 0000"]').fill(cell);
  114 |   }
  115 | 
  116 |   async itinerary(destination: string, reason: string, from: string, to: string, departure: string, ret: string) {
  117 |     await this.page.locator('input[placeholder="Destination"]').fill(destination);
  118 |     await this.page.locator('input[placeholder="Purpose of the trip"]').fill(reason);
  119 |     await this.page.locator('input[placeholder="Departure city"]').fill(from);
  120 |     await this.page.locator('input[placeholder="Destination city"]').fill(to);
  121 |     const dates = this.page.locator('input[type="date"]');
  122 |     await dates.nth(0).fill(departure);
  123 |     await dates.nth(1).fill(ret);
  124 |   }
  125 | 
  126 |   async agree() {
  127 |     const boxes = this.page.getByRole("checkbox");
  128 |     await boxes.last().check();
```