# Quinite Vantage — Frontend (Next.js)

## Project Overview

**Quinite Vantage** is a multi-tenant SaaS platform for AI-powered real estate sales automation. It enables organizations to manage leads, run automated AI voice call campaigns, track property inventory, and handle billing — all targeted at the Indian real estate market.

**Companion service:** `../quinite-vantage-webserver` handles the actual AI voice call WebSocket bridging (Plivo ↔ OpenAI Realtime).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase / PostgreSQL with RLS |
| Auth | Supabase Auth (email/password) |
| Styling | TailwindCSS + Radix UI |
| State | TanStack React Query v5 + React Context |
| Payments | Razorpay (INR, India-only) |
| Voice/Calling | Plivo + OpenAI Voice API |
| Forms | React Hook Form + Zod |
| Testing | Vitest |
| Icons | Lucide React |

---

## Feature Flows

### 1. Authentication & Onboarding
- **Entry:** `/` — signin/signup tabs
- **Signup:** `POST /api/auth/signup` → email confirmation → `/onboarding`
- **Onboarding:** 5-step wizard (Sector → Business Type → Company Details → Address → Review)
  - Creates `organizations` + `organization_profiles` rows
- **Auth Context:** `contexts/AuthContext.js` — manages `user`, `profile`, `loading`
- **Middleware:** `middleware.js` — rate limits (500/min), validates Supabase token, sets `x-user-id`/`x-user-email` headers
- **API protection:** `lib/middleware/withAuth.js` wraps handlers; `withPermission()` for RBAC

### 2. CRM — Leads
- **Pages:** `/dashboard/admin/crm/leads` (list), `/dashboard/admin/crm/leads/[id]` (profile)
- **Lead profile:** full interaction history, tasks, call logs, AI metadata, pipeline stage
- **Bulk ops:** `POST /api/leads/bulk-update`
- **Upload:** `POST /api/leads/upload` (CSV via papaparse)
- **Call initiation:** `POST /api/leads/[id]/call`

### 3. CRM — Campaigns (AI Call Automation)
- **Pages:** `/dashboard/admin/crm/campaigns`
- **Create campaign:** select project, leads, AI script, language, time window, voice
- **Start:** `POST /api/campaigns/[id]/start` → enqueues leads into `call_queue` in webserver DB
- **Progress tracking:** `GET /api/campaigns/[id]/progress` (polled)
- **Cancel:** `POST /api/campaigns/[id]/cancel`
- **Call logs:** `GET /api/campaigns/[id]/logs`
- **AI script:** stored in `campaigns.ai_script`, multilingual (English, Hindi, Gujarati)

### 4. CRM — Calls
- **Live calls:** `/dashboard/admin/crm/calls/live` — real-time monitoring
- **Call history:** `/dashboard/admin/crm/calls/history` — full call log with transcript, sentiment, AI metadata
- **Webhooks from Plivo:** `POST /api/webhooks/plivo/answer|hangup|status|recording|transfer`

### 5. Inventory (Projects & Units)
- **Pages:** `/dashboard/inventory`
- **Projects:** create/edit/archive/restore; tied to `organization_id`
- **Units:** per project, with tower/floor/config/price/amenities
- **Generate inventory:** `POST /api/projects/[id]/generate-inventory` (bulk create from config)
- **Visual floor plan:** `components/inventory/FloorPlanLand.js`

### 6. Pipeline (CRM)
- **Pages:** `/dashboard/admin/crm/pipelines`
- **Kanban board:** `components/crm/PipelineBoard.js` (drag-drop via @dnd-kit)
- **Stages:** configurable per pipeline, leads move between stages

### 7. Billing & Subscriptions
- **Pages:** `/dashboard/admin/billing`
- **Plans:** Starter / Professional / Enterprise
- **Credits:** call credit balance, purchased separately
- **Payment:** Razorpay order → verify → webhook confirms
  - `POST /api/billing/payment/razorpay/create-order`
  - `POST /api/billing/payment/razorpay/verify`
  - `POST /api/billing/payment/razorpay/webhook`
- **Invoices:** auto-generated on payment

### 8. Permissions & Roles
- **Context:** `contexts/PermissionContext.js` — `hasPermission()`, `hasAnyPermission()`
- **API:** `GET /api/permissions/my-permissions`
- **Feature keys:** `project.view`, `lead.create`, `campaign.start`, etc.
- **Role hierarchy:** Owner > Admin > Member
- **User-level overrides** stored in `user_permissions`

### 9. Admin (Platform-level)
- **User management:** invite, update, deactivate
- **Impersonation:** `POST /api/platform/impersonate` — audit-logged
- **Audit logs:** `/dashboard/admin/audit` — full action trail
- **Organization management**

### 10. Analytics
- **Pages:** `/dashboard/admin/analytics`
- **Campaign performance:** call stats, sentiment trends, interest levels
- **Charts:** Recharts library

---

## Directory Structure

```
app/
├── page.js                    # Auth page
├── layout.js                  # Root layout (providers)
├── onboarding/page.js         # Org setup wizard
├── dashboard/
│   ├── layout.js              # Dashboard shell (PermissionProvider)
│   └── admin/
│       ├── crm/               # CRM module
│       │   ├── leads/         # Lead list + [id] profile
│       │   ├── campaigns/     # Campaign management
│       │   ├── calls/live|history
│       │   ├── pipelines/
│       │   └── insights/
│       ├── inventory/         # Property inventory
│       ├── analytics/
│       ├── audit/
│       └── billing/
├── api/                       # 129 API routes
│   ├── auth/
│   ├── leads/
│   ├── campaigns/
│   ├── billing/
│   ├── crm/
│   ├── projects/
│   ├── inventory/
│   ├── admin/
│   ├── permissions/
│   ├── webhooks/plivo/
│   └── webhooks/payment/
components/
├── admin/                     # AdminHeader, AdminSidebar, CrmSidebar
├── crm/                       # LeadCard, PipelineBoard, LeadProfileView
├── inventory/                 # ProjectCard, UnitCard, FloorPlanLand
├── billing/                   # BillingPlansManagement
├── ui/                        # Radix UI wrappers (button, dialog, etc.)
└── providers/ReactQueryProvider.js
contexts/
├── AuthContext.js             # User + profile state
└── PermissionContext.js       # Feature permissions
lib/
├── middleware/withAuth.js     # API auth wrapper
├── supabase/                  # Supabase client helpers
└── utils.js
hooks/                         # useCRMDashboard, useLeads, useProjects, etc.
services/                      # External service clients
database/                      # DB helpers / query builders
supabase/                      # Migrations + RLS policies
```

---

## Database Tables (Key)

| Table | Purpose |
|---|---|
| `organizations` | Tenant root record |
| `profiles` | User profiles (extends auth.users) |
| `roles` / `role_permissions` / `user_permissions` | RBAC |
| `audit_logs` | Action trail (includes impersonation) |
| `projects` | Real estate projects |
| `campaigns` | AI call campaigns (script, schedule, settings) |
| `leads` | Lead records (name, phone, stage, assigned_to) |
| `call_logs` | Full call records (transcript, sentiment, AI metadata) |
| `lead_interactions` | Interaction history (calls, notes) |
| `tasks` | Tasks (standalone, lead-linked, or project-linked) |
| `pipelines` / `pipeline_stages` | Kanban configuration |
| `units` / `unit_configs` | Property inventory |
| `subscriptions` / `invoices` / `payments` | Billing |
| `call_credits` | Credit balance per org |
| `notifications` | User notifications |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
PLIVO_AUTH_ID=
PLIVO_AUTH_TOKEN=
NEXT_PUBLIC_SITE_URL=
OPENAI_API_KEY=
```

---

## Coding Conventions

- **API routes:** Use `withAuth(handler)` for protected endpoints; `withPermission(featureKey)` for RBAC
- **Client data fetching:** Use TanStack React Query hooks from `hooks/`; default `staleTime: 30s`
- **Forms:** React Hook Form + Zod schema validation
- **Permissions check:** `usePermission('feature.key')` from `contexts/PermissionContext.js`
- **Notifications:** Use `sonner` toast (`import { toast } from 'sonner'`)
- **Components:** Radix UI primitives from `components/ui/`; Tailwind for styling
- **Supabase client:** `lib/supabase/` — separate server vs. client helpers
- **No MongoDB** — the `mongodb` package is a legacy dependency, all data is in Supabase/PostgreSQL

---

## Key Commands

```bash
# Development
yarn dev

# Build
yarn build

# Start production
yarn start

# Run tests
yarn test
```
