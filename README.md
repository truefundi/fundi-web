# Fundi Platform — Admin & Operations Web Portal

The web application for the Fundi platform, built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## 1. Quick Start Guide

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
npm run dev
```

* **Web Portal URL:** `http://localhost:3001` (or `http://localhost:3000`)

---

## 2. Scripts & Commands

```bash
npm run dev      # Start Next.js development server
npm run build    # Create optimized production build
npm run start    # Start production Next.js server
npm run lint     # Run ESLint code quality check
```

---

## 3. Project Structure

```
web/
├── src/
│   ├── app/                  # Next.js 15 App Router pages & layouts
│   │   ├── error.tsx         # Error boundary fallback
│   │   ├── globals.css       # Global styles & Tailwind CSS
│   │   ├── layout.tsx        # Root layout & navbar wrapper
│   │   ├── loading.tsx       # Loading UI fallback
│   │   └── page.tsx          # Platform dashboard overview page
│   ├── components/           # UI & Layout components
│   │   └── layout/
│   │       └── Navbar.tsx    # Header navigation bar
│   └── lib/                  # Utility & API client helpers
│       └── api-client.ts     # Type-safe API client wrapper
├── .env.example              # Environment variables template
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS styling configuration
├── postcss.config.js         # PostCSS configuration
└── tsconfig.json             # TypeScript configuration
```
