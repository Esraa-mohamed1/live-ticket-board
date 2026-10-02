# Live Ticket Board

A real-time support ticket dashboard built with Next.js (App Router), TypeScript (strict mode), Supabase (Postgres, Realtime, RLS), Zod, and Vitest.

---

## Overview and setup steps

### Overview
The Live Ticket Board enables customer support workflows with real-time bidirectional synchronization:
- **Role-based view switching**: Toggle between **Customer View** (create tickets, view only customer tickets) and **Agent View** (view all tickets, update ticket statuses) with zero friction.
- **Supabase Realtime**: Live ticket board synchronizes instantly across browser tabs and devices via Postgres change streams (`postgres_changes`), with client-side reconciliation using an O(1) Map upsert.
- **Two-layer rate limiting**: In-memory sliding-window limiter at the application layer (5 tickets/min per user) paired with Postgres advisory lock triggers at the database layer.
- **Idempotency**: Client-generated UUID idempotency keys guarantee safe form retries; duplicate submissions return the existing ticket rather than erroring.
- **Ticket statistics**: Served via a dedicated Postgres RPC (`ticket_stats`) and backed by a generic TTL cache with scoped invalidation.

---

### Setup steps

#### 1. Prerequisites
- Node.js 18.17+ or 20+
- A free Supabase account and project ([supabase.com](https://supabase.com))

#### 2. Install dependencies
```bash
npm install
```

#### 3. Database configuration
1. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy the contents of [`supabase/schema.sql`](supabase/schema.sql) and execute it.
   - This sets up enums (`ticket_priority`, `ticket_status`, `user_role`), tables (`profiles`, `tickets`), composite indexes, update triggers, rate limit advisory lock trigger, RLS policies, the `ticket_stats()` RPC, and adds `tickets` to the `supabase_realtime` publication.

#### 4. Configure environment variables
Create a `.env.local` file from [`.env.example`](.env.example):
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials (found in **Project Settings > API**):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

#### 5. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in two separate browser tabs to observe instant real-time synchronization between Customer and Agent views.

#### 6. Run test suite
```bash
npm run test
```
Executes 18 Vitest unit tests covering the TTL cache, sliding-window rate limiter, and Zod schemas.

---

## Architecture and why

The application follows a strict modular clean architecture with explicit unidirectional dependencies:

```
src/
├── app/                  # Next.js App Router (pages, layout, route handlers)
│   ├── (dashboard)/      # Main dashboard with live ticket board
│   └── api/stats/        # Route handler for cached stats
├── config/               # Validated env vars & domain constants
├── lib/                  # Framework & external integrations (Supabase, cache, rate-limit, errors)
├── modules/              # Domain modules following strict MVC pattern
│   ├── tickets/
│   │   ├── interfaces/   # Extracted interfaces (ticket, component, hook)
│   │   ├── schemas/      # [Model] Zod validation schemas & inferred types
│   │   ├── mappers.ts    # [Model] Database row <-> domain model converters & projections
│   │   ├── repository.ts # [Model] Pure SQL/PostgREST queries, keyset pagination
│   │   ├── components/   # [View] Presentational React components
│   │   ├── hooks/        # [View] Client hooks for realtime subscriptions and mutations
│   │   ├── service.ts    # [Controller] Business logic, rate-limit enforcement, cache invalidation
│   │   ├── actions.ts    # [Controller] Server Actions (parse input, invoke service, return Result<T>)
│   │   └── utils/        # [Controller] Merging and sorting algorithms
│   └── stats/
│       ├── interfaces/   # Extracted interfaces (stats, hook)
│       ├── repository.ts # [Model] Database RPC queries
│       ├── components/   # [View] Presentational StatsPanel component
│       ├── hooks/        # [View] Client hook for statistics polling/fetching
│       └── service.ts    # [Controller] Cached stats orchestration
└── shared/               # Reusable UI primitives (Button, Input, Select, Spinner)
    ├── interfaces/       # UI primitive component interfaces
    └── components/ui/    # UI primitive components
```

### The MVC Architecture in Modules
Each module is strictly segregated according to the **Model-View-Controller (MVC)** pattern:
- **Model** (`interfaces/`, `schemas/`, `mappers.ts`, `repository.ts`):
  - Defines domain types and interfaces in dedicated `interfaces/` directories with clean filenames.
  - Enforces input data validation through Zod schemas.
  - Encapsulates database schema access and PostgREST keyset pagination queries with zero business logic.
- **View** (`components/`, `hooks/`):
  - Pure presentational components and custom hooks managing UI state and Supabase Realtime subscriptions.
  - No direct database access or server-side service invocations.
- **Controller** (`service.ts`, `actions.ts`, `utils/`):
  - Orchestrates business workflows, client/user rate limiting, idempotency handling, and cache invalidation.
  - Server actions accept requests, validate parameters, invoke the service, and return typed `Result<T>` responses.

### The dependency rule
Import direction is strictly enforced from the presentation layer downward:
$$\text{app} \longrightarrow \text{components} \longrightarrow \text{hooks} \longrightarrow \text{actions} \longrightarrow \text{service} \longrightarrow \text{repository} \longrightarrow \text{lib}$$
- **Zero reverse imports**: Lower layers never import from upper layers. `lib/` never imports from `modules/`.
- **Components are presentational**: UI components never import Supabase clients or repositories directly; they interact exclusively through server actions and custom hooks.
- **Repository layer isolation**: Contains only database queries and column selection. No business rules, rate limiting, or cache management.
- **Service layer orchestration**: Enforces business validation, rate limits, invokes repositories, and invalidates scoped caches. Never deals with HTTP request/response objects.
- **Server actions are thin adapters**: Parse `FormData`, verify user authentication, invoke the service layer, and return a typed `Result<T>` discriminated union (`{ ok: true, data } | { ok: false, error }`).

---

## Query design with time complexity of each query

| Operation | Query pattern / RPC | Index utilized | Time complexity | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **List tickets (Agent)** | `SELECT <cols> FROM tickets ORDER BY created_at DESC, id DESC LIMIT 20` | `tickets_created_idx (created_at DESC, id DESC)` | $\mathcal{O}(\log N + K)$ | Keyset pagination using composite B-tree index. Zero offset scan degradation as pages deepen. |
| **List tickets (Customer)** | `SELECT <cols> FROM tickets WHERE customer_id = $1 ORDER BY created_at DESC, id DESC LIMIT 20` | `tickets_customer_created_idx (customer_id, created_at DESC, id DESC)` | $\mathcal{O}(\log N + K)$ | Indexed seek directly on `customer_id` prefix, followed by index scan on descending timestamp and UUID. |
| **Keyset next page** | `WHERE created_at < $cursor_time OR (created_at = $cursor_time AND id < $cursor_id)` | Matches composite index order | $\mathcal{O}(\log N + K)$ | Constant index lookup regardless of whether reading page 1 or page 10,000 ($K = 20$). |
| **Insert ticket** | `INSERT INTO tickets (...) VALUES (...) RETURNING <cols>` | `tickets_pkey`, `unique(customer_id, idempotency_key)` | $\mathcal{O}(\log N)$ | Primary key and unique constraint validation via B-tree index checks. |
| **Idempotency lookup** | `SELECT <cols> FROM tickets WHERE customer_id = $1 AND idempotency_key = $2` | `tickets_customer_id_idempotency_key_key` | $\mathcal{O}(1)$ avg / $\mathcal{O}(\log N)$ | Unique B-tree index point lookup on unique constraint violation (Postgres error `23505`). |
| **Status update** | `UPDATE tickets SET status = $1 WHERE id = $2 RETURNING <cols>` | `tickets_pkey` | $\mathcal{O}(\log N)$ | Direct primary key point update. Verified by `guard_ticket_update` trigger. |
| **Rate limit check (DB)** | `SELECT count(*) FROM tickets WHERE customer_id = $1 AND created_at > now() - interval '1 min'` | `tickets_customer_created_idx` | $\mathcal{O}(\log N + M)$ | `pg_advisory_xact_lock` prevents race conditions. Scans only rows created in the last 60 seconds ($M \le 5$). |
| **Ticket stats** | `SELECT status, priority, count(*) FROM tickets GROUP BY 1, 2` | `tickets_status_priority_idx (status, priority)` | $\mathcal{O}(S \times P)$ with index scan | Single aggregation query over 9 enum permutations ($3 \times 3$). Served via in-memory TTL cache ($\mathcal{O}(1)$ read). |

---

## Production authentication and access control

While this prototype supports immediate local evaluation via the view switcher, a production deployment would incorporate the following access control architecture:

1. **Row Level Security (RLS)**:
   - Customers restricted to `customer_id = (select auth.uid())` for `SELECT` and `INSERT`.
   - Agents verified via `public.is_agent()` (or JWT claims) for cross-tenant `SELECT` and status `UPDATE`.
   - Hard denial on `DELETE` operations across all roles.
2. **Custom Access Token (JWT) claims hook**:
   - Instead of running a subquery to `profiles` on every RLS check, a Supabase Auth `custom_access_token_hook` embeds `app_metadata.role = 'agent' | 'customer'` directly into the cryptographically signed JWT.
   - RLS policy simplifies to `(auth.jwt() -> 'app_metadata' ->> 'role') = 'agent'`, eliminating profile table lookups during row evaluation.
3. **Multi-Factor Authentication (MFA) for agents**:
   - Enforce TOTP/WebAuthn for all accounts with role `'agent'`.
   - Enforce `aal` (Authenticator Assurance Level) in RLS: `auth.jwt() ->> 'aal' = 'aal2'`.
4. **Audit logging for status changes**:
   - An append-only `ticket_audit_log` table populated via a Postgres trigger recording `ticket_id`, `actor_id`, `old_status`, `new_status`, and `timestamp`.
5. **Server-only service role key**:
   - The Supabase Service Role key is strictly forbidden on the client and is only used in secure backend worker contexts (e.g. background maintenance or queue consumers).
6. **Distributed rate limiting & cache (Redis/Upstash)**:
   - Replace in-memory state with Redis sliding-window counters via atomic Lua scripts to maintain rate limits and invalidate cached stats consistently across serverless instances and regions.

---

## Trade-offs accepted

1. **In-memory state on serverless instances**:
   - The application-layer `SlidingWindowLimiter` and `TTLCache` reside in Node.js process memory. In serverless environments (e.g. Vercel), separate lambda invocations or multi-region instances do not share state.
   - *Mitigation*: The database-layer Postgres rate limiting trigger (`enforce_ticket_rate_limit`) utilizes transaction-level advisory locks (`pg_advisory_xact_lock`) to guarantee serialization and hard rate-limiting at the database level regardless of serverless concurrency.
2. **View-toggle mode for evaluation**:
   - Built-in authentication UI was omitted per specifications ("a simple toggle between the two views is enough — you don't need to build full authentication"). The board operates with an interactive role switcher and customer simulator while keeping the underlying data model scoped by customer ID.
3. **TTL expiry on read**:
   - `TTLCache` checks timestamp validity on `get()` rather than running background sweep timers, avoiding background timer leaks in serverless runtimes.

---

## What I would do with more time

1. **Upstash Redis integration**:
   - Introduce Redis for distributed sliding-window rate limiting and shared multi-tenant cache across Edge/Serverless runtimes.
2. **End-to-End browser tests (Playwright)**:
   - Automated multi-tab testing verifying that an INSERT in one browser context renders in real-time in another tab within sub-second latency.
3. **Optimistic UI updates**:
   - Optimistically prepend tickets to the local list with rollbacks on server action rejection.
4. **Search and filtering**:
   - Add full-text search (`tsvector` with Postgres GIN index) across ticket titles and descriptions, filterable by priority and status.
5. **Ticket activity history / comments**:
   - Threaded conversation model enabling agents and customers to message on individual tickets.
