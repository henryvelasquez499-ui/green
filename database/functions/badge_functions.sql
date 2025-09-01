-- Badge Management Functions

-- Function to check and award badges to a user
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_stats RECORD;
  badge_record RECORD;
  badges_awarded INTEGER := 0;
BEGIN
  -- Get user statistics
  SELECT 
    up.total_points,
    up.current_streak,
    up.longest_streak,
    COUNT(sa.id) as action_count
  INTO user_stats
  FROM user_points up
  LEFT JOIN sustainability_actions sa ON sa.user_id = up.user_id
  WHERE up.user_id = p_user_id
  GROUP BY up.total_points, up.current_streak, up.longest_streak;
  
  -- Check each badge criteria
  FOR badge_record IN 
    SELECT b.* FROM badges b 
    WHERE b.is_active = true 
    AND b.id NOT IN (
      SELECT badge_id FROM user_badges WHERE user_id = p_user_id
    )
  LOOP
    -- Check if user meets badge criteria
    IF (badge_record.criteria_type = 'action_count' AND user_stats.action_count >= badge_record.criteria_value) OR
       (badge_record.criteria_type = 'points_total' AND user_stats.total_points >= badge_record.criteria_value) OR
       (badge_record.criteria_type = 'streak_days' AND user_stats.longest_streak >= badge_record.criteria_value) THEN
      
      -- Award the badge
      INSERT INTO user_badges (user_id, badge_id) 
      VALUES (p_user_id, badge_record.id);
      
      badges_awarded := badges_awarded + 1;
    END IF;
  END LOOP;
  
  RETURN badges_awarded;
END;
$$ LANGUAGE plpgsql;
