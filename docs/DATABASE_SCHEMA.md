# Database Schema Documentation

## Overview

Complete database schema for Quinite Vantage AI Calling Platform.

---

## Tables

### 1. `leads`

Stores all lead/contact information for campaigns.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `organization_id` | UUID | NO | - | Organization owner (FK) |
| `project_id` | UUID | YES | NULL | Associated project (FK) |
| `created_by` | UUID | YES | NULL | User who created (FK) |
| `name` | TEXT | NO | - | Lead's full name |
| `email` | TEXT | YES | NULL | Email address |
| `phone` | TEXT | YES | NULL | Phone number |
| `source` | TEXT | NO | 'manual' | Lead source |
| `status` | TEXT | NO | 'new' | Lead status |
| `call_status` | TEXT | NO | 'not_called' | AI call status |
| `transferred_to_human` | BOOLEAN | NO | FALSE | Transfer flag |
| `call_date` | TIMESTAMPTZ | YES | NULL | Last call timestamp |
| `call_log_id` | UUID | YES | NULL | Latest call log (FK) |
| `notes` | TEXT | YES | NULL | Additional notes |
| `metadata` | JSONB | YES | NULL | Custom data |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

#### Constraints

- **Status Check**: `status IN ('new', 'contacted', 'qualified', 'converted', 'lost')`
- **Source Check**: `source IN ('manual', 'csv_upload', 'website', 'referral')`
- **Call Status Check**: `call_status IN ('not_called', 'called', 'transferred', 'no_answer', 'voicemail')`

#### Indexes

- `idx_leads_org` - organization_id
- `idx_leads_project` - project_id
- `idx_leads_status` - status
- `idx_leads_call_status` - call_status
- `idx_leads_created` - created_at DESC
- `idx_leads_email` - email (WHERE email IS NOT NULL)
- `idx_leads_phone` - phone (WHERE phone IS NOT NULL)
- `idx_leads_transferred` - transferred_to_human (WHERE transferred_to_human = TRUE)
- `idx_leads_call_log_id` - call_log_id

#### Foreign Keys

- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `project_id` → `projects(id)` ON DELETE SET NULL
- `created_by` → `auth.users(id)` ON DELETE SET NULL
- `call_log_id` → `call_logs(id)` ON DELETE SET NULL

---

### 2. `call_logs`

Tracks all AI agent calls made during campaigns.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `campaign_id` | UUID | NO | - | Campaign (FK) |
| `lead_id` | UUID | NO | - | Lead called (FK) |
| `organization_id` | UUID | NO | - | Organization (FK) |
| `call_sid` | TEXT | YES | NULL | Plivo call UUID |
| `call_status` | TEXT | NO | - | Call outcome |
| `transferred` | BOOLEAN | NO | FALSE | Transfer flag |
| `transferred_at` | TIMESTAMPTZ | YES | NULL | Transfer timestamp |
| `transfer_reason` | TEXT | YES | NULL | Why transferred |
| `transfer_department` | TEXT | YES | NULL | Department (sales/support) |
| `call_timestamp` | TIMESTAMPTZ | NO | NOW() | Call start time |
| `duration` | INTEGER | NO | 0 | Call duration (seconds) |
| `transcript` | TEXT | YES | NULL | Full conversation |
| `conversation_summary` | TEXT | YES | NULL | AI summary |
| `recording_url` | TEXT | YES | NULL | Call recording URL |
| `notes` | TEXT | YES | NULL | Additional notes |
| `metadata` | JSONB | YES | NULL | Custom data |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |

#### Constraints

- **Call Status Check**: `call_status IN ('called', 'transferred', 'no_answer', 'voicemail')`

#### Indexes

- `idx_call_logs_campaign` - campaign_id
- `idx_call_logs_lead` - lead_id
- `idx_call_logs_org` - organization_id
- `idx_call_logs_call_sid` - call_sid
- `idx_call_logs_timestamp` - call_timestamp DESC
- `idx_call_logs_transferred` - transferred (WHERE transferred = TRUE)
- `idx_call_logs_transferred_at` - transferred_at

#### Foreign Keys

- `campaign_id` → `campaigns(id)` ON DELETE CASCADE
- `lead_id` → `leads(id)` ON DELETE CASCADE
- `organization_id` → `organizations(id)` ON DELETE CASCADE

---

### 4. `websocket_servers`

Manages available WebSocket servers for AI voice streaming.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `name` | TEXT | NO | - | Server identifier |
| `url` | TEXT | NO | - | wss:// address |
| `is_active` | BOOLEAN | NO | TRUE | Availability flag |
| `status` | TEXT | NO | 'pending' | 'verified'/'failed' |
| `last_verified_at` | TIMESTAMPTZ | YES | NULL | Last check time |
| `priority` | INTEGER | NO | 0 | Load balancing weight |

#### Constraints

- **Status Check**: `status IN ('pending', 'verified', 'failed')`

#### Indexes

- `idx_websocket_servers_active` - (is_active, priority)

---

### 3. `campaigns` (Analytics Columns)

Additional columns added to existing campaigns table.

#### New Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `total_calls` | INTEGER | NO | 0 | Total calls made |
| `transferred_calls` | INTEGER | NO | 0 | Calls transferred to human |
| `conversion_rate` | DECIMAL(5,2) | NO | COMPUTED | Auto-calculated % |

#### Computed Column

```sql
conversion_rate = (transferred_calls / total_calls * 100) OR 0
```

#### Index

- `idx_campaigns_conversion` - conversion_rate DESC

---

## Row Level Security (RLS)

### `leads` Table Policies

**1. SELECT Policy**: "Users can view leads in their organization"

```sql
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
))
```

**2. INSERT Policy**: "Users can create leads in their organization"

```sql
WITH CHECK (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
))
```

**3. UPDATE Policy**: "Users can update leads in their organization"

```sql
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
))
```

**4. DELETE Policy**: "Users can delete leads in their organization"

```sql
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
))
```

### `call_logs` Table Policies

**1. SELECT Policy**: "Users can view call logs in their organization"

```sql
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
))
```

**2. INSERT Policy**: "Users can create call logs in their organization"

```sql
WITH CHECK (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
))
```

---

## Migration Order

Run migrations in this order:

1. **`000_master_schema.sql`** - Creates all tables, columns, indexes
2. **`001_rls_policies.sql`** - Enables RLS and creates policies

---

## Entity Relationship Diagram

```
organizations
    ↓ (1:N)
leads ←→ call_logs
    ↓ (N:1)
projects
    ↓ (N:1)
campaigns
```

### Relationships

- **Organization → Leads**: One-to-Many (CASCADE delete)
- **Project → Leads**: One-to-Many (SET NULL on delete)
- **Campaign → Call Logs**: One-to-Many (CASCADE delete)
- **Lead → Call Logs**: One-to-Many (CASCADE delete)
- **Lead → Call Log**: Many-to-One (latest call, SET NULL on delete)

---

## Common Queries

### Get leads with call status

```sql
SELECT l.*, cl.call_sid, cl.transcript
FROM leads l
LEFT JOIN call_logs cl ON l.call_log_id = cl.id
WHERE l.organization_id = 'org-uuid'
ORDER BY l.created_at DESC;
```

### Get campaign analytics

```sql
SELECT 
  c.name,
  c.total_calls,
  c.transferred_calls,
  c.conversion_rate
FROM campaigns c
WHERE c.organization_id = 'org-uuid'
ORDER BY c.conversion_rate DESC;
```

### Get transferred calls

```sql
SELECT l.name, l.phone, cl.transferred_at, cl.transfer_reason
FROM leads l
JOIN call_logs cl ON l.call_log_id = cl.id
WHERE cl.transferred = TRUE
  AND l.organization_id = 'org-uuid'
ORDER BY cl.transferred_at DESC;
```

---

## Notes

- All timestamps are in UTC (TIMESTAMPTZ)
- UUIDs are auto-generated using `uuid_generate_v4()`
- RLS ensures organization-level data isolation
- Service role bypasses RLS (used by WebSocket server)
- `updated_at` on leads auto-updates via trigger
