-- Performance Optimization Indexes

-- User lookup optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_microsoft_id ON users(microsoft_id) WHERE microsoft_id IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Authentication optimization
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_password_resets_token ON password_resets(token);

-- Admin audit optimization
CREATE INDEX idx_admin_audit_admin_date ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX idx_admin_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_admin_permissions_admin ON admin_permissions(admin_id);

-- Action queries optimization
CREATE INDEX idx_sustainability_actions_user_date ON sustainability_actions(user_id, action_date DESC);
CREATE INDEX idx_sustainability_actions_category ON sustainability_actions(category_id);
CREATE INDEX idx_sustainability_actions_verification ON sustainability_actions(verification_status);
CREATE INDEX idx_sustainability_actions_verified_by ON sustainability_actions(verified_by) WHERE verified_by IS NOT NULL;

-- Gamification optimization
CREATE INDEX idx_user_points_total ON user_points(total_points DESC);
CREATE INDEX idx_user_points_monthly ON user_points(monthly_points DESC);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at DESC);
CREATE INDEX idx_point_transactions_user_date ON point_transactions(user_id, created_at DESC);

-- Challenge optimization
CREATE INDEX idx_challenges_active ON challenges(is_active, start_date, end_date);
CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Analytics optimization
CREATE INDEX idx_user_analytics_user_event ON user_analytics(user_id, event_type, created_at DESC);
CREATE INDEX idx_user_analytics_date ON user_analytics(created_at DESC);
CREATE INDEX idx_news_articles_published ON news_articles(is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX idx_system_settings_key ON system_settings(key);
