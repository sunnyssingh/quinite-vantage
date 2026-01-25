# Installation Guide

Complete step-by-step guide to set up Quinite Vantage from scratch.

---

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Supabase Account** ([Sign up](https://supabase.com))
- **OpenAI API Key** ([Get key](https://platform.openai.com/api-keys))
- **Plivo Account** ([Sign up](https://www.plivo.com)) - Optional for AI calling

---

## Step 1: Clone & Install

```bash
# Navigate to project directory
cd quinite-vantage

# Install dependencies
npm install
```

---

## Step 2: Database Setup

### Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: Quinite Vantage
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

### Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Open `database/schema.sql` from your project
3. Copy entire contents
4. Paste into SQL Editor
5. Click **"Run"**
6. ✅ Should complete in ~10 seconds

### Run Seed Data

1. Open `database/seed.sql`
2. Copy contents
3. Paste into SQL Editor
4. Click **"Run"**
5. ✅ Creates subscription plans

### Get Database Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → You'll need this for `.env`
   - **Anon/Public Key** → You'll need this for `.env`
   - **Service Role Key** → You'll need this for `.env` (keep secret!)

---

## Step 3: Environment Configuration

### Create .env File

```bash
cp .env.example .env
```

### Fill in Credentials

Open `.env` and update:

```env
# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Keep secret!

# OpenAI (for AI calling)
OPENAI_API_KEY=sk-proj-...

# Plivo (for telephony)
PLIVO_AUTH_ID=your_auth_id
PLIVO_AUTH_TOKEN=your_auth_token
PLIVO_PHONE_NUMBER=+1234567890

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: AI calling features require both OpenAI and Plivo. You can skip these for CRM-only usage.

---

## Step 4: Run Development Server

```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)**

---

## Step 5: Create First User

### Sign Up

1. Click **"Sign Up"**
2. Enter email and password
3. Check email for verification link
4. Click verification link

### Create Organization

1. After login, you'll see onboarding
2. Fill in organization details:
   - **Organization Name**
   - **Business Type**
   - **Contact Info**
3. Click **"Complete Setup"**

### You're Ready! 🎉

---

## Optional: Setup AI Calling

### Get OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Copy key (starts with `sk-proj-...`)
4. Add to `.env` as `OPENAI_API_KEY`

### Setup Plivo

1. Sign up at [plivo.com](https://www.plivo.com)
2. Get **Auth ID** and **Auth Token** from dashboard
3. Buy a phone number (Voice-enabled)
4. Add credentials to `.env`:

   ```env
   PLIVO_AUTH_ID=your_auth_id
   PLIVO_AUTH_TOKEN=your_auth_token
   PLIVO_PHONE_NUMBER=+1234567890
   ```

### Test AI Call

1. Go to **CRM** → **Campaigns**
2. Create a test campaign
3. Add a lead with valid phone number
4. Click **"Start Campaign"**
5. AI will call the lead!

---

## Troubleshooting

### "Cannot connect to database"

- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify Supabase project is running
- Ensure you ran `schema.sql`

### "User not found in profiles table"

- Check `handle_new_user()` trigger exists
- Manually insert profile:

  ```sql
  INSERT INTO profiles (id, email) 
  VALUES ('user-uuid', 'user@email.com');
  ```

### "Organization not found"

- Complete onboarding flow
- Check `profiles.organization_id` is set

### "AI call fails"

- Verify `OPENAI_API_KEY` is valid
- Check `PLIVO_AUTH_ID` and `PLIVO_AUTH_TOKEN`
- Ensure phone number is verified in Plivo

---

## Next Steps

- [Database Schema](./DATABASE.md) - Understand the data model
- [Environment Variables](./ENVIRONMENT.md) - Full configuration reference
- [API Documentation](../development/API.md) - Build integrations
- [Troubleshooting](../development/TROUBLESHOOTING.md) - Common issues

---

## Production Deployment

See [Deployment Guide](../deployment/PRODUCTION.md) for Vercel/production setup.
