# Route Location Swap Issue - Debugging Guide

## 🚨 Problem Description

In the student application, the "My Routes" section is showing:
- **Starting Point** as the actual destination point
- **Destination Point** as the actual starting point

This suggests that the `start_location` and `end_location` values are swapped either in the database or during data transformation.

## 🔍 Root Cause Analysis

The issue could be in one of these areas:

1. **Database Data Incorrect** - The `start_location` and `end_location` values in the `routes` table are swapped
2. **Data Transformation Bug** - There's a bug in the data transformation logic
3. **API Response Issue** - The API is returning swapped values
4. **Frontend Display Bug** - The frontend is displaying the values incorrectly

## 🛠️ Debugging Steps

### Step 1: Check Browser Console

1. Open the student application
2. Navigate to "My Routes" page
3. Open browser console (F12)
4. Look for debug logs starting with "🔍 ROUTE LOCATION DEBUG:"

You should see logs like:
```
🔍 ROUTE LOCATION DEBUG:
   - startLocation: [value]
   - endLocation: [value]
   - routeName: [value]
   - routeNumber: [value]
```

### Step 2: Check Database Directly

Run the SQL script `debug-route-locations.sql` in your Supabase SQL editor to see the actual database values.

**Expected Output:**
- `start_location` should be the actual starting point (e.g., "City Center")
- `end_location` should be the actual destination (e.g., "College Campus")

**If Swapped:**
- `start_location` shows campus location
- `end_location` shows city location

### Step 3: Run Debug Script

Run the Node.js debug script:
```bash
cd passenger
node debug-route-locations.js
```

This will show all routes and identify potential swaps.

## 🐛 Common Issues & Solutions

### Issue 1: Database Data is Swapped

**Symptoms:**
- Console shows correct values but display is wrong
- Database has campus location as start_location

**Solution:**
```sql
-- Fix the swapped locations for a specific route
UPDATE routes 
SET 
  start_location = end_location,
  end_location = start_location
WHERE route_number = 'R001';

-- Or fix all routes if needed
UPDATE routes 
SET 
  start_location = end_location,
  end_location = start_location
WHERE status = 'active';
```

### Issue 2: Data Transformation Bug

**Symptoms:**
- Database values are correct
- Console shows swapped values
- API returns correct values

**Solution:**
Check the `transformRoute` function in `passenger/lib/supabase.ts` around line 81.

### Issue 3: Frontend Display Bug

**Symptoms:**
- All data is correct
- Display logic is wrong

**Solution:**
Check the routes page component in `passenger/app/dashboard/routes/page.tsx` around line 320-400.

## 🔧 Quick Fixes

### Fix 1: Swap Database Values (If Data is Wrong)

```sql
-- Quick fix for all routes
UPDATE routes 
SET 
  start_location = end_location,
  end_location = start_location
WHERE status = 'active';
```

### Fix 2: Frontend Swap (If Display is Wrong)

In `passenger/app/dashboard/routes/page.tsx`, swap the display:

```tsx
{/* Starting Point */}
<p className="font-semibold text-green-900">{route.endLocation}</p>
<p className="text-sm text-green-700">Starting Point</p>

{/* Destination */}
<p className="font-semibold text-red-900">{route.startLocation}</p>
<p className="text-sm text-red-700">Destination</p>
```

### Fix 3: Data Transformation Swap (If API is Wrong)

In `passenger/lib/supabase.ts`, swap the mapping:

```typescript
const transformRoute = (dbRoute: Record<string, unknown>): Route => ({
  // ... other fields
  startLocation: dbRoute.end_location as string,  // SWAPPED
  endLocation: dbRoute.start_location as string,  // SWAPPED
  // ... other fields
});
```

## 📋 Verification Checklist

- [ ] Browser console shows correct location values
- [ ] Database has correct start/end locations
- [ ] API returns correct values
- [ ] Frontend displays correct values
- [ ] Route stops are in correct order
- [ ] Student allocations use correct route data

## 🚀 Next Steps

1. **Run the debug scripts** to identify the exact issue
2. **Check the console logs** to see what values are being received
3. **Verify database data** using the SQL script
4. **Apply the appropriate fix** based on where the issue is
5. **Test the fix** by refreshing the routes page

## 📞 Support

If the issue persists after following this guide:
1. Check the console logs for error messages
2. Verify the database schema matches expectations
3. Test with a fresh route allocation
4. Check if the issue affects all routes or just specific ones
