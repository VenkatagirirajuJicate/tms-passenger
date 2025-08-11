-- Create driver_preferences table for enhanced driver settings
-- This table stores extended driver preferences including location tracking settings

CREATE TABLE IF NOT EXISTS driver_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE UNIQUE,
  location_settings JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  ui_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_driver_preferences_driver_id ON driver_preferences(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_preferences_location_settings ON driver_preferences USING GIN (location_settings);
CREATE INDEX IF NOT EXISTS idx_driver_preferences_notification_settings ON driver_preferences USING GIN (notification_settings);

-- Add comments for documentation
COMMENT ON TABLE driver_preferences IS 'Stores extended driver preferences including location tracking settings';
COMMENT ON COLUMN driver_preferences.driver_id IS 'Reference to the driver this preference belongs to';
COMMENT ON COLUMN driver_preferences.location_settings IS 'JSON object containing location tracking preferences';
COMMENT ON COLUMN driver_preferences.notification_settings IS 'JSON object containing notification preferences';
COMMENT ON COLUMN driver_preferences.ui_preferences IS 'JSON object containing UI/UX preferences';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_driver_preferences_updated_at
  BEFORE UPDATE ON driver_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_preferences_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE driver_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Drivers can only access their own preferences
CREATE POLICY "Drivers can view own preferences" ON driver_preferences
  FOR SELECT USING (auth.uid()::text = driver_id::text);

-- Policy: Drivers can update their own preferences
CREATE POLICY "Drivers can update own preferences" ON driver_preferences
  FOR UPDATE USING (auth.uid()::text = driver_id::text);

-- Policy: Drivers can insert their own preferences
CREATE POLICY "Drivers can insert own preferences" ON driver_preferences
  FOR INSERT WITH CHECK (auth.uid()::text = driver_id::text);

-- Policy: Admin users can access all driver preferences
CREATE POLICY "Admin users can access all driver preferences" ON driver_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()::uuid
    )
  );
