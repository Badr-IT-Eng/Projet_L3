-- Add enabled and last_login_at columns to users table
ALTER TABLE users 
ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN last_login_at DATETIME NULL;

-- Update existing users to be enabled by default
UPDATE users SET enabled = TRUE WHERE enabled IS NULL;