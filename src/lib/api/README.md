# Admin API endpoints

The customers and technicians pages call `customersApi` and `techniciansApi` (in `endpoints/`) through the React Query hooks in `src/hooks/`. Each one has two modes:

| `NEXT_PUBLIC_USE_MOCKS` | Behaviour |
| --- | --- |
| `true` | Reads and writes the in-memory copy of `src/mocks/*.json`, with 300–500 ms of simulated latency. Changes reset on page reload. |
| anything else | Calls the backend at `NEXT_PUBLIC_API_URL` through `api` in `client.ts`. |

When the backend endpoints below are live, set `NEXT_PUBLIC_USE_MOCKS=false`. No UI changes are needed.

## Proposed REST contract (for the backend team)

All routes are relative to `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3000/api/v1`). Response bodies use the shapes in `src/types/`.

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| GET | `/admin/stats` | — | `AdminStats` |
| GET | `/admin/customers` | `?search&status&page&pageSize&sort` | `PaginatedResponse<Customer>` |
| GET | `/admin/customers/:id` | — | `Customer` |
| PATCH | `/admin/customers/:id/status` | `{ status: AccountStatus }` | `Customer` |
| GET | `/admin/technicians` | `?search&verification&status&trade&available&page&pageSize&sort` | `PaginatedResponse<Technician>` |
| GET | `/admin/technicians/:id` | — | `Technician` |
| PATCH | `/admin/technicians/:id` | `TechnicianProfilePatch` | `Technician` |
| PATCH | `/admin/technicians/:id/status` | `{ status: AccountStatus }` | `Technician` |
| POST | `/admin/technicians/:id/verification/approve` | — | `Technician` |
| POST | `/admin/technicians/:id/verification/reject` | `{ reason: string }` | `Technician` |

### Enums and query semantics

- **Enums**
  - `AccountStatus`: `active | suspended | inactive`
  - `VerificationStatus`: `not_submitted | pending | verified | rejected`
  - `sort`: `newest` (default) | `oldest` | `name`
- **Services** (`trades`, same list as `SERVICE_CATEGORIES` and the mobile app): Electrical, Plumbing, HVAC, Appliance Repair, Car & Garage, Truck & Mechanical, Home Repair, General Maintenance.
- **`search`** matches name and email (case-insensitive) and phone digits.
- **`page`** starts at 1. `pageSize` defaults to 10.
- **Errors:** return a non-2xx status with `{ "message": "..." }`. The UI shows `message`, and a 404 on a detail route shows "not found".
- **Reviewer identity:** approving or rejecting should set `verification.reviewedAt` and `reviewedBy` from the authenticated admin.
