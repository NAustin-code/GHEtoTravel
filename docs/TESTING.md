# Frontend Testing Guide

## Quick Start

```bash
npm install
npx vitest run          # Run all tests
npx vitest              # Watch mode
npx vitest --coverage   # With coverage report
```

## Test Files

| File | Tests | What's tested |
|------|-------|---------------|
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
| `ErrorBoundary.test.tsx` | 5 | React Error Boundary catches thrown errors, renders fallback UI |
| `UserContext.test.tsx` | 7 | User context provider: login state, token storage, role switching |
| `dashboard-render.test.tsx` | 1 | ApproverDashboard mounts without throwing runtime errors |
| `AdminApprovalOptions.test.tsx` | 1 | Approval options admin screen |
| `admin-dashboard-states.test.tsx` | 2 | Admin dashboard loading/error states |
| `org-api.test.ts` | 4 | Organization API helpers |
| `Sel.test.tsx` | 2 | Select component: placeholder display, clearing back to empty option |
| `travel.test.ts` | 6 | Derived report dimensions: trip duration, ISO week number |

**Total: 264 tests**

Tests run fully offline — the service layer reads/writes the localStorage-backed
store, reset via `resetLocalStore()` in `beforeEach`. No backend required.

## Running Individual Tests

```bash
# By file
npx vitest run src/__tests__/auth-edge-cases.test.ts

# By name pattern
npx vitest run -t "login"
```

## Component Coverage

| Component | Status |
|-----------|--------|
| LandingScreen (login) | Tested via auth-edge-cases, integration |
| ApproverDashboard | Tested via dashboard-render |
| ErrorBoundary | Tested via ErrorBoundary tests |
| UserContext | Tested via UserContext tests |
| NewDeclarationScreen | Tested via NewDeclarationScreen tests |
| Sel | Tested via Sel tests |
| Travel date helpers (`utils/travel`) | Tested via travel tests |

## Mock Strategy

Tests use Vitest's `vi.mock()` to:
- Mock `../services/api` module functions (the local-store-backed service layer)
- Mock the `Sel` component with a native input in form tests
- Stub `ResizeObserver`, `scrollIntoView`, and pointer-capture APIs missing in jsdom
- Mock `window.fetch` for file download/view paths
- Control `localStorage` seeds via `resetLocalStore()` in `beforeEach`
