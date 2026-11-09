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
