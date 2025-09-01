-- Default System Settings Seed Data

INSERT INTO system_settings (key, value, description, data_type, is_public) VALUES
-- Point System Configuration
('base_action_points', '10', 'Base points awarded for each sustainability action', 'number', true),
('streak_bonus_multiplier', '1.5', 'Multiplier for streak bonuses', 'number', false),
('verification_required', 'true', 'Whether actions require admin verification', 'boolean', true),

-- Email Configuration
('smtp_enabled', 'true', 'Enable SMTP email notifications', 'boolean', false),
('welcome_email_enabled', 'true', 'Send welcome email to new users', 'boolean', false),
('achievement_notifications', 'true', 'Send notifications for new achievements', 'boolean', true),

-- Platform Configuration
('platform_name', 'GreenLoop', 'Name of the sustainability platform', 'string', true),
('max_file_upload_size', '5242880', 'Maximum file upload size in bytes (5MB)', 'number', true),
('supported_file_types', '["image/jpeg", "image/png", "image/gif", "application/pdf"]', 'Supported file types for uploads', 'json', true),

-- Challenge Configuration
('max_challenge_duration_days', '90', 'Maximum duration for challenges in days', 'number', false),
('auto_challenge_rewards', 'true', 'Automatically distribute challenge rewards', 'boolean', false),

-- Analytics Configuration
('analytics_retention_days', '365', 'Days to retain user analytics data', 'number', false),
('public_leaderboard', 'true', 'Show public leaderboard to all users', 'boolean', true);
