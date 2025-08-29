-- Migration: Fix RLS Policy for Transport Enrollment Requests
-- Issue: Current RLS policy requires student_id = auth.uid(), but our app uses anon key (auth.uid() = null)
-- Solution: Create additional policies that allow enrollment requests for valid students

-- Current problematic policy:
-- "Students can create their own enrollment requests" requires student_id = auth.uid()
-- But auth.uid() is null when using anon key, so inserts are blocked

-- Step 1: Drop the restrictive policy
DROP POLICY IF EXISTS "Students can create their own enrollment requests" ON transport_enrollment_requests;

-- Step 2: Create a new policy that allows inserts for valid students
-- This policy verifies that the student_id exists in the students table
CREATE POLICY "Allow enrollment requests for valid students" ON transport_enrollment_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = transport_enrollment_requests.student_id
  )
);

-- Step 3: Create an additional policy for application-level inserts
-- This allows our application to create enrollment requests when using anon key
CREATE POLICY "Allow application enrollment requests" ON transport_enrollment_requests
FOR INSERT
WITH CHECK (
  -- Allow inserts when auth.uid() is null (anon key usage)
  -- AND the student exists in the students table
  -- AND the student is not already enrolled
  (auth.uid() IS NULL) AND 
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = transport_enrollment_requests.student_id
    AND transport_enrolled = false
  )
);

-- Step 4: Ensure the SELECT policies still work for viewing requests
-- Keep existing SELECT policies as they are working correctly

-- Step 5: Add a policy for application to read enrollment requests
CREATE POLICY IF NOT EXISTS "Allow application to read enrollment requests" ON transport_enrollment_requests
FOR SELECT
USING (
  -- Allow reading when auth.uid() is null (anon key)
  -- This enables our application to check for existing requests
  auth.uid() IS NULL OR
  -- Or when it's the student's own request (existing policy)
  student_id = auth.uid() OR
  -- Or when it's an admin (existing policy)
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
);

-- Verification queries (run these after applying the migration):
-- 1. Check that policies are created correctly:
-- SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'transport_enrollment_requests';

-- 2. Test that auth.uid() is null with anon key:
-- SELECT auth.uid() as current_user_id;

-- 3. Test that a valid student exists:
-- SELECT id, student_name FROM students WHERE id = 'cc628916-dc23-42f0-9ff3-be365853e3a8';

-- 4. Test insertion (replace with actual values):
-- INSERT INTO transport_enrollment_requests (
--   student_id, preferred_route_id, preferred_stop_id, 
--   request_status, request_type, requested_at
-- ) VALUES (
--   'cc628916-dc23-42f0-9ff3-be365853e3a8',
--   'a760b991-224a-43d1-b003-41c52bc2e5f9',
--   'e9de8782-0669-4fd1-a6c3-b8faa0abfd89',
--   'pending',
--   'new_enrollment',
--   NOW()
-- );






