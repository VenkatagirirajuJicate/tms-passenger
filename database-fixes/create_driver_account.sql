-- Create driver account for arthanareswaran22@jkkn.ac.in
-- Run this on your TMS Supabase database

-- First, check if driver already exists
SELECT * FROM drivers WHERE email = 'arthanareswaran22@jkkn.ac.in';

-- If driver doesn't exist, create the account
-- Note: Replace 'your_password_here' with the actual password
-- The password will be hashed using bcrypt

INSERT INTO drivers (
    id,
    name,
    email,
    phone,
    license_number,
    password_hash,
    status,
    experience_years,
    rating,
    total_trips,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'Arthanareswaran',
    'arthanareswaran22@jkkn.ac.in',
    '9876543210', -- Update with actual phone number
    'DL123456789', -- Update with actual license number
    '$2a$10$example.hash.here', -- This needs to be generated with bcrypt
    'active',
    5, -- years of experience
    4.5, -- rating out of 5
    0, -- initial trip count
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING; -- Prevents duplicate creation

-- To generate the password hash, you can use this Node.js code:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('your_password_here', 10);
-- console.log(hash);

-- Alternative: Use the API endpoint to create the driver account
-- POST /api/admin/drivers with the driver details
