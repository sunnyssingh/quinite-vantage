# System Tables

## audit_logs

**Purpose**: Audit trail for sensitive operations.

### Key Columns

- `id`, `organization_id`, `user_id`, `user_name`
- `action` (e.g., "project.delete", "user.update")
- `entity_type`, `entity_id`
- `metadata` (jsonb) - Additional context
- `impersonator_user_id`, `is_impersonated`

### Notes

> [!IMPORTANT]
>
> - All sensitive operations should be logged
> - Supports impersonation tracking
> - Metadata stores before/after values for updates

---

## notifications

**Purpose**: In-app notifications for users.

### Key Columns

- `id`, `user_id`
- `type` (info, warning, success, error)
- `title`, `message`, `link`
- `is_read`
- `metadata` (jsonb)

### RLS Policies

- Users can only view/update their own notifications
- Admins can create notifications for any user

---

## websocket_servers

**Purpose**: WebSocket server registry for real-time features.

### Key Columns

- `id`, `name`, `url` (UNIQUE)
- `is_active`, `status` (pending, active, inactive)
- `last_verified_at`, `priority`

### Notes

- No RLS enabled (system table)
- Used for load balancing WebSocket connections

---

## impersonation_sessions

**Purpose**: Track admin impersonation sessions.

### Key Columns

- `id`, `admin_id`, `target_user_id`
- `reason`, `active`
- `created_at`, `ended_at`

### Notes

> [!WARNING]
>
> - All impersonation actions are logged
> - Sessions must be explicitly ended
> - Audit logs track impersonated actions

---

## lead_forms

**Purpose**: Custom form definitions for lead capture.

### Key Columns

- `id`, `organization_id`, `project_id`, `campaign_id`
- `name`, `schema` (jsonb) - Form field definitions
- `is_active`

---

## Summary

The System module provides:

- **Audit Logging**: Complete audit trail
- **Notifications**: User notification system
- **WebSocket Management**: Real-time connection handling
- **Impersonation**: Secure admin impersonation
- **Form Builder**: Dynamic form creation
