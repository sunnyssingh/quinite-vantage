# Quinite Vantage - Complete Documentation

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Tech Stack:** Next.js 15 + Supabase + Plivo + OpenAI

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [User Roles](#user-roles)
5. [Application Flow](#application-flow)
6. [Technical Architecture](#technical-architecture)
7. [Database Schema](#database-schema)
8. [API Documentation](#api-documentation)
9. [Deployment](#deployment)
10. [Compliance](#compliance)

---

## Overview

**Quinite Vantage** is an AI-powered call automation platform designed for businesses in India to:
- Automate lead calling with AI agents
- Qualify prospects intelligently
- Transfer interested leads to employees
- Track conversions and analytics

### Key Benefits
- 📞 **Automated Calling** - AI handles initial conversations
- ✅ **Smart Qualification** - Only transfers qualified leads
- 📊 **Real-time Analytics** - Track performance metrics
- 🔒 **Secure & Compliant** - TRAI compliant, role-based access

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Plivo account (for real calling)
- OpenAI API key (for AI voice)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd vantage-main

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
# Execute all SQL files in /migrations folder in Supabase

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Plivo (for real calling)
PLIVO_AUTH_ID=your_auth_id
PLIVO_AUTH_TOKEN=your_auth_token
PLIVO_PHONE_NUMBER=+91XXXXXXXXXX

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Features

### ✅ Implemented

#### 1. Authentication & Onboarding
- Email/password authentication
- Email confirmation
- Organization setup
- Role assignment

#### 2. User Management
- Create/edit/delete users
- Role-based permissions
- Phone number tracking
- Organization isolation

#### 3. Project Management
- Create projects
- Assign leads to projects
- Track project analytics

#### 4. Lead Management
- Import leads
- Track call status
- Recording consent
- Lead qualification

#### 5. Campaign Management
- Create campaigns
- Schedule with date/time windows
- AI script configuration
- Batch calling

#### 6. AI Call Automation
- Simulated calling (for testing)
- Random outcome generation
- Call logging
- Employee assignment

#### 7. Analytics
- Real-time dashboard
- Conversion tracking
- Campaign performance
- Auto-refresh (30s)

#### 8. Call Recording
- Recording storage
- Playback controls
- Transcript display
- Download capability

### 🚧 Ready for Integration

- Plivo telephony API
- OpenAI Realtime API
- Live call transfer
- Real-time monitoring

---

## User Roles

### Platform Admin
**Access:** System-wide  
**Permissions:** All features across all organizations  
**Use Case:** Platform maintenance

### Client Super Admin
**Access:** Organization-wide  
**Permissions:**
- Manage users
- Create/edit/delete projects
- Create/run campaigns
- View all analytics
- Access audit logs

### Manager
**Access:** Organization-wide (limited)  
**Permissions:**
- View/create campaigns
- Manage leads
- View analytics
- Cannot delete users

### Employee
**Access:** Limited  
**Permissions:**
- View assigned tasks
- Receive transferred calls
- **Required:** Phone number

---

## Application Flow

### 1. User Onboarding

```
Sign Up → Email Confirmation → Onboarding
    ↓
Enter Organization Details
    ↓
Assign Client Super Admin Role
    ↓
Redirect to Dashboard
```

### 2. Setup Process

```
Add Employees (with phone numbers)
    ↓
Create Projects
    ↓
Import Leads
    ↓
Create Campaigns
```

### 3. Campaign Execution

```
Start Campaign
    ↓
Validate Time Window
    ↓
For Each Lead:
  - Call lead
  - AI conversation
  - Qualify lead
  - If qualified → Transfer to employee
  - Log result
    ↓
Update Analytics
    ↓
Show Results
```

---

## Technical Architecture

### Frontend Structure

```
app/
├── page.js                    # Landing/Login
├── onboarding/               # Organization setup
│   └── page.js
├── dashboard/                # Main application
│   ├── page.js              # Dashboard
│   ├── campaigns/           # Campaign management
│   ├── leads/               # Lead management
│   ├── users/               # User management
│   ├── analytics/           # Analytics
│   ├── projects/            # Project management
│   └── audit/               # Audit logs
```

### API Structure

```
app/api/
├── auth/                    # Authentication
│   ├── signup/
│   ├── signin/
│   ├── signout/
│   └── callback/
├── campaigns/               # Campaign CRUD
│   └── [id]/
│       ├── start/          # Start campaign
│       └── logs/           # Call logs
├── leads/                   # Lead CRUD
│   └── [id]/
│       └── call/           # Individual call
├── users/                   # User CRUD
│   └── [id]/               # Update/delete
├── analytics/               # Metrics
│   ├── overview/
│   └── campaigns/
└── call-logs/              # Recording access
    └── [id]/recording/
```

### Component Structure

```
components/
├── ui/                      # Shadcn UI components
│   ├── button.jsx
│   ├── card.jsx
│   ├── dialog.jsx
│   ├── table.jsx
│   └── ...
└── CallRecordingPlayer.js  # Custom components
```

---

## Database Schema

### Core Tables

#### profiles
```sql
- id (UUID, PK)
- email (TEXT)
- full_name (TEXT)
- phone (TEXT)
- organization_id (UUID, FK)
- role_id (UUID, FK)
- is_platform_admin (BOOLEAN)
- created_at (TIMESTAMP)
```

#### organizations
```sql
- id (UUID, PK)
- name (TEXT)
- industry (TEXT)
- size (TEXT)
- created_at (TIMESTAMP)
```

#### projects
```sql
- id (UUID, PK)
- name (TEXT)
- description (TEXT)
- organization_id (UUID, FK)
- client_name (TEXT)
- status (TEXT)
- created_at (TIMESTAMP)
```

#### leads
```sql
- id (UUID, PK)
- name (TEXT)
- email (TEXT)
- phone (TEXT)
- project_id (UUID, FK)
- organization_id (UUID, FK)
- status (TEXT)
- call_status (TEXT)
- transferred_to_human (BOOLEAN)
- call_date (TIMESTAMP)
- recording_consent (BOOLEAN)
- created_at (TIMESTAMP)
```

#### campaigns
```sql
- id (UUID, PK)
- name (TEXT)
- description (TEXT)
- project_id (UUID, FK)
- organization_id (UUID, FK)
- start_date (DATE)
- end_date (DATE)
- time_start (TIME)
- time_end (TIME)
- ai_script (TEXT)
- ai_voice (TEXT)
- ai_language (TEXT)
- status (TEXT)
- total_calls (INTEGER)
- transferred_calls (INTEGER)
- created_at (TIMESTAMP)
```

#### call_logs
```sql
- id (UUID, PK)
- campaign_id (UUID, FK)
- lead_id (UUID, FK)
- call_sid (TEXT)
- call_status (TEXT)
- transferred (BOOLEAN)
- transferred_to_user_id (UUID, FK)
- transferred_to_phone (TEXT)
- call_timestamp (TIMESTAMP)
- duration (INTEGER)
- recording_url (TEXT)
- recording_duration (INTEGER)
- recording_format (TEXT)
- transcript (TEXT)
- ai_summary (TEXT)
- notes (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

---

## API Documentation

### Authentication

#### POST /api/auth/signup
Create new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { "id": "...", "email": "..." },
  "needsConfirmation": true
}
```

#### POST /api/auth/signin
Sign in existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Campaigns

#### POST /api/campaigns
Create new campaign.

**Request:**
```json
{
  "project_id": "uuid",
  "name": "Summer Campaign",
  "description": "...",
  "start_date": "2026-01-10",
  "end_date": "2026-01-20",
  "time_start": "09:00",
  "time_end": "18:00"
}
```

#### POST /api/campaigns/[id]/start
Start campaign calling.

**Response:**
```json
{
  "campaign": { "id": "...", "status": "completed" },
  "summary": {
    "totalCalls": 100,
    "transferredCalls": 25,
    "conversionRate": "25.00",
    "callLogs": [...]
  }
}
```

### Leads

#### POST /api/leads/[id]/call
Call individual lead.

**Response:**
```json
{
  "lead": { "id": "...", "call_status": "transferred" },
  "outcome": "transferred",
  "message": "Call transferred to employee"
}
```

---

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Database Setup

1. Create Supabase project
2. Run migrations in order:
   - `migrations/create_leads_table.sql`
   - `migrations/add_analytics_tracking.sql`
   - `migrations/create_call_logs_table.sql`
   - `migrations/add_phone_to_profiles.sql`
   - `migrations/complete_ai_infrastructure.sql`
   - `migrations/add_user_edit_delete_permissions.sql`

3. Verify tables created
4. Set up RLS policies (if needed)

---

## Compliance

### TRAI (India)
- ✅ DND registry checking (ready)
- ✅ Calling hours: 9 AM - 9 PM
- ✅ Recording consent tracking
- ✅ Opt-out mechanism

### Data Privacy
- ✅ Organization isolation
- ✅ Role-based access
- ✅ Audit logging
- ✅ Secure authentication

### Security
- ✅ Email confirmation
- ✅ Password hashing (Supabase)
- ✅ Session management
- ✅ CORS protection
- ✅ SQL injection prevention

---

## Cost Estimation (India)

### Per Call (2 min avg)
- Plivo: ₹0.80
- OpenAI: ₹10
- **Total: ~₹11 per call**

### Monthly (1000 calls)
- **Total: ~₹11,000 ($130)**

---

## Support

For issues or questions:
1. Check this documentation
2. Review `/migrations` for database setup
3. Check API responses for error messages
4. Review audit logs for debugging

---

## License

Proprietary - All rights reserved

---

## Changelog

### v1.0.0 (January 2026)
- Initial release
- User authentication & onboarding
- Campaign management
- Lead management
- Simulated AI calling
- Analytics dashboard
- Call recording infrastructure
- User management with roles
- Phone number tracking
