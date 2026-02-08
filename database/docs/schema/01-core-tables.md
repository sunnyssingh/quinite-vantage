# Core Tables

## organizations

**Purpose**: Stores organization/tenant information for multi-tenant architecture.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Unique organization identifier |
| `name` | text | NOT NULL | Organization name |
| `slug` | text | UNIQUE | URL-friendly identifier |
| `tier` | org_tier | DEFAULT 'free' | Subscription tier (free, pro, enterprise) |
| `settings` | jsonb | DEFAULT '{}' | Organization settings |
| `sector` | text | DEFAULT 'real_estate' | Business sector |
| `business_type` | text | | Type of business |
| `company_name` | text | | Legal company name |
| `gstin` | text | | GST identification number |
| `address_line_1` | text | | Address line 1 |
| `address_line_2` | text | | Address line 2 |
| `city` | text | | City |
| `state` | text | | State/Province |
| `country` | text | DEFAULT 'India' | Country |
| `pincode` | text | | Postal code |
| `contact_number` | text | | Contact phone number |
| `onboarding_status` | onboarding_status_enum | DEFAULT 'pending' | Onboarding status |
| `caller_id` | text | | Calling system caller ID |
| `currency` | text | | Currency code (USD, INR, etc.) |
| `currency_symbol` | text | | Currency symbol |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

### Relationships

- **Referenced by**: All other tables via `organization_id`

### RLS Policies

- `organizations_service_role_all`: Service role has full access

### Triggers

- `update_org_modtime`: Updates `updated_at` on UPDATE

---

## profiles

**Purpose**: User profiles linked to auth.users, contains organization membership and role information.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, FK → auth.users.id | User ID from Supabase Auth |
| `organization_id` | uuid | FK → organizations.id | Organization membership |
| `full_name` | text | | User's full name |
| `email` | text | | Email address |
| `phone` | text | | Phone number |
| `avatar_url` | text | | Profile picture URL |
| `metadata` | jsonb | | Additional user metadata |
| `role` | user_role | DEFAULT 'employee' | User role (platform_admin, super_admin, manager, employee) |
| `manager_id` | uuid | FK → profiles.id | Manager reference |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

### Relationships

- **Belongs to**: `organizations` (via `organization_id`)
- **Self-referencing**: `manager_id` → `profiles.id`
- **Referenced by**: Multiple tables for `created_by`, `assigned_to`, etc.

### RLS Policies

- `profiles_select_own`: Users can view their own profile
- `profiles_insert_own`: Users can create their own profile
- `profiles_update_own`: Users can update their own profile
- `profiles_service_role_all`: Service role has full access

### Triggers

- `update_profile_modtime`: Updates `updated_at` on UPDATE

### Notes

> [!IMPORTANT]
>
> - Profile is automatically created via trigger when user signs up
> - `role` determines access level across the platform
> - Use admin client to query profiles to avoid RLS recursion

---

## projects

**Purpose**: Real estate projects/developments with inventory tracking.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Unique project identifier |
| `organization_id` | uuid | FK → organizations.id | Owning organization |
| `name` | text | NOT NULL | Project name |
| `description` | text | | Project description |
| `address` | text | | Project address |
| `project_type` | text | | Type of project |
| `status` | text | DEFAULT 'active' | Project status |
| `metadata` | jsonb | | Additional project data (real_estate details) |
| `image_url` | text | | Project image URL |
| `image_path` | text | | Storage path for image |
| `total_units` | integer | DEFAULT 0 | Total number of units |
| `available_units` | integer | DEFAULT 0 | Available units count |
| `sold_units` | integer | DEFAULT 0 | Sold units count |
| `reserved_units` | integer | DEFAULT 0 | Reserved units count |
| `unit_types` | jsonb | | Unit type breakdown (configuration, count, price) |
| `price_range` | jsonb | | Min/max price range |
| `show_in_inventory` | boolean | DEFAULT true | Visibility in inventory module |
| `project_status` | text | DEFAULT 'planning' | Development status (planning, under_construction, ready_to_move, completed) |
| `created_by` | uuid | FK → profiles.id | Creator user ID |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

### Relationships

- **Belongs to**: `organizations`, `profiles` (creator)
- **Has many**: `properties`, `leads`, `campaigns`

### RLS Policies

- `view_org_projects`: Users can view projects in their organization
- `manage_org_projects`: Users can manage projects in their organization
- Multiple legacy policies for backward compatibility

### Triggers

- `update_project_modtime`: Updates `updated_at` on UPDATE

### Notes

> [!IMPORTANT]
>
> - Unit counts (`total_units`, `available_units`, etc.) are auto-synced via triggers when properties change
> - `unit_types` stores detailed breakdown: `[{configuration, property_type, transaction_type, carpet_area, count, price}]`
> - `metadata.real_estate` contains legacy structured data

---

## Summary

These core tables form the foundation of the multi-tenant architecture:

1. **organizations**: Tenant isolation
2. **profiles**: User management and roles
3. **projects**: Primary business entity for real estate

All other tables reference these core tables for organization-based data isolation.
