# Quick Fix for PhoneCall Error

## Problem
Error: "PhoneCall is not defined"

## Cause
The old `LEADS_TABLE_FIX.txt` file still had the Call button with `PhoneCall` icon.

## Solution

### ✅ Already Fixed:
1. Updated imports in `app/dashboard/leads/page.js` (removed PhoneCall, added Volume2)
2. Updated `LEADS_TABLE_FIX.txt` with correct code

### 📋 What to Do:

**Option 1: Restart Dev Server (Recommended)**
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

**Option 2: Hard Refresh Browser**
- Press `Ctrl + Shift + R` (Windows)
- Or `Cmd + Shift + R` (Mac)

## What Changed

### Before (OLD - Had Error):
```jsx
<PhoneCall className="w-4 h-4" />  // ❌ Not imported
onClick={() => handleCall(lead)}    // ❌ Function removed
```

### After (NEW - Fixed):
```jsx
<Volume2 className="w-4 h-4" />     // ✅ Recording icon
onClick={() => toggleRow(lead.id)}   // ✅ Expand row
{lead.call_log_id && ...}            // ✅ Only show if called
```

## Summary

✅ **Imports fixed** - Removed PhoneCall, added Volume2  
✅ **Table code fixed** - No call button, only recording  
✅ **File updated** - LEADS_TABLE_FIX.txt has correct code  

**Next:** Restart dev server to clear cache!
