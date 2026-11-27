# Connecting Fundi Web to Fundi API

Run the existing backend on port 3000 with its database and Redis available.
In `fundi-web`, run `npm run dev` and open http://localhost:3001.
Use an administrator already provisioned by the backend. Sign in with email and
password, then enroll/verify the authenticator code. The development OTP option
works only when the backend also runs in development.

The default frontend configuration is:

```dotenv
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_USE_MOCKS=false
API_PROXY_TARGET=http://localhost:3000
```

Next.js forwards `/api/v1/*` to `API_PROXY_TARGET`, including cookies and file
uploads. This keeps the admin session and its path-scoped 2FA challenge on the
frontend origin. Restart Next.js after changing environment variables. For a
remote backend set `API_PROXY_TARGET` to its origin, without `/api/v1`.
Production requires a reachable backend and cookie flags appropriate to its HTTPS
hostname; any configured cookie domain must also match the frontend hostname.

Both authentication and data calls share `client.ts`. Admin cookies are httpOnly;
the client refreshes an expired session once and retries the request. Tokens are
never copied into local storage.

The adapters map the existing backend contracts:

- Customers and users: `/users` with `{ data, pagination }`.
- Technicians: `/admin/technicians`; identity edits use the linked `/users/:id`.
- Categories: `/catalog/admin/categories` and `/catalog/categories/:id`.
  Fees are whole RWF amounts; zero is preserved.
- Jobs, ratings, counts: `/admin/jobs`, `/:id/rating`, and `/summary`.
- Negotiation review: `/admin/conversations` (read-only).
- Documents: `/admin/technicians/:id/documents` and `/admin/technician-documents`.
- Payments and disputes: `/admin/payments` and `/admin/disputes`.
- Broadcasts: `/admin/broadcasts/preview` and `/admin/broadcasts`.
- Landing ads: public `/ads`, admin `/admin/ads`, and multipart `/:id/image`.
- Password changes: `/auth/admin/change-password`; success requires signing in again.

`NEXT_PUBLIC_USE_MOCKS=true` explicitly enables demonstration data for endpoints
with mock implementations. Authentication still requires the real backend.
Approvals, commission preferences, and technician work settings have no matching
backend persistence contract; do not treat those local-only values as server data.
The signup page remains an app-download handoff, not account registration.

Run `npm run test:api`, `npx tsc --noEmit`, and `npm run build` to validate the integration.

Admin job creation requires an unused booking payment and an unconsumed,
unexpired phone verification belonging to the chosen customer. The customer
completes payment and phone verification in the app; the admin form sends both
reference IDs. The admin cookie cannot perform customer-only verification calls.
Editing a job preserves its existing coordinates and offered amount.

## Admin performance integration

Implemented on local branch `feature/admin-dashboard-performance`, based on
`integration`. Deploy the matching backend pagination/summary changes before this
frontend; the adapters intentionally require the new paginated envelope.

### Lists and summaries

- Jobs always requests `/admin/jobs?page=...&limit=...`. `pageSize` is translated
  to `limit`; the server's `{ data, pagination }` becomes the table's
  `{ items, page, pageSize, total, totalPages }`. There is no local slicing or
  whole-collection fetch on the Jobs screen.
- Jobs sends `priority`, `serviceCategoryId` (UUID), `group`, trimmed `search`,
  `sortBy` and `sortOrder`. The API adapter also supports status, request type,
  customer and technician filters. Jobs/Records URL filters use the new names;
  older URLs using `service=<name>` or `urgency` should be updated.
- The Jobs cards use `/admin/jobs/summary` for all active/completed jobs and open
  disputes. Group selection is a separate filter. Counts are global, not current
  page counts; disputed membership can overlap status groups on the backend.
- Booking fees uses `/admin/payments?page=...&limit=...` with server search,
  status and sort parameters. Technician payouts fetches its own page with
  `status=COMPLETED` only when that tab opens. Claims also load on demand.
- Finance cards and tab counts use `/admin/payments/summary`, across **all**
  booking payments independently of table filters, preserving the existing card
  scope. They do not sum the displayed page. The adapter supports optional summary
  filters and paidAt bounds (`from` inclusive, `to` exclusive) for future UI use.
- The server reports effective EXPIRED status without writing during list reads.
  Payment summaries are booking amounts, not a settlement ledger.

### Detail data and refresh behavior

- `JobListItem` is distinct from `Job`: it contains only summary dispute fields,
  not ratings, histories or full dispute details. List queries never seed the
  detail cache. Hovering or focusing a job row/prefetch link warms that job's
  detail query; opening it paints the cached list row as a temporary shell while
  `/admin/jobs/:id` loads. The row mapper deliberately leaves full-detail-only
  fields (ratings, histories, dispute detail) unset. Mutation responses retain
  the full detail representation and update the detail cache.
- Service Records uses paginated rows and directs users to details for ratings,
  rather than incorrectly labeling omitted ratings as “Not rated”. The separate
  Ratings screen retains an explicit legacy read until the API supports a global
  rating list. Matching has page navigation; its local quick-filter counts are
  explicitly scoped to the current page.
- Query keys include filters, sorting and pagination. Search commits are
  debounced by 300 ms and filter changes reset page 1. Jobs/Records search inputs
  follow URL navigation. Prior pages remain visible while replacements load;
  page buttons are disabled during fetching. Empty/out-of-range pages remain
  navigable, including after deletion.
- Payment mutations invalidate all payment pages/summaries, Jobs and dashboard
  caches. Job mutations also invalidate payment data.
- Dashboard analytics has a 15-second client stale time and existing periodic
  refreshes. SSE audit bursts coalesce refreshes over 250 ms and invalidate all
  matching analytics. Backend analytics can itself be cached for 15 seconds;
  `generatedAt` indicates actual freshness rather than the HTTP receipt time.
  Automatic polling and the manual Refresh button only refetch the visible
  section's analytics; hidden sections are not polled on client navigation.

### Request lifecycle and initial-load cost

- Every admin query endpoint accepts an optional `AbortSignal`; TanStack Query
  passes its cancellation signal through the hook to the client. The client
  combines that signal with its timeout, propagates caller cancellation instead
  of returning a timeout/network error, and retries one time only for genuine
  transient failures. Permanent 4xx responses are not retried.
- Dialog/panel dependencies load on demand: customers and services in the job
  form, technicians in the reassignment dialog, staff payroll users, and payment
  claims wait until their dialog or tab is opened. The landing ads provider
  fetches only while at least one ads consumer is mounted, so admin list screens
  no longer request `/admin/ads` eagerly.
- Detail prefetching is limited to hover/focus intent on Jobs, Matching,
  Records, and Ratings. It shares the ordinary detail query key, so a click
  into a warmed row needs no duplicate request.

### Verification and rollout

`npm run test:api`: 24 contract/cache tests pass, including paging parameters,
server totals, summary disputes, detail isolation, mutation invalidation,
caller-signal cancellation, and list-row placeholder mapping. TypeScript and
the production build pass. ESLint has zero errors and only pre-existing warnings
in unrelated components. Auth/cookie flows remain covered by the existing
contract tests.

For production-mode UI measurements, build first, start `next start -p 3102`,
then run `node scripts/test-admin-performance.cjs --baseline` for the pre-change
reference and `node scripts/test-admin-performance.cjs` for the current build.
The harness uses a local Chrome/CDP session with deterministic 150 ms fixtures
for every API call; it does not use a real account, database, or production
data. It records time to a rendered Jobs table, warm/cold detail navigation,
duplicate auth/data requests across SPA navigation, and the dashboard Refresh
request set. `--baseline` records the original eager request pattern; current
mode additionally asserts that closed dialogs and hidden sections stay quiet.

One local production-mode sample (150 ms per fixture request) measured the Jobs
table ready in 1180 ms before and 1002 ms after; a warmed detail click took
416 ms before and 113 ms after. Initial Jobs requests dropped `/admin/ads` and
`/users?role=CUSTOMER`; the warmed detail click issued no duplicate job or
technician request; dashboard Refresh fell from five calls to three visible
sections only. These are synthetic before/after comparisons, not production
latency guarantees.

Authenticated browser validation remains a deployment step: use more than one
page of records; change filters/sort, navigate back/forward, open job details,
extend a payment and delete the last completed-payment row on a page. In Network,
confirm one bounded list call per page, no full-list call for summary cards,
separate completed-payment paging, and stable all-record finance totals.
No live authenticated browser performance measurements were collected here.

The backend index migration and migration-history reconciliation described in
`fundi-api/docs/admin-performance.md` are still rollout prerequisites. Remaining
legacy reads include Ratings, claims, and existing payroll/user behavior; a
paginated contract for those should be handled separately.
