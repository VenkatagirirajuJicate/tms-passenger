-- Migration: Add Parent App Authentication Support
-- Description: Creates tables and functions for MYJKKN parent app authentication

-- Add parent_app to auth_source enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_source') THEN
        CREATE TYPE auth_source AS ENUM ('external_api', 'admin_created');
    END IF;
    
    -- Add parent_app value if it doesn't exist
    BEGIN
        ALTER TYPE auth_source ADD VALUE 'parent_app';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Create parent_app_sessions table for managing authentication sessions
CREATE TABLE IF NOT EXISTS parent_app_sessions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ NOT NULL,
    parent_user_id TEXT NOT NULL, -- ID from parent app
    parent_user_data JSONB DEFAULT '{}', -- User data from parent app
    session_data JSONB DEFAULT '{}', -- Additional session metadata
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_app_sessions_student_id ON parent_app_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_app_sessions_access_token ON parent_app_sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_parent_app_sessions_parent_user_id ON parent_app_sessions(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_app_sessions_expires_at ON parent_app_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_parent_app_sessions_active ON parent_app_sessions(is_active) WHERE is_active = true;

-- Create parent_app_auth_logs table for audit trail
CREATE TABLE IF NOT EXISTS parent_app_auth_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    parent_user_id TEXT,
    action VARCHAR(100) NOT NULL, -- login, logout, token_refresh, session_expired
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_parent_app_auth_logs_student_id ON parent_app_auth_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_app_auth_logs_parent_user_id ON parent_app_auth_logs(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_app_auth_logs_action ON parent_app_auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_parent_app_auth_logs_created_at ON parent_app_auth_logs(created_at);

-- Add RLS policies for parent_app_sessions
ALTER TABLE parent_app_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Students can only see their own sessions
CREATE POLICY "Students can view own sessions" ON parent_app_sessions
    FOR SELECT USING (
        student_id = auth.uid()::uuid OR
        student_id::text = auth.jwt() ->> 'sub'
    );

-- Policy: Students can update their own sessions
CREATE POLICY "Students can update own sessions" ON parent_app_sessions
    FOR UPDATE USING (
        student_id = auth.uid()::uuid OR
        student_id::text = auth.jwt() ->> 'sub'
    );

-- Add RLS policies for parent_app_auth_logs
ALTER TABLE parent_app_auth_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own auth logs
CREATE POLICY "Students can view own auth logs" ON parent_app_auth_logs
    FOR SELECT USING (
        student_id = auth.uid()::uuid OR
        student_id::text = auth.jwt() ->> 'sub'
    );

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_parent_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired sessions
    DELETE FROM parent_app_sessions 
    WHERE expires_at < now() OR (last_used_at < now() - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup action
    INSERT INTO parent_app_auth_logs (
        action, 
        success, 
        request_data
    ) VALUES (
        'session_cleanup', 
        true, 
        jsonb_build_object('deleted_sessions', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and refresh parent app session
CREATE OR REPLACE FUNCTION validate_parent_session(session_token TEXT)
RETURNS TABLE(
    valid BOOLEAN,
    student_id UUID,
    parent_user_id TEXT,
    expires_at TIMESTAMPTZ,
    needs_refresh BOOLEAN
) AS $$
DECLARE
    session_record parent_app_sessions%ROWTYPE;
BEGIN
    -- Find active session
    SELECT * INTO session_record
    FROM parent_app_sessions
    WHERE access_token = session_token
    AND is_active = true
    AND expires_at > now();
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TIMESTAMPTZ, false;
        RETURN;
    END IF;
    
    -- Update last_used_at
    UPDATE parent_app_sessions 
    SET last_used_at = now(), updated_at = now()
    WHERE id = session_record.id;
    
    -- Check if token needs refresh (expires within 1 hour)
    RETURN QUERY SELECT 
        true,
        session_record.student_id,
        session_record.parent_user_id,
        session_record.expires_at,
        (session_record.expires_at < now() + INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parent_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_parent_app_sessions_timestamp ON parent_app_sessions;
CREATE TRIGGER update_parent_app_sessions_timestamp
    BEFORE UPDATE ON parent_app_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_session_timestamp();

-- Update students table to support parent app authentication
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS parent_app_user_id TEXT,
ADD COLUMN IF NOT EXISTS parent_app_data JSONB DEFAULT '{}';

-- Create index for parent app user ID
CREATE INDEX IF NOT EXISTS idx_students_parent_app_user_id ON students(parent_app_user_id) WHERE parent_app_user_id IS NOT NULL;

-- Function to find or create student from parent app data
CREATE OR REPLACE FUNCTION find_or_create_student_from_parent_app(
    parent_user_data JSONB
)
RETURNS UUID AS $$
DECLARE
    student_id UUID;
    parent_user_id TEXT;
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Extract user data
    parent_user_id := parent_user_data ->> 'id';
    user_email := parent_user_data ->> 'email';
    user_name := parent_user_data ->> 'full_name';
    
    -- Try to find existing student by parent app user ID
    SELECT id INTO student_id
    FROM students
    WHERE parent_app_user_id = parent_user_id;
    
    -- If not found, try to find by email
    IF student_id IS NULL THEN
        SELECT id INTO student_id
        FROM students
        WHERE email = user_email;
        
        -- If found by email, update with parent app user ID
        IF student_id IS NOT NULL THEN
            UPDATE students 
            SET 
                parent_app_user_id = parent_user_id,
                parent_app_data = parent_user_data,
                auth_source = 'parent_app',
                updated_at = now()
            WHERE id = student_id;
        END IF;
    END IF;
    
    -- If still not found, create new student record
    IF student_id IS NULL THEN
        INSERT INTO students (
            student_name,
            email,
            parent_app_user_id,
            parent_app_data,
            auth_source,
            roll_number,
            mobile,
            first_login_completed
        ) VALUES (
            user_name,
            user_email,
            parent_user_id,
            parent_user_data,
            'parent_app',
            'PARENT_' || parent_user_id, -- Temporary roll number
            parent_user_data ->> 'phone_number',
            true -- Parent app users don't need first login
        ) RETURNING id INTO student_id;
    END IF;
    
    RETURN student_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE parent_app_sessions IS 'Manages authentication sessions from MYJKKN parent app';
COMMENT ON TABLE parent_app_auth_logs IS 'Audit trail for parent app authentication events';
COMMENT ON FUNCTION find_or_create_student_from_parent_app IS 'Finds existing student or creates new one from parent app user data';





