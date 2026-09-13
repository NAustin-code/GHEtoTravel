# Enterprise Travel Request Platform

React frontend for the Travel Request System (migrated from the former GHE Compliance Dashboard).

## Running

```bash
npm install
npm run dev          # Vite dev server, fully offline via the local store
```

## Testing

```bash
npm test             # Run the current frontend Vitest suite (264 tests, fully offline)
npx playwright test  # Run the Playwright e2e suite (offline, local store seeds itself)
```

### Current request UI

The New Travel Request form captures Traveler Details (up to 10 travelers: name as per ID/passport, ID/passport number, gender, email, cell, job title, employee code, internal/external, plus company / company to be billed / department / approval manager / order number), Travel Details (departure/return dates, domestic/international, one-way/return trip type, reason, from/to, transport mode and costs, seat preference), Travel Reference, and Accommodation & Transport. Trip duration (inclusive days) and ISO week number are derived from the travel dates for reporting. New requests get `TR-YYYY-####` IDs. The Approver Dashboard uses Pending Queue, Approved, Returned, and Declined KPI cards; Returned is counted from requests with status `Returned`. The Admin Reports section offers 5 exportable report types: High-Value Travel, Destination Concentration, Trip Type, Transport Mode, and Department Spend. My Declarations exports include 21 travel-specific columns (duration, week number, transport mode, seat preference, accommodation, reference, etc.).

### Test Coverage (264 tests, 19 files, fully offline via the local store)

| File | Tests | Focus |
|------|-------|-------|
| `api-services.test.ts` | 57 | Local-store service layer: CRUD, submit lifecycle, workflows, reports, file content, errors |
| `integration.test.ts` | 28 | Auth + journey flows against the local store |
| `NewDeclarationScreen.test.tsx` | 14 | Travel form render, validation, submit/draft, traveler blocks, file upload |
| `approval-workflow.test.tsx` | 23 | WorkflowTimeline options, decisions, auto-fetch |
| `ApprovalDetail.test.tsx` | 15 | Approval detail decisions and payloads |
| `workflow-e2e.test.tsx` | 29 | Approval lifecycle, documents, error paths |
| `workflow-fix.test.tsx` | 3 | Timeline rendering edge cases |
| `MyDeclarationsScreen.test.tsx` | 14 | Travel request list, filters, export |
| `ApprovalQueue.test.tsx` | 9 | Queue filtering, review, export |
| `frontend-break.test.ts` | 31 | HTTP client breaking tests + offline service wrappers |
| `auth-edge-cases.test.ts` | 13 | Local auth edge cases, token/session handling, screen access |
| `org-api.test.ts` | 4 | Organization API helpers |
| `Sel.test.tsx` | 2 | Select placeholder display, clearing back to empty option |
| `travel.test.ts` | 6 | Trip duration and ISO week-number helpers |
| others (`ErrorBoundary`, `UserContext`, `dashboard-render`, `AdminApprovalOptions`, `admin-dashboard-states`) | 16 | Component/context/smoke tests |

### Breaking Tests (`frontend-break.test.ts` — 31 tests)

Tests the HTTP service layer (`src/services/httpClient.ts` and `src/services/api.ts`) by mocking `fetch`:

- **HTTP errors**: 401, 403, 404, 500 — verify `ApiClientError` is thrown with correct message
- **Network failure**: `TypeError: Failed to fetch` is propagated
- **Malformed responses**: non-JSON body, HTML response, empty 204 body
- **Auth headers**: Bearer token set correctly when token in localStorage, omitted when absent
- **HTTP methods**: GET/POST/PUT/PATCH/DELETE with correct headers and bodies
- **Query params**: URL building with status, search, role filters
- **Edge inputs**: special characters in paths, very long paths, null body, unexpected schema

## Architecture

The frontend runs entirely on a local store — no backend required:

```
Component → api.ts (service layer) → localStore.ts (localStorage + seed data)
```

All data (users, travel requests, workflows, config, dropdowns, organizations,
approval options, files) persists in `localStorage` under the `trp.v1.` namespace
and is seeded with demo data on first access. Tests reset the store via
`resetLocalStore()` in `beforeEach`.
