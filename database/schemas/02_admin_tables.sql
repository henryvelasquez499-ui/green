-- Admin Role Enhancement Tables

-- Admin permissions for granular access control
CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_type admin_permission_type NOT NULL,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW()
);

-- Admin audit log for tracking all admin actions
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'user_created', 'challenge_deleted', 'settings_updated', etc.
  target_type VARCHAR(50) NOT NULL, -- 'user', 'challenge', 'action', 'system'
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
