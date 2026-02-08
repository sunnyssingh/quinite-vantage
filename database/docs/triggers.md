# Database Triggers

## Overview

Triggers automate common database operations like updating timestamps, syncing counts, and calculating scores.

## Timestamp Triggers

### `update_modified_column()`

**Tables**: `organizations`, `profiles`, `projects`, `leads`, `subscription_plans`, `subscriptions`

**Trigger Names**: `update_org_modtime`, `update_profile_modtime`, `update_project_modtime`, `update_leads_modtime`, etc.

**Event**: BEFORE UPDATE  
**Purpose**: Automatically updates `updated_at` timestamp when a row is modified

```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### `update_updated_at_column()`

**Tables**: `lead_interactions`, `lead_profiles`

**Trigger Names**: `update_lead_interactions_updated_at`, `update_lead_profiles_updated_at`

**Event**: BEFORE UPDATE  
**Purpose**: Same as above, alternative implementation

---

## Business Logic Triggers

### `sync_project_units()`

**Table**: `properties`  
**Trigger Name**: `property_status_sync`  
**Event**: AFTER INSERT OR UPDATE  
**Purpose**: Syncs project unit counts when properties are added or status changes

```sql
-- When a property is created or status changes:
-- 1. Calculates total_units, available_units, sold_units, reserved_units
-- 2. Updates parent project's unit counts
```

**Example**:

```sql
-- Property status changes from 'available' to 'sold'
UPDATE properties SET status = 'sold' WHERE id = '...';

-- Trigger automatically updates project:
-- - available_units decreases by 1
-- - sold_units increases by 1
```

---

### `sync_project_units_on_delete()`

**Table**: `properties`  
**Trigger Name**: `property_delete_sync`  
**Event**: AFTER DELETE  
**Purpose**: Updates project unit counts when properties are deleted

---

### `update_lead_score_after_insight()`

**Table**: `conversation_insights`  
**Trigger Name**: `update_score_on_insight`  
**Event**: AFTER INSERT  
**Purpose**: Updates lead scoring when AI conversation insights are added

```sql
-- When conversation insights are added:
-- 1. Extracts sentiment score, interest level, priority
-- 2. Updates lead's score and engagement_score
-- 3. Updates last_sentiment_score
```

---

### `set_invoice_number()`

**Table**: `invoices`  
**Trigger Name**: `set_invoice_number_trigger`  
**Event**: BEFORE INSERT  
**Purpose**: Auto-generates unique invoice numbers

```sql
-- Format: INV-YYYYMMDD-NNNN
-- Example: INV-20260207-0001
```

---

## Trigger Summary

| Trigger Function | Tables | Purpose |
|------------------|--------|---------|
| `update_modified_column()` | 6 tables | Auto-update `updated_at` |
| `update_updated_at_column()` | 2 tables | Auto-update `updated_at` |
| `sync_project_units()` | properties | Sync project unit counts |
| `sync_project_units_on_delete()` | properties | Sync on property deletion |
| `update_lead_score_after_insight()` | conversation_insights | Update lead scoring |
| `set_invoice_number()` | invoices | Generate invoice numbers |

## Important Notes

> [!IMPORTANT]
>
> - Triggers run automatically - no manual intervention needed
> - Project unit counts are always accurate due to triggers
> - Lead scores are automatically updated from AI insights
> - Invoice numbers are guaranteed unique

> [!WARNING]
>
> - Disabling triggers can cause data inconsistencies
> - Bulk operations may be slower due to trigger execution
> - Always test trigger logic in development first
