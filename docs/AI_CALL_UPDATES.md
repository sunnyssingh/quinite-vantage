# AI Call Updates - Quick Reference

## Changes Made

### 1. Voice Scripts Updated ✅
- Removed all "AI assistant" mentions
- AI now sounds like human representative
- Natural greetings and closings

### 2. Leads Page UI Changes Needed

**Remove Call Button:**
```jsx
// DELETE THIS BUTTON from leads page:
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleCall(lead)}
  disabled={calling}
  title="Simulate AI Call"
>
  <PhoneCall className="w-4 h-4" />
</Button>
```

**Add Recording Button:**
```jsx
// ADD THIS INSTEAD:
{lead.call_log_id && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => toggleRow(lead.id)}
    title="Listen to Recording"
  >
    <Volume2 className="w-4 h-4" />
  </Button>
)}
```

### 3. Campaign Start - Call All Leads

**Update:** `app/api/campaigns/[id]/start/route.js`

**Change from:**
- Simulating random outcomes
- Updating leads in bulk

**Change to:**
- Loop through each lead
- Call `makeCall()` for each
- Create call_log for each
- Return progress

**Code:**
```javascript
// Get all leads for campaign's project
const { data: leads } = await adminClient
  .from('leads')
  .select('*')
  .eq('project_id', campaign.project_id)
  .eq('organization_id', campaign.organization_id)

// Call each lead
for (const lead of leads) {
  if (!lead.phone || !validateIndianPhone(lead.phone)) continue
  if (!lead.recording_consent) continue
  
  try {
    const callSid = await makeCall(lead.phone, lead.id, campaign.id)
    
    await adminClient.from('call_logs').insert({
      campaign_id: campaign.id,
      lead_id: lead.id,
      call_sid: callSid,
      call_status: 'initiated'
    })
    
    // Small delay between calls
    await new Promise(resolve => setTimeout(resolve, 2000))
  } catch (error) {
    console.error(`Failed to call ${lead.name}:`, error)
  }
}
```

## Summary

✅ **Voice Scripts** - Sound human now  
⏳ **Leads UI** - Remove call button, add recording button  
⏳ **Campaign** - Call all leads automatically  

**Next:** Update leads page UI and campaign start endpoint
