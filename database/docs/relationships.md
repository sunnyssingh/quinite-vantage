# Entity Relationships

## Core Relationships

```mermaid
erDiagram
    organizations ||--o{ profiles : "has many"
    organizations ||--o{ projects : "has many"
    organizations ||--o{ leads : "has many"
    organizations ||--o{ subscriptions : "has one/many"
    
    profiles ||--o{ projects : "creates"
    profiles ||--o{ leads : "creates/assigned"
    profiles }o--|| profiles : "reports to (manager)"
    
    projects ||--o{ properties : "has many (CASCADE DELETE)"
    projects ||--o{ leads : "associated with"
    projects ||--o{ campaigns : "associated with"
    
    properties ||--o{ property_images : "has many"
    properties ||--o{ property_features : "has many"
    properties ||--o{ leads : "linked to"
    properties ||--o{ deals : "linked to"
```

## CRM Relationships

```mermaid
erDiagram
    leads ||--|| lead_profiles : "has one"
    leads ||--o{ lead_interactions : "has many"
    leads ||--o{ lead_activities : "has many"
    leads ||--o{ lead_tasks : "has many"
    leads ||--o{ lead_documents : "has many"
    leads ||--o{ lead_tags : "has many"
    leads ||--o{ deals : "converts to"
    leads ||--o{ call_logs : "has many"
    leads }o--|| pipeline_stages : "in stage"
    
    pipelines ||--o{ pipeline_stages : "has many"
    
    deals }o--|| properties : "for property"
    deals }o--|| leads : "from lead"
```

## Calling Relationships

```mermaid
erDiagram
    campaigns ||--o{ call_logs : "has many"
    campaigns ||--o{ call_queue : "has many"
    campaigns ||--o{ call_attempts : "has many"
    campaigns ||--o{ agent_calls : "has many"
    
    leads ||--o{ call_logs : "has many"
    leads ||--o{ call_queue : "queued for"
    leads ||--o{ conversation_insights : "has insights"
    leads ||--o{ follow_up_tasks : "has tasks"
    
    call_logs ||--|| conversation_insights : "analyzed as"
    call_logs ||--o{ call_attempts : "has attempts"
    call_logs ||--o{ agent_calls : "transferred to"
```

## Billing Relationships

```mermaid
erDiagram
    subscription_plans ||--o{ subscriptions : "subscribed to"
    
    organizations ||--|| subscriptions : "has subscription"
    organizations ||--o{ payment_methods : "has payment methods"
    organizations ||--o{ invoices : "has invoices"
    organizations ||--o{ usage_logs : "has usage"
    
    subscriptions ||--o{ invoices : "generates"
    
    payment_methods ||--o{ invoices : "pays"
```

## Key Foreign Key Constraints

### CASCADE DELETE

| Parent Table | Child Table | Column | Behavior |
|--------------|-------------|--------|----------|
| `projects` | `properties` | `project_id` | **CASCADE DELETE** |

> [!IMPORTANT]
> When a project is deleted, all its properties are automatically deleted.

### SET NULL

| Parent Table | Child Table | Column | Behavior |
|--------------|-------------|--------|----------|
| `profiles` | `leads` | `assigned_to` | SET NULL |
| `properties` | `leads` | `property_id` | SET NULL |

### RESTRICT (Default)

Most other foreign keys use RESTRICT, preventing deletion if referenced records exist.

## Multi-Tenant Architecture

```mermaid
graph TD
    A[User Login] --> B[auth.users]
    B --> C[profiles]
    C --> D[organization_id]
    D --> E{RLS Check}
    E -->|Match| F[Access Granted]
    E -->|No Match| G[Access Denied]
    
    F --> H[Query Data]
    H --> I[Filter by organization_id]
    I --> J[Return Results]
```

## Data Flow Examples

### Creating a Lead

```mermaid
sequenceDiagram
    participant U as User
    participant API as API
    participant DB as Database
    participant RLS as RLS Policy
    
    U->>API: Create Lead
    API->>DB: INSERT INTO leads
    DB->>RLS: Check Policy
    RLS->>RLS: Verify organization_id
    RLS->>DB: Allow Insert
    DB->>API: Return Lead
    API->>U: Success
```

### Property Status Change

```mermaid
sequenceDiagram
    participant U as User
    participant API as API
    participant DB as Database
    participant T as Trigger
    
    U->>API: Update Property Status
    API->>DB: UPDATE properties SET status='sold'
    DB->>T: Fire property_status_sync
    T->>T: Calculate unit counts
    T->>DB: UPDATE projects SET sold_units++
    DB->>API: Success
    API->>U: Property Updated
```

## Important Notes

> [!WARNING]
>
> - Always use `organization_id` for multi-tenant queries
> - CASCADE DELETE on `properties` means deleting a project deletes all units
> - Lead scoring is automatically updated via triggers

> [!TIP]
>
> - Use admin client to avoid RLS recursion
> - Check foreign key constraints before bulk deletions
> - Monitor trigger performance on large datasets
