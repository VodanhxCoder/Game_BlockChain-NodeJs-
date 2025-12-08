-- Migration: Add OAuth columns (google_id, github_id, provider) to users table
-- Date: 2025-11-14
-- Description: Adds columns needed for Google and GitHub OAuth authentication

-- Add google_id column
ALTER TABLE `users`
ADD COLUMN `google_id` VARCHAR(255) NULL COMMENT 'Google OAuth user ID' AFTER `password_hash`;

-- Add github_id column
ALTER TABLE `users`
ADD COLUMN `github_id` VARCHAR(255) NULL COMMENT 'GitHub OAuth user ID' AFTER `google_id`;

-- Add provider column
ALTER TABLE `users`
ADD COLUMN `provider` VARCHAR(50) NULL DEFAULT 'local' COMMENT 'Authentication provider (local, google, github)' AFTER `github_id`;

-- Add unique constraints
ALTER TABLE `users` ADD UNIQUE KEY `unique_google_id` (`google_id`);
ALTER TABLE `users` ADD UNIQUE KEY `unique_github_id` (`github_id`);

-- Add indexes for faster OAuth lookups
CREATE INDEX idx_google_id ON `users`(`google_id`);
CREATE INDEX idx_github_id ON `users`(`github_id`);
