-- Row Level Security Policies

-- Enable RLS on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_own_data ON users 
  FOR ALL USING (id = auth.uid());

-- Users can only see their own actions
CREATE POLICY user_own_actions ON sustainability_actions 
  FOR ALL USING (user_id = auth.uid());

-- Users can only see their own points
CREATE POLICY user_own_points ON user_points 
  FOR ALL USING (user_id = auth.uid());

-- Users can only see their own badges
CREATE POLICY user_own_badges ON user_badges 
  FOR ALL USING (user_id = auth.uid());

-- Users can only see their own point transactions
CREATE POLICY user_own_transactions ON point_transactions 
  FOR ALL USING (user_id = auth.uid());

-- Users can only see their own challenge participation
CREATE POLICY user_own_challenge_participation ON challenge_participants 
  FOR ALL USING (user_id = auth.uid());

-- Users can only see their own team memberships
CREATE POLICY user_own_team_membership ON team_members 
  FOR ALL USING (user_id = auth.uid());

-- Users can only see their own analytics
CREATE POLICY user_own_analytics ON user_analytics 
  FOR ALL USING (user_id = auth.uid());

-- Admin bypass policies (admins can see all data)
CREATE POLICY admin_full_access_users ON users 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY admin_full_access_actions ON sustainability_actions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
