# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-interactions.spec.ts >> Mobile interactions >> team member can open the travel request form and see usable controls
- Location: e2e\mobile-interactions.spec.ts:7:3

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
      - button "New Travel Request" [ref=e6]
      - button "My Travel Requests" [ref=e10]
  - generic [ref=e15]:
    - banner [ref=e16]:
      - generic [ref=e20]:
        - generic [ref=e21]: Travel Request System
        - generic [aria-hidden] [ref=e22]: Travel Request System
      - generic [ref=e23]:
        - generic [ref=e24]: ND
        - button [ref=e26]
    - main [ref=e30]:
      - generic [ref=e31]:
        - generic [ref=e32]:
          - heading "New Travel Request" [level=2] [ref=e33]
          - paragraph [ref=e34]: Capture traveler details, travel itinerary, transport and accommodation for approval.
        - generic [ref=e35]:
          - generic [ref=e36]:
            - generic [ref=e37]: "1"
            - heading "Traveler Details" [level=3] [ref=e38]
          - generic [ref=e39]:
            - generic [ref=e40]:
              - generic [ref=e41]:
                - generic [ref=e43]:
                  - generic [ref=e44]: Number of People Travelling
                  - generic [aria-hidden] [ref=e45]: "*"
                - combobox [ref=e46]:
                  - generic: "1"
                - combobox [aria-hidden] [ref=e47]
              - generic [ref=e48]:
                - generic [ref=e49]: Company
                - textbox "Company traveler falls under" [ref=e52]: Hollywoodbets Group
              - generic [ref=e53]:
                - generic [ref=e54]: Company To Be Billed
                - combobox [ref=e57]:
                  - generic: Select company
                - combobox [aria-hidden] [ref=e58]
              - generic [ref=e59]:
                - generic [ref=e60]: Department Team Member Falls Under
                - combobox "e.g. Finance" [ref=e63]
              - generic [ref=e64]:
                - generic [ref=e65]: Name of Approval Manager
                - textbox "Approving manager" [ref=e68]: Sipho Nkosi
              - generic [ref=e69]:
                - generic [ref=e70]: Order Number
                - textbox "Order number (if known)" [ref=e73]
            - generic [ref=e75]:
              - paragraph [ref=e76]: Traveler 1
              - generic [ref=e77]:
                - generic [ref=e78]:
                  - generic [ref=e80]:
                    - generic [ref=e81]: Name (As Per ID/Passport)
                    - generic [aria-hidden] [ref=e82]: "*"
                  - textbox "Full name" [ref=e83]
                - generic [ref=e84]:
                  - generic [ref=e86]:
                    - generic [ref=e87]: ID / Passport No
                    - generic [aria-hidden] [ref=e88]: "*"
                  - textbox "ID or passport number" [ref=e89]
                - generic [ref=e90]:
                  - generic [ref=e91]: Gender
                  - combobox [ref=e94]:
                    - generic: Male
                  - combobox [aria-hidden] [ref=e95]
                - generic [ref=e96]:
                  - generic [ref=e98]:
                    - generic [ref=e99]: Email Address
                    - generic [aria-hidden] [ref=e100]: "*"
                  - textbox "name@company.co.za" [ref=e101]
                - generic [ref=e102]:
                  - generic [ref=e104]:
                    - generic [ref=e105]: Cell Number
                    - generic [aria-hidden] [ref=e106]: "*"
                  - textbox "082 000 0000" [ref=e107]
                - generic [ref=e108]:
                  - generic [ref=e109]: Job Title
                  - textbox "Job title" [ref=e112]
                - generic [ref=e113]:
                  - generic [ref=e114]: Employee Code
                  - textbox "Employee code" [ref=e117]
        - generic [ref=e118]:
          - generic [ref=e119]:
            - generic [ref=e120]: "2"
            - heading "Travel Details" [level=3] [ref=e121]
          - generic [ref=e123]:
            - generic [ref=e124]:
              - generic [ref=e126]:
                - generic [ref=e127]: Date Of Departure
                - generic [aria-hidden] [ref=e128]: "*"
              - textbox [ref=e129]
            - generic [ref=e130]:
              - generic [ref=e132]:
                - generic [ref=e133]: Date Of Return
                - generic [aria-hidden] [ref=e134]: "*"
              - textbox [ref=e135]
            - generic [ref=e136]:
              - generic [ref=e138]:
                - generic [ref=e139]: Travel Type
                - generic [aria-hidden] [ref=e140]: "*"
              - combobox [ref=e141]:
                - generic: Domestic
              - combobox [aria-hidden] [ref=e142]
            - generic [ref=e143]:
              - generic [ref=e145]:
                - generic [ref=e146]: Reason For Travel
                - generic [aria-hidden] [ref=e147]: "*"
              - textbox "Purpose of the trip" [ref=e148]
            - generic [ref=e149]:
              - generic [ref=e150]: Where Are You Traveling From
              - textbox "Departure city" [ref=e153]
            - generic [ref=e154]:
              - generic [ref=e155]: Where Are You Traveling To
              - textbox "Destination city" [ref=e158]
            - generic [ref=e159]:
              - generic [ref=e161]:
                - generic [ref=e162]: Destination
                - generic [aria-hidden] [ref=e163]: "*"
              - textbox "Destination" [ref=e164]
            - generic [ref=e165]:
              - generic [ref=e166]: Mode Of Transport
              - combobox [ref=e169]:
                - generic: None
              - combobox [aria-hidden] [ref=e170]
            - generic [ref=e171]:
              - generic [ref=e172]: Transport Details
              - textbox "Flight / bus details" [ref=e175]
            - generic [ref=e176]:
              - generic [ref=e177]: Flight Cost (R)
              - spinbutton "0" [ref=e180]
            - generic [ref=e181]:
              - generic [ref=e182]: Seat Preference
              - combobox [ref=e185]:
                - generic: Aisle
              - combobox [aria-hidden] [ref=e186]
            - generic [ref=e187]:
              - generic [ref=e188]: Is this your first time flying?
              - combobox [ref=e191]:
                - generic: "No"
              - combobox [aria-hidden] [ref=e192]
            - generic [ref=e193]:
              - checkbox "Enter Traveller's Details" [ref=e194]
              - generic [ref=e195]: Enter Traveller's Details
        - generic [ref=e196]:
          - generic [ref=e197]:
            - generic [ref=e198]: "3"
            - heading "Accommodation & Transport" [level=3] [ref=e199]
          - generic [ref=e201]:
            - generic [ref=e202]:
              - generic [ref=e203]: Car Hire Required
              - combobox [ref=e206]:
                - generic: "No"
              - combobox [aria-hidden] [ref=e207]
            - generic [ref=e208]:
              - generic [ref=e209]: Car Hire Details
              - textbox "Car hire requirements" [ref=e212]
            - generic [ref=e213]:
              - generic [ref=e214]: Accommodation Required
              - combobox [ref=e217]:
                - generic: "No"
              - combobox [aria-hidden] [ref=e218]
            - generic [ref=e219]:
              - generic [ref=e220]: Accommodation Cost (R)
              - spinbutton "0" [ref=e223]
            - generic [ref=e224]:
              - generic [ref=e225]: Accommodation Details
              - textbox "Hotel / guesthouse details" [ref=e228]
        - generic [ref=e229]:
          - generic [ref=e230]:
            - generic [ref=e231]: "4"
            - heading "Supporting Documents" [level=3] [ref=e232]
          - generic [ref=e233]:
            - generic [ref=e234]:
              - generic [ref=e235]: Attach supporting documents
              - paragraph [ref=e237]: Quotes, itineraries or invoices. PDF, PNG, JPG or DOCX up to 20 MB each.
            - generic [ref=e238] [cursor=pointer]:
              - text: Click to upload or drag files here
              - button "Click to upload or drag files here" [ref=e242]
        - generic [ref=e243]:
          - generic [ref=e244]:
            - generic [ref=e245]: "5"
            - heading "Travel Declaration & Undertaking" [level=3] [ref=e246]
          - generic [ref=e247]:
            - list [ref=e248]:
              - listitem [ref=e249]: I confirm that the travel details provided are true and correct.
              - listitem [ref=e250]: I understand that travel bookings must follow company policy and approved budgets.
              - listitem [ref=e251]: I agree to submit proof of travel and receipts where required.
            - generic [ref=e252] [cursor=pointer]:
              - checkbox "I confirm the information above is correct and I accept the travel policy conditions. *" [ref=e253]
              - generic [ref=e254]: I confirm the information above is correct and I accept the travel policy conditions. *
        - generic [ref=e255]:
          - button "Save Draft" [ref=e256]
          - button "Submit Travel Request" [ref=e257]
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