-- Add Phone Number to User Profiles
-- Allows tracking which employee receives transferred calls

-- Add phone column to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone 
  ON profiles(phone) WHERE phone IS NOT NULL;

-- Add transferred_to_user to call_logs
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS transferred_to_user_id UUID,
  ADD COLUMN IF NOT EXISTS transferred_to_phone TEXT;

-- Add foreign key for transferred user
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'call_logs_transferred_to_user_fkey'
  ) THEN
    ALTER TABLE call_logs 
      ADD CONSTRAINT call_logs_transferred_to_user_fkey 
      FOREIGN KEY (transferred_to_user_id) 
      REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for transferred user lookups
CREATE INDEX IF NOT EXISTS idx_call_logs_transferred_user 
  ON call_logs(transferred_to_user_id) WHERE transferred_to_user_id IS NOT NULL;

-- Verify changes
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'phone';

SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'call_logs' AND column_name IN ('transferred_to_user_id', 'transferred_to_phone');
