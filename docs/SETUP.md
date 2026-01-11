# Quinite Vantage Setup Guide

## 1. Environment Setup

Copy `.env.example` to `.env` and fill in the required values:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
# ... other vars
```

## 2. Database Setup

We have consolidated all database migrations into a master schema.

1. Go to your Supabase Dashboard -> SQL Editor.
2. Open `migrations/000_master_schema.sql` and run it.
   - This creates all tables (`leads`, `call_logs`, `campaigns`, `projects`) and columns.
3. Open `migrations/001_rls_policies.sql` and run it.
   - This enables Row Level Security for data isolation.

## 3. Install Dependencies

```bash
npm install
```

## 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

## 5. WebSocket Server Setup

The WebSocket server runs on the same Express instance in `server.js` (or `websocker-server/index.js` for standalone).

To run the standalone WebSocket server for testing:

```bash
node websocker-server/index.js
```

## 6. Plivo Configuration

1. Create a Plivo Application in your Plivo Console.
2. Set the **Answer URL** to your server's endpoint: `https://your-domain.com/answer`
3. Ensure your server is publicly accessible (use ngrok for local dev).
