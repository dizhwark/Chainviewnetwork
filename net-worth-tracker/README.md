# Personal Net Worth Tracker

Track assets, liabilities, monthly cash flow, and net worth growth over time
with interactive charts.

## Stack

- **Frontend:** React, TypeScript, Vite
- **Charts:** Chart.js (via react-chartjs-2)
- **Backend/Auth:** Supabase (Postgres + Auth), with a local-storage fallback
  so the app is fully usable without any setup

## Features

- **Dashboard** — current net worth, total assets/liabilities, a net worth
  growth line chart, and asset/liability allocation doughnut charts.
- **Accounts** — add/remove asset and liability accounts by category
  (cash, investments, real estate, credit cards, loans, etc.) and save a
  point-in-time snapshot to build the growth chart.
- **Cash Flow** — log income and expense entries and see a monthly
  income-vs-expenses bar chart plus running totals.

## Running locally (demo mode, no setup required)

```bash
cd net-worth-tracker
npm install
npm run dev
```

Open the printed local URL. With no Supabase credentials configured, the app
runs in **local demo mode**: all data is stored in your browser's
`localStorage`, there's no login step, and every feature (accounts, cash
flow, charts, snapshots) works immediately.

## Connecting a real Supabase backend

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql) to
   create the `accounts`, `net_worth_snapshots`, and `cash_flow_entries`
   tables with row-level security scoped to `auth.uid()`.
3. Copy `.env.example` to `.env` and fill in your project's URL and anon key:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Restart the dev server. The app now requires email/password sign-in
   (via Supabase Auth) and reads/writes through Supabase instead of
   `localStorage`, so data syncs across devices and is private per user.

## Build

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  lib/            Supabase client, data types, the DataStore abstraction,
                   and both its localStorage and Supabase implementations
  context/         Auth and data-store React contexts
  components/      Reusable UI: nav layout, forms, lists, Chart.js charts
  pages/           Dashboard, Accounts, Cash Flow, Login
supabase/
  schema.sql        Tables + RLS policies for a real Supabase project
```
