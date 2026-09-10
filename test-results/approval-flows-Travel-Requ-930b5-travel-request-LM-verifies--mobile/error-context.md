# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: approval-flows.spec.ts >> Travel Request Creation >> Approver creates and submits a travel request (LM verifies)
- Location: e2e\approval-flows.spec.ts:137:3

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
      - button "New Travel Request" [ref=e11]
      - button "Approval Queue" [ref=e15]
      - button "All Travel Requests" [ref=e20]
      - button "Reports" [ref=e25]
  - generic [ref=e29]:
    - banner [ref=e30]:
      - generic [ref=e34]:
        - generic [ref=e35]: Travel Request System
        - generic [aria-hidden] [ref=e36]: Travel Request System
      - generic [ref=e37]:
        - generic [ref=e38]: LZ
        - button [ref=e40]
    - main [ref=e44]:
      - generic [ref=e45]:
        - generic [ref=e46]:
          - generic [ref=e47]:
            - heading "Approver Dashboard" [level=1] [ref=e48]
            - paragraph [ref=e49]: Inception to Date
          - button "Approval Queue 5" [ref=e51]:
            - text: Approval Queue
            - generic [ref=e55]: "5"
        - generic [ref=e56]:
          - generic [ref=e57] [cursor=pointer]:
            - generic [ref=e58]:
              - generic [ref=e59]: ◷
              - text: Pending Queue
            - generic [ref=e60]: "4"
          - generic [ref=e70] [cursor=pointer]:
            - generic [ref=e71]:
              - generic [ref=e72]: ✓
              - text: Approved
            - generic [ref=e73]: "2"
            - generic [ref=e78]: ✓
          - generic [ref=e79] [cursor=pointer]:
            - generic [ref=e80]:
              - generic [ref=e81]: ↶
              - text: Returned
            - generic [ref=e82]: "1"
          - generic [ref=e87] [cursor=pointer]:
            - generic [ref=e88]:
              - generic [ref=e89]: ×
              - text: Declined
            - generic [ref=e90]: "1"
            - generic [ref=e95]: ×
          - generic [ref=e97]:
            - generic [ref=e98]: Total Value
            - generic [ref=e105]: R 26 500
        - generic [ref=e107]:
          - generic [ref=e108]:
            - paragraph [ref=e113]: Team Member Activity
            - generic [ref=e114]:
              - generic [ref=e115]:
                - generic [ref=e117]: Approved
                - generic [ref=e118]: Declined
              - generic [ref=e120]:
                - generic [ref=e121]:
                  - paragraph [ref=e122]: Kabelo Molefe
                  - paragraph [ref=e123]: R 20 500
                - paragraph [ref=e125]: D 0 · I 1
                - paragraph [ref=e127]: D 0 · I 0
              - generic [ref=e129]:
                - generic [ref=e130]:
                  - paragraph [ref=e131]: James van Wyk
                  - paragraph [ref=e132]: R 20 000
                - paragraph [ref=e134]: D 0 · I 0
                - paragraph [ref=e136]: D 0 · I 0
              - generic [ref=e138]:
                - generic [ref=e139]:
                  - paragraph [ref=e140]: Nomvula Dlamini
                  - paragraph [ref=e141]: R 8 400
                - paragraph [ref=e143]: D 1 · I 0
                - paragraph [ref=e145]: D 1 · I 0
          - generic [ref=e146]:
            - paragraph [ref=e153]: Travel Type Distribution
            - generic [ref=e165]:
              - generic [ref=e166]:
                - paragraph [ref=e167]: Domestic
                - paragraph [ref=e168]: 7 · 70%
              - generic [ref=e169]:
                - paragraph [ref=e170]: International
                - paragraph [ref=e171]: 3 · 30%
          - generic [ref=e172]:
            - paragraph [ref=e176]: Overdue 7+ Days
            - generic [ref=e177]:
              - button "TR-2024-0044 Nomvula Dlamini · 677 days Medium" [ref=e178]:
                - generic [ref=e179]:
                  - paragraph [ref=e180]: TR-2024-0044
                  - paragraph [ref=e181]: Nomvula Dlamini · 677 days
                - generic [ref=e182]: Medium
              - button "TR-2024-0045 Kabelo Molefe · 674 days High" [ref=e183]:
                - generic [ref=e184]:
                  - paragraph [ref=e185]: TR-2024-0045
                  - paragraph [ref=e186]: Kabelo Molefe · 674 days
                - generic [ref=e187]: High
              - button "TR-2024-0047 Nomvula Dlamini · 671 days Low" [ref=e188]:
                - generic [ref=e189]:
                  - paragraph [ref=e190]: TR-2024-0047
                  - paragraph [ref=e191]: Nomvula Dlamini · 671 days
                - generic [ref=e192]: Low
              - button "TR-2026-0006 James van Wyk · 82 days High" [ref=e193]:
                - generic [ref=e194]:
                  - paragraph [ref=e195]: TR-2026-0006
                  - paragraph [ref=e196]: James van Wyk · 82 days
                - generic [ref=e197]: High
              - button "TR-2026-0001 Nomvula Dlamini · 74 days Medium" [ref=e198]:
                - generic [ref=e199]:
                  - paragraph [ref=e200]: TR-2026-0001
                  - paragraph [ref=e201]: Nomvula Dlamini · 74 days
                - generic [ref=e202]: Medium
        - generic [ref=e203]:
          - generic [ref=e204]:
            - heading "Department Insights" [level=3] [ref=e205]
            - paragraph [ref=e206]:
              - strong [ref=e207]: "10"
              - text: Total Declarations
          - table [ref=e209]:
            - rowgroup [ref=e210]:
              - row [ref=e211]:
                - columnheader "Department" [ref=e212]
                - columnheader "Declarations" [ref=e213]
                - columnheader "Pending" [ref=e214]
                - columnheader "Approved" [ref=e215]
                - columnheader "Declined" [ref=e216]
                - columnheader "Total Value" [ref=e217]
            - rowgroup [ref=e218]:
              - row [ref=e219]:
                - cell "Sales" [ref=e220]
                - cell "3" [ref=e221]
                - cell "2" [ref=e222]
                - cell "1" [ref=e223]
                - cell "0" [ref=e224]
                - cell "R 40 500" [ref=e225]
              - row [ref=e226]:
                - cell "Marketing" [ref=e227]
                - cell "7" [ref=e228]
                - cell "3" [ref=e229]
                - cell "1" [ref=e230]
                - cell "1" [ref=e231]
                - cell "R 8 400" [ref=e232]
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