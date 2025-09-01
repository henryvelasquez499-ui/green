-- Create Default Admin User (for development/testing)

INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  email_verified,
  created_at
) VALUES (
  uuid_generate_v4(),
  'admin@greenloop.com',
  'System',
  'Administrator',
  'admin',
  true,
  true,
  NOW()
);

-- Grant all admin permissions to the default admin
INSERT INTO admin_permissions (admin_id, permission_type, granted_by, granted_at)
SELECT 
  u.id,
  unnest(ARRAY['user_management', 'content_management', 'system_settings', 'reports_access', 'challenge_management']::admin_permission_type[]),
  u.id,
  NOW()
FROM users u 
WHERE u.email = 'admin@greenloop.com';
