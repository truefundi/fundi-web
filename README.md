# Fundi Platform — Admin & Operations Web Portal

The web application for the Fundi platform, built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**.

The mobile app (`fundi-mobile-`) is the product reference: job statuses, data shapes and the brand palette here are kept in sync with it.

---

## 1. Quick Start Guide

### Prerequisites
- Node.js 20+
- npm

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

### Step 3: Run Development Server
```bash
npm run dev -- -p 3001   # start on port 3001
npm run dev:open         # same, and opens the browser automatically
```

* **Public landing page:** `http://localhost:3001`
* **Admin portal:** `http://localhost:3001/admin`

> Port 3001 is used because the backend API defaults to port 3000 (`NEXT_PUBLIC_API_URL`).

---

## 2. Scripts & Commands

```bash
npm run dev       # Start Next.js development server
npm run dev:open  # Start dev server on port 3001 and open the browser
npm run build     # Create optimized production build
npm run start     # Start production Next.js server
npm run lint      # Run ESLint code quality check
```

---

## 3. Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api/v1` | Base URL of the Fundi backend API |
| `NEXT_PUBLIC_APP_NAME` | `Fundi Platform` | Display name of the portal |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | `10000` | API request timeout in milliseconds |

All variables are read through `src/config/env.ts`. Do not use `process.env` directly elsewhere.

---

## 4. Project Structure

```
fundi-web/
├── scripts/
│   └── dev-open.mjs            # Dev server launcher that opens the browser
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (html/body, site metadata)
│   │   ├── page.tsx            # Public landing page (/)
│   │   ├── error.tsx           # Route error boundary
│   │   ├── global-error.tsx    # Root layout error boundary
│   │   ├── not-found.tsx       # 404 page
│   │   └── admin/              # Admin portal (/admin), wrapped in AppShell
│   │       ├── layout.tsx      # Sidebar + top bar for every admin page
│   │       ├── page.tsx        # Dashboard
│   │       ├── loading.tsx     # Admin loading fallback
│   │       ├── jobs/           # Admin sections (placeholders awaiting backend):
│   │       ├── matching/       #   Operations: jobs, matching, disputes
│   │       ├── disputes/
│   │       ├── technicians/    #   People: technicians, customers
│   │       ├── customers/
│   │       ├── categories/     #   Business: categories, payments, service records
│   │       ├── payments/
│   │       ├── records/
│   │       └── settings/       #   System: fees, commission, admin team
│   ├── components/
│   │   ├── landing/            # Landing page sections; all copy lives in content.ts
│   │   ├── layout/             # AppShell, Sidebar, Topbar, PlaceholderPage
│   │   ├── dashboard/          # Dashboard widgets (pipeline, attention queue)
│   │   └── ui/                 # Reusable UI: Button, Card, Badge, Spinner, StatCard, …
│   ├── config/
│   │   ├── env.ts              # Typed environment variables
│   │   ├── navigation.ts       # Sidebar navigation items
│   │   └── services.ts         # The 8 service categories (same as mobile TRADES)
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts       # fetch wrapper (timeouts, JSON, error normalising)
│   │   │   ├── endpoints/      # One file per backend resource
│   │   │   └── index.ts
│   │   └── utils.ts            # Shared helpers (cn)
│   └── types/                  # Shared TypeScript types (API, jobs)
├── .env.example
├── eslint.config.mjs
├── next.config.js
├── tailwind.config.js          # Includes the Fundi `brand` (orange) palette
└── tsconfig.json
```

---

## 5. Development Guide

### Adding an admin page
1. Create `src/app/admin/<section>/page.tsx`.
2. Add it to the sidebar in `src/config/navigation.ts`.

### Editing the landing page
All landing page text (steps, benefits, FAQ, service descriptions) is in `src/components/landing/content.ts`. Store badges, company and legal links are placeholders until final content is available.

### Calling the API
Add an endpoint module in `src/lib/api/endpoints/` and export it from `src/lib/api/index.ts`:

```ts
// src/lib/api/endpoints/jobs.ts
import { api } from '../client';
import type { Job } from '@/types/job'; // define Job once the backend schema is agreed

export const jobsApi = {
  list: () => api.get<Job[]>('/jobs'),
  get: (id: string) => api.get<Job>(`/jobs/${id}`),
};
```

Requests never throw. They return `{ data, error, statusCode }`, where `statusCode` is `0` for network errors and timeouts.

### UI components
Import shared components from `@/components/ui`:

```tsx
import { Button, Card, CardHeader, Badge, EmptyState } from '@/components/ui';
```

Use the `brand-*` Tailwind colours (e.g. `bg-brand-500`) for Fundi orange.
