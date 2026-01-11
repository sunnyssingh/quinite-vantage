# API Documentation

## Overview

This API allows access to leads, analytics, and project data for the Quinite Vantage platform.

## Authentication

All API endpoints require a valid authenticated user session.
The API uses Supabase Auth cookies.

### Error Responses

- `401 Unauthorized`: User is not logged in.
- `403 Forbidden`: User lacks permission for the resource.
- `404 Not Found`: Resource or organization not found.
- `500 Internal Server Error`: Server-side error.

---

## 1. Leads API

### Get Leads

Returns a paginated list of leads with optional filtering.

- **Endpoint**: `GET /api/leads`
- **Permissions**: `leads.view`
- **Query Parameters**:
  - `status` (optional): Filter by status (new, contacted, etc.)
  - `project_id` (optional): Filter by project ID
  - `search` (optional): Search by name, email, or phone
  - `limit` (optional): default 50
  - `offset` (optional): default 0

**Response**:

```json
{
  "leads": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+919876543210",
      "status": "new",
      "call_status": "called",
      "call_log_id": "uuid",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Create Lead

Creates a single new lead.

- **Endpoint**: `POST /api/leads`
- **Permissions**: `leads.create`
- **Body**:

```json
{
  "name": "Jane Doe",
  "phone": "+919876543210",
  "email": "jane@example.com",
  "projectId": "uuid" (optional),
  "status": "new" (optional),
  "notes": "Met at conference" (optional)
}
```

### Bulk Upload Leads

Uploads multiple leads via CSV format.

- **Endpoint**: `POST /api/leads/upload`
- **Permissions**: `leads.create`
- **Body**:

```json
{
  "leads": [
    { "name": "A", "phone": "123" },
    { "name": "B", "phone": "456" }
  ],
  "projectId": "uuid" (optional)
}
```

### Update Lead

Updates an existing lead.

- **Endpoint**: `PUT /api/leads/[id]`
- **Permissions**: `leads.edit`
- **Body**: (Partial object of lead fields)

### Delete Lead

Deletes a lead found by ID.

- **Endpoint**: `DELETE /api/leads/[id]`
- **Permissions**: `leads.delete`

---

## 2. Analytics API

### Overview Stats

Returns high-level statistics for the dashboard.

- **Endpoint**: `GET /api/analytics/overview`
- **Permissions**: `analytics.view_basic`

**Response**:

```json
{
  "overview": {
    "totalLeads": 100,
    "totalCampaigns": 5,
    "totalCalls": 50,
    "totalTransferred": 10,
    "conversionRate": 20.0
  },
  "leadsByStatus": {
    "new": 40,
    "contacted": 30
  },
  "callStatusCounts": {
    "not_called": 50,
    "called": 40,
    "transferred": 10
  },
  "transferredCount": 10,
  "recentActivity": []
}
```

### Campaign Performance

Returns metrics for all campaigns.

- **Endpoint**: `GET /api/analytics/campaigns`
- **Permissions**: `analytics.view_basic`

---

## 3. Projects API

### Get Projects

Returns all projects for the organization.

- **Endpoint**: `GET /api/projects`
- **Permissions**: `projects.view`

---

## 4. Webhooks (Plivo)

### Answer URL

Handles incoming/outgoing calls for the AI agent.

- **Endpoint**: `/answer` (WebSocket Server)
- **Method**: POST
- **Payload**: Plivo Standard Params (CallUUID, etc.)
- **Response**: XML for `<Stream>`

### WebSocket

Real-time audio stream handling.

- **Endpoint**: `/media-stream`
- **Protocol**: WebSocket (wss://)
