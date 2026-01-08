# Testing Real-time AI Calling

Since Plivo needs to send webhooks to your server (and WebSockets need a public URL), you cannot test `localhost` directly. You have two options:

## Option 1: Local Testing with Ngrok (Recommended for Dev)

Use **ngrok** to create a public tunnel to your local server.

### 1. Install & Run Ngrok

```bash
# Install (if you haven't)
npm install -g ngrok

# Run tunnel pointing to your Next.js port (usually 3000)
ngrok http 3000
```

### 2. Copy the Forwarding URL

Ngrok will give you a URL like: `https://abcd-123-456.ngrok-free.app`

### 3. Update your `.env`

Update your site URL to this ngrok URL so Plivo knows where to send webhooks.

```env
# In .env file:
NEXT_PUBLIC_SITE_URL=https://abcd-123-456.ngrok-free.app
```

*(Remember to restart your dev server after changing .env)*

### 4. Enable Features

Set the feature flags to true in `.env`:

```env
ENABLE_REAL_CALLING=true
ENABLE_REALTIME_AI=true
```

### 5. Config Check

- **Restart Next.js:** `npm run dev`
- **Check Plivo Console:** Ensure your Plivo number isn't sandboxed (or verify the numbers you are calling).
- **Check OpenAI:** Verify your API key has access to `gpt-4o-realtime-preview`.

---

## Option 2: Production Deployment

Deploy to a hosting provider that supports WebSockets.

1. **Deploy** to Vercel, Railway, or similar.
2. **Environment Variables**: Add all your keys (`OPENAI_API_KEY`, `PLIVO_...`) to the deployment settings.
3. **Site URL**: Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g., `https://my-app.vercel.app`).
4. **Enable**: Set `ENABLE_REAL_CALLING` and `ENABLE_REALTIME_AI` to `true`.

---

## 🧪 How to Run a Test Call

1. **Create a Test Lead**:
   - Go to Dashboard > Leads.
   - Add a lead with **your real phone number** (must be verified if Plivo is in sandbox mode).
   - Ensure format is E.164 (e.g., `+919876543210`).
   - ensure user have recording consent.

2. **Start a Campaign**:
   - Go to Dashboard > Campaigns.
   - Create a generic campaign.
   - In the "Leads" logic, ensure your test lead is included.
   - Click **Start Campaign**.

3. **Monitor**:
   - **Terminal**: Watch for "Plivo stream started" and WebSocket logs.
   - **Dashboard**: Watch status change from `initiated` → `ringing` → `in-progress`.
   - **Phone**: Answer the call and say "Hello"!

## ⚠️ Troubleshooting

- **No Audio?** Check if `NEXT_PUBLIC_SITE_URL` starts with `https://`. Plivo requires HTTPS.
- **WebSocket Error?** Ensure your firewall isn't blocking incoming connections from Plivo.
- **"Upgrade Required"?** If using Vercel, ensure you are using a plan/configuration that supports WebSockets.
