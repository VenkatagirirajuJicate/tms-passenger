-- Fix for confirmation_token NULL issue in parent app database
-- This script addresses the "converting NULL to string is unsupported" error

-- IMPORTANT: This script should be run on the PARENT APP database (my.jkkn.ac.in)
-- NOT on the TMS application database

-- Option 1: Update NULL values to empty strings
UPDATE auth.users 
SET confirmation_token = '' 
WHERE confirmation_token IS NULL;

-- Option 2: Update NULL values to a default token (if needed)
-- UPDATE auth.users 
-- SET confirmation_token = 'no_token_required' 
-- WHERE confirmation_token IS NULL;

-- Option 3: Modify the column to allow NULL values properly (if using Go/SQL driver)
-- This requires updating the Go application code to handle nullable strings
-- ALTER TABLE auth.users ALTER COLUMN confirmation_token DROP NOT NULL;

-- Verify the fix
SELECT 
    COUNT(*) as total_users,
    COUNT(confirmation_token) as users_with_token,
    COUNT(*) - COUNT(confirmation_token) as users_with_null_token
FROM auth.users;

-- Check specific user
SELECT 
    id, 
    email, 
    confirmation_token,
    CASE 
        WHEN confirmation_token IS NULL THEN 'NULL'
        WHEN confirmation_token = '' THEN 'EMPTY'
        ELSE 'HAS_VALUE'
    END as token_status
FROM auth.users 
WHERE email = 'arthanareswaran22@jkkn.ac.in';
