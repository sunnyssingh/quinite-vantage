# CRM Tables

## leads

**Purpose**: Customer/prospect records with pipeline tracking and AI calling integration.

### Key Columns

- `id`, `organization_id`, `project_id`, `property_id`
- `name`, `email`, `phone`, `mobile`
- `stage_id` (FK → pipeline_stages) - **Single source of truth for lead status**
- `assigned_to` (FK → profiles)
- `source`, `lead_source`, `external_lead_id`
- `score`, `engagement_score`, `interest_level`, `purchase_readiness`
- `total_calls`, `last_sentiment_score`, `last_contacted_at`
- `metadata`, `raw_data`

### RLS Policies

- `view_org_leads`, `manage_org_leads`

### Triggers

- `update_leads_modtime`

---

## pipelines

**Purpose**: Sales pipeline definitions (e.g., "Sales Pipeline", "Rental Pipeline").

### Key Columns

- `id`, `organization_id`, `name`, `is_default`

### Relationships

- **Has many**: `pipeline_stages`

---

## pipeline_stages

**Purpose**: Stages within a pipeline (e.g., "New", "Contacted", "Qualified", "Won", "Lost").

### Key Columns

- `id`, `pipeline_id`, `name`, `order_index`, `color`

### Relationships

- **Belongs to**: `pipelines`
- **Referenced by**: `leads.stage_id`

---

## lead_profiles

**Purpose**: Extended lead information (company, job title, budget, preferences).

### Key Columns

- `lead_id` (UNIQUE, FK → leads)
- `company`, `job_title`, `location`, `industry`
- `lead_score`, `engagement_level`, `budget_range`, `timeline`
- `min_budget`, `max_budget`, `property_type_interest`
- `preferences`, `custom_fields` (jsonb)

---

## lead_interactions

**Purpose**: Communication history (emails, calls, meetings, notes).

### Key Columns

- `lead_id`, `type` (email, call, meeting, note, sms, whatsapp)
- `direction` (inbound, outbound)
- `subject`, `content`, `duration`, `outcome`
- `email_opened`, `email_clicked`

---

## lead_activities

**Purpose**: Activity timeline/feed for leads.

### Key Columns

- `lead_id`, `type`, `content` (jsonb), `created_by`

---

## lead_tasks

**Purpose**: Tasks assigned to leads (follow-ups, calls, meetings).

### Key Columns

- `lead_id`, `title`, `description`, `due_date`, `due_time`
- `priority` (low, medium, high)
- `status` (pending, completed, overdue)
- `assigned_to`, `created_by`

---

## lead_documents

**Purpose**: Files attached to leads (proposals, contracts, brochures).

### Key Columns

- `lead_id`, `file_name`, `file_url`, `file_type`, `file_size`
- `document_type` (proposal, contract, brochure, presentation, other)

---

## lead_tags

**Purpose**: Tags/labels for lead categorization.

### Key Columns

- `lead_id`, `tag`, `color`

---

## deals

**Purpose**: Closed deals/opportunities linked to leads and properties.

### Key Columns

- `lead_id`, `property_id`, `name`, `amount`
- `stage`, `probability`, `status`

---

## Summary

The CRM module provides:

- **Lead Management**: Comprehensive lead tracking with scoring
- **Pipeline Management**: Customizable sales pipelines
- **Activity Tracking**: Full communication and activity history
- **Task Management**: Follow-up and reminder system
- **Document Management**: File attachments and proposals
