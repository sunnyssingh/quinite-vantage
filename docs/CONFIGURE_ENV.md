# =====================================================

# Real-time Conversational AI - Configuration Guide

# =====================================================

## 1. Update NEXT_PUBLIC_SITE_URL in .env

Replace your current site URL with your Ngrok forwarding URL:

```env
# In your .env file:
NEXT_PUBLIC_SITE_URL=https://<your-ngrok-url>.ngrok-free.app
```

*(Make sure to use the **https** version)*

## 2. Enable Feature Flags in .env

Set these to `true` to activate real AI calling:

```env
# In your .env file:
ENABLE_REAL_CALLING=true
ENABLE_REALTIME_AI=true
```

## 3. Important: Ngrok Port

Make sure Ngrok is pointing to the correct port.
If your Next.js app is running on port **3000** (default), you must run:

```bash
ngrok http 3000
```

*(You ran `ngrok http 80` previously, which might be wrong if your app is on port 3000)*

## 4. Restart Server

After updating `.env`, stop and restart your Next.js server:

```bash
npm run dev
```

## 5. Ready to Test

1. Go to your Dashboard using `http://localhost:3000` (or the ngrok URL).
2. Start a campaign or call a test lead.
3. Plivo will now perform a real call to your phone!
