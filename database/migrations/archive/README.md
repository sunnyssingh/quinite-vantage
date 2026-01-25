# Migration Guide

## Active Migrations (Run in Order)

### 1. `001_core_schema.sql` - Core Database Schema

Creates the foundational tables for the application:

- `leads` - Lead management
- `call_logs` - Call tracking
- `campaigns` - Campaign management
- `projects` - Project management
- Basic indexes and constraints

### 2. `002_auth_and_organizations.sql` - Authentication & Multi-tenancy

Sets up user authentication and organization structure:

- `organizations` - Organization/tenant data
- `organization_profiles` - Organization details
- `roles` - User roles
- `profiles` - User profiles with org/role links
- `audit_logs` - Activity tracking

### 3. `003_rls_policies.sql` - Row Level Security

Implements all RLS policies for data isolation:

- Organization-scoped access
- User profile access
- Audit log access
- Non-recursive policy design

### 4. `004_cleanup_triggers.sql` - Remove Database Triggers

Removes all automatic triggers (we use API-based creation):

- Drops `on_auth_user_created` trigger
- Drops related functions
- Ensures clean state for API-driven flow

## Deprecated Migrations (Do Not Run)

These files are kept for reference but should NOT be run:

- `000_master_schema.sql` - Superseded by 001
- `003_ensure_tables_and_rsl.sql` - Superseded by 002
- `004_fix_profiles_and_trigger.sql` - Superseded by 002
- `005_auto_create_org.sql` - Deprecated (trigger-based)
- `006_fix_uuid_extension.sql` - Merged into 002
- `007_cleanup_and_fix.sql` - Merged into 002
- `008_disable_trigger.sql` - Superseded by 004
- `009_kill_trigger.sql` - Superseded by 004
- `010_final_setup.sql` - Superseded by 002 + 003 + 004

## Fresh Database Setup

If setting up a fresh database, run in this exact order:

1. `001_core_schema.sql`
2. `002_auth_and_organizations.sql`
3. `003_rls_policies.sql`
4. `004_cleanup_triggers.sql`

## Existing Database Migration

If you have an existing database, run:

1. `002_auth_and_organizations.sql` (idempotent - safe to re-run)
2. `003_rls_policies.sql` (drops old policies first)
3. `004_cleanup_triggers.sql` (ensures triggers are removed)
