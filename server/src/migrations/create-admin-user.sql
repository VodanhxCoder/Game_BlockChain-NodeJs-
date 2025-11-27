-- Create or update an admin user for testing role-based routing
-- Usage: Run this SQL in your MySQL client or via migration runner

-- Option 1: Update an existing user to admin
UPDATE users 
SET role = 'admin' 
WHERE username = 'your_username_here';

-- Option 2: Create a new admin user
-- Note: Password is SHA-256 hash of 'admin123'
INSERT INTO users (username, email, password_hash, playername, role, status, high_score, created_at)
VALUES (
  'admin',
  'admin@example.com',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',  -- SHA-256 of 'admin123'
  'Admin User',
  'admin',
  'active',
  0,
  NOW()
)
ON DUPLICATE KEY UPDATE role = 'admin';

-- Verify admin user exists
SELECT username, email, playername, role, status FROM users WHERE role = 'admin';
