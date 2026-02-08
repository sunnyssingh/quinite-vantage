# Calling & Campaign Tables

## call_logs

**Purpose**: AI calling session records with transcripts and analysis.

### Key Columns

- `id`, `organization_id`, `lead_id`, `campaign_id`, `project_id`
- `call_sid` (Plivo Call UUID)
- `direction` (outbound, inbound)
- `caller_number`, `callee_number`
- `status`, `call_status`, `duration`
- `recording_url`, `conversation_transcript`
- `sentiment_score`, `interest_level`, `conversation_summary`
- `transferred`, `transferred_at`, `transfer_reason`
- `disconnect_reason`, `disconnect_notes`
- `ai_analysis` (jsonb)

### RLS Policies

- Multiple policies for org-based access

---

## campaigns

**Purpose**: Calling campaign definitions.

### Key Columns

- `id`, `organization_id`, `project_id`
- `name`, `description`, `status` (draft, active, paused, completed)
- `start_date`, `end_date`, `time_start`, `time_end`
- `total_calls`, `answered_calls`, `transferred_calls`
- `avg_sentiment_score`
- `metadata` (jsonb)

---

## call_queue

**Purpose**: Queue for outbound calls with retry logic.

### Key Columns

- `campaign_id`, `lead_id`
- `status` (queued, processing, completed, failed)
- `attempt_count`, `max_attempts`
- `next_retry_at`, `last_error`

---

## call_attempts

**Purpose**: Individual call attempt records.

### Key Columns

- `lead_id`, `campaign_id`, `call_log_id`
- `attempt_number`, `channel`
- `outcome`, `duration`
- `will_retry`, `next_retry_at`, `retry_reason`
- `voicemail_detected`

---

## agent_calls

**Purpose**: Human agent calls (transferred from AI).

### Key Columns

- `lead_id`, `campaign_id`, `ai_call_log_id`
- `agent_id`, `agent_name`
- `call_sid`, `started_at`, `ended_at`, `duration`
- `recording_url`, `transcript`
- `outcome`, `next_action`, `next_action_date`
- `agent_notes`, `sentiment_score`, `interest_level`
- `objections` (jsonb)

---

## conversation_insights

**Purpose**: AI-analyzed conversation insights.

### Key Columns

- `call_log_id`, `lead_id`
- `overall_sentiment`, `sentiment_label`, `primary_emotion`
- `intent`, `interest_level`
- `objections` (jsonb), `key_phrases` (jsonb)
- `budget_mentioned`, `budget_range`
- `timeline_mentioned`, `timeline`
- `recommended_action`, `priority_score`

### Triggers

- `update_score_on_insight`: Updates lead score when insights are added

---

## follow_up_tasks

**Purpose**: AI-generated and manual follow-up tasks.

### Key Columns

- `lead_id`, `campaign_id`
- `assigned_to`, `created_by`
- `task_type`, `title`, `description`
- `priority` (low, medium, high)
- `due_date`, `status` (pending, completed, cancelled)
- `context`, `ai_suggestion`
- `source` (manual, ai)
- `outcome`, `outcome_notes`

---

## Summary

The Calling module provides:

- **AI Calling**: Automated outbound calling with OpenAI Realtime API
- **Campaign Management**: Organized calling campaigns
- **Queue Management**: Retry logic and call scheduling
- **Conversation Analysis**: AI-powered sentiment and intent analysis
- **Human Handoff**: Seamless transfer to human agents
- **Follow-up Automation**: AI-suggested next actions
