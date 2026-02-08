# Database Functions

## RLS Helper Functions

### `get_auth_org_id()`

**Returns**: `uuid`  
**Purpose**: Gets the organization_id for the currently authenticated user

```sql
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE;
```

**Used by**: Most RLS policies  
**Example**:

```sql
-- In RLS policy
CREATE POLICY "view_org_leads" ON leads
FOR SELECT USING (organization_id = get_auth_org_id());
```

---

## Trigger Functions

### `update_modified_column()`

**Returns**: `trigger`  
**Purpose**: Updates `updated_at` timestamp on row modification

```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Used by**: `organizations`, `profiles`, `projects`, `leads`, `subscriptions`, `subscription_plans`

---

### `update_updated_at_column()`

**Returns**: `trigger`  
**Purpose**: Alternative implementation for updating `updated_at`

**Used by**: `lead_interactions`, `lead_profiles`

---

### `sync_project_units()`

**Returns**: `trigger`  
**Purpose**: Syncs project unit counts when properties are added/updated

```sql
-- Pseudo-code logic:
1. Get all properties for the project
2. Count by status (available, reserved, sold)
3. Update project's unit count columns
```

**Used by**: `properties` (AFTER INSERT OR UPDATE)

---

### `sync_project_units_on_delete()`

**Returns**: `trigger`  
**Purpose**: Syncs project unit counts when properties are deleted

**Used by**: `properties` (AFTER DELETE)

---

### `update_lead_score_after_insight()`

**Returns**: `trigger`  
**Purpose**: Updates lead scoring when AI conversation insights are added

```sql
-- Pseudo-code logic:
1. Extract sentiment_score, interest_level, priority_score from insight
2. Calculate new lead score based on multiple factors
3. Update lead's score, engagement_score, last_sentiment_score
```

**Used by**: `conversation_insights` (AFTER INSERT)

---

### `set_invoice_number()`

**Returns**: `trigger`  
**Purpose**: Auto-generates unique invoice numbers

```sql
-- Format: INV-YYYYMMDD-NNNN
-- Example: INV-20260207-0001

-- Logic:
1. Get current date
2. Find max invoice number for today
3. Increment sequence number
4. Set NEW.invoice_number
```

**Used by**: `invoices` (BEFORE INSERT)

---

## Utility Functions

### `log_audit()`

**Parameters**: `user_id uuid, user_name text, action text, entity_type text, entity_id uuid, metadata jsonb`  
**Returns**: `void`  
**Purpose**: Creates audit log entries

```sql
-- Example usage:
SELECT log_audit(
  auth.uid(),
  'John Doe',
  'project.delete',
  'project',
  '123e4567-e89b-12d3-a456-426614174000',
  '{"name": "The Park"}'::jsonb
);
```

---

## Function Summary

| Function | Type | Purpose |
|----------|------|---------|
| `get_auth_org_id()` | Helper | Get user's organization ID |
| `update_modified_column()` | Trigger | Auto-update timestamps |
| `update_updated_at_column()` | Trigger | Auto-update timestamps |
| `sync_project_units()` | Trigger | Sync project unit counts |
| `sync_project_units_on_delete()` | Trigger | Sync on property deletion |
| `update_lead_score_after_insight()` | Trigger | Update lead scoring |
| `set_invoice_number()` | Trigger | Generate invoice numbers |
| `log_audit()` | Utility | Create audit logs |

## Notes

> [!IMPORTANT]
>
> - Functions marked as `STABLE` can be used in indexes and WHERE clauses
> - Trigger functions must return `TRIGGER` type
> - Always test functions in development before deploying

> [!TIP]
>
> - Use `LANGUAGE sql` for simple functions (better performance)
> - Use `LANGUAGE plpgsql` for complex logic
> - Mark functions as `SECURITY DEFINER` carefully (runs with creator's permissions)
