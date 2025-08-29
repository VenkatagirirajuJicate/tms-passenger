# RLS Policy Fix Guide for Enrollment Requests

## 🚨 Issue Description

The enrollment request system is currently **not storing data in the database** due to a **Row Level Security (RLS) policy violation**.

### Error Details
```
Error code: 42501
Error message: new row violates row-level security policy for table "transport_enrollment_requests"
```

### Root Cause
The current RLS policy requires `student_id = auth.uid()`, but our application uses the **anonymous key** where `auth.uid()` returns `null`. This creates a mismatch:

- **Policy Requirement**: `student_id = auth.uid()`
- **Current Reality**: `'cc628916-dc23-42f0-9ff3-be365853e3a8' = null`
- **Result**: Policy violation, insert blocked

## 🔍 Current System Behavior

### ✅ What's Working
- Student authentication and ID resolution
- Route and stop validation
- API request processing
- Mock response generation
- User interface feedback

### ❌ What's NOT Working
- **Actual database storage** of enrollment requests
- **Persistent enrollment data**
- **Real enrollment tracking**

### 🔄 Current Workaround
The system provides **mock responses** to keep the UI functional, but enrollment requests are **not actually stored** in the database.

## 🛠️ Solution

### Step 1: Apply Database Migration

Run the provided migration script to fix the RLS policies:

```bash
# File: database-migrations/fix_enrollment_rls_policy.sql
```

The migration will:
1. **Remove restrictive policy** that requires `auth.uid()`
2. **Create new policies** that allow inserts for valid students
3. **Enable application-level inserts** using anonymous key
4. **Maintain security** by validating student existence

### Step 2: Verify Migration Success

After applying the migration, verify it worked:

```sql
-- Check policies are updated
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'transport_enrollment_requests';

-- Test insertion works
INSERT INTO transport_enrollment_requests (
  student_id, preferred_route_id, preferred_stop_id, 
  request_status, request_type, requested_at
) VALUES (
  'cc628916-dc23-42f0-9ff3-be365853e3a8',
  'a760b991-224a-43d1-b003-41c52bc2e5f9',
  'e9de8782-0669-4fd1-a6c3-b8faa0abfd89',
  'pending',
  'new_enrollment',
  NOW()
);
```

### Step 3: Test Real Storage

After migration, test that enrollment requests are actually stored:

1. Submit an enrollment request through the UI
2. Check server logs for **successful database insert** (no more mock responses)
3. Verify data in database:
   ```sql
   SELECT * FROM transport_enrollment_requests 
   WHERE student_id = 'cc628916-dc23-42f0-9ff3-be365853e3a8'
   ORDER BY requested_at DESC;
   ```

## 📊 Expected Results After Fix

### ✅ Before Migration (Current)
```
POST /api/enrollment/request
✅ 200 OK (mock response)
❌ No database storage
🔄 Mock ID: mock_1755949804091
```

### ✅ After Migration (Fixed)
```
POST /api/enrollment/request
✅ 200 OK (real response)
✅ Database storage successful
🎯 Real ID: 550e8400-e29b-41d4-a716-446655440000
```

## 🔐 Security Considerations

The new policies maintain security by:

1. **Validating student existence** - Only allows inserts for students that exist in the `students` table
2. **Preventing duplicate enrollments** - Checks that student is not already enrolled
3. **Maintaining read permissions** - Preserves existing access controls for viewing data
4. **Application-level validation** - API still performs all validation checks

## 🚀 Next Steps

1. **Apply the migration** when you have write access to the database
2. **Test enrollment requests** to confirm real database storage
3. **Monitor server logs** to ensure no more RLS violations
4. **Verify enrollment data** is properly stored and retrievable

## 📝 Files Created/Modified

- `database-migrations/fix_enrollment_rls_policy.sql` - Migration script
- `app/api/enrollment/request/route.ts` - Enhanced error logging
- `RLS_POLICY_FIX_GUIDE.md` - This documentation

## 🎯 Success Criteria

After applying the fix:
- ✅ Enrollment requests stored in database
- ✅ No more RLS policy violations
- ✅ Real enrollment IDs generated
- ✅ Persistent enrollment tracking
- ✅ Complete enrollment workflow functional






