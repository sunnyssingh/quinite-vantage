# Troubleshooting Guide

## Common Issues & Solutions

### 1. Dashboard Shows No Data

**Symptoms**: Cards show "0" or empty tables despite calls being made.

**Possible Causes**:

- Database migrations not run.
- RLS policies blocking view access.
- `leads` table updated but `call_logs` table empty.

**Solutions**:

1. **Run Migrations**: Execute `migrations/000_master_schema.sql`.
2. **Check RLS**: Execute `migrations/001_rls_policies.sql`.
3. **Verify Data**:

   ```sql
   SELECT count(*) FROM leads;
   SELECT count(*) FROM call_logs;
   ```

4. **Refresh Dashboard**: Click the "Refresh Data" button on the Analytics page.

### 2. AI Cuts Off Mid-Sentence or Doesn't Stop

**Symptoms**: User is interrupted, or AI stops while user is pausing to think.

**Solutions**:

- Adjust VAD (Voice Activity Detection) in `websocker-server/sessionUpdate.js`.
- **Too Sensitive?** Increase `threshold` (Current: 0.7).
- **Cutting Off?** Increase `silence_duration_ms` (Current: 800ms).

### 3. "Organization Not Found" Error

**Symptoms**: API returns 400 or 404 error.

**Solutions**:

- Ensure the user has an entry in the `profiles` table.
- Ensure the `organization_id` in `profiles` matches an existing organization.

### 4. WebSocket Connection Failed

**Symptoms**: Call connects but hangs up immediately or no audio.

**Solutions**:

- **Check URL**: Plivo Answer URL must be accessible (e.g., ngrok URL).
- **Check Keys**: Verify `OPENAI_API_KEY` in `.env`.
- **Check Logs**: Look for "WebSocket connection error" in server console.

### 5. CSV Upload Fails

**Symptoms**: "Invalid leads data" or "No valid leads found".

**Solutions**:

- **Format**: CSV must have `name` and `phone` headers.
- **Phone**: Must be valid Indian numbers (10 digits, or with +91).
- **Check Sample**: Download `sample_leads.csv` from dashboard to verify format.

---

## Deployment Checklist

- [ ] Environment variables set (Supabase, OpenAI, Plivo).
- [ ] Database migrations applied.
- [ ] WebSocket server running.
- [ ] Plivo application pointing to correct Answer URL.
- [ ] CORS allowed for frontend domain.
