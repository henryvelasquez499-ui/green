-- User Management Functions

-- Function to create a new user with proper validation
CREATE OR REPLACE FUNCTION create_user(
  p_email VARCHAR(255),
  p_password VARCHAR(255),
  p_first_name VARCHAR(100),
  p_last_name VARCHAR(100),
  p_department VARCHAR(100) DEFAULT NULL,
  p_microsoft_id VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert new user
  INSERT INTO users (
    email, password_hash, first_name, last_name, department, microsoft_id
  ) VALUES (
    p_email, p_password, p_first_name, p_last_name, p_department, p_microsoft_id
  ) RETURNING id INTO new_user_id;
  
  -- Initialize user points
  INSERT INTO user_points (user_id) VALUES (new_user_id);
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update user points and streaks
CREATE OR REPLACE FUNCTION update_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_action_date DATE
)
RETURNS VOID AS $$
DECLARE
  current_points user_points%ROWTYPE;
  streak_bonus INTEGER := 0;
BEGIN
  -- Get current user points
  SELECT * INTO current_points FROM user_points WHERE user_id = p_user_id;
  
  -- Calculate streak bonus
  IF current_points.last_action_date = p_action_date - INTERVAL '1 day' THEN
    -- Continue streak
    streak_bonus := CASE 
      WHEN current_points.current_streak >= 7 THEN FLOOR(p_points * 0.5)
      WHEN current_points.current_streak >= 3 THEN FLOOR(p_points * 0.2)
      ELSE 0
    END;
  ELSIF current_points.last_action_date != p_action_date THEN
    -- Reset streak if gap in dates
    UPDATE user_points 
    SET current_streak = 1,
        last_action_date = p_action_date
    WHERE user_id = p_user_id;
  END IF;
  
  -- Update points and streak
  UPDATE user_points 
  SET 
    total_points = total_points + p_points + streak_bonus,
    monthly_points = CASE 
      WHEN EXTRACT(MONTH FROM last_action_date) = EXTRACT(MONTH FROM p_action_date) 
      THEN monthly_points + p_points + streak_bonus
      ELSE p_points + streak_bonus
    END,
    weekly_points = CASE 
      WHEN EXTRACT(WEEK FROM last_action_date) = EXTRACT(WEEK FROM p_action_date)
      THEN weekly_points + p_points + streak_bonus
      ELSE p_points + streak_bonus
    END,
    current_streak = CASE 
      WHEN last_action_date = p_action_date - INTERVAL '1 day' 
      THEN current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(longest_streak, 
      CASE 
        WHEN last_action_date = p_action_date - INTERVAL '1 day' 
        THEN current_streak + 1
        ELSE current_streak
      END
    ),
    last_action_date = p_action_date,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record point transaction
  INSERT INTO point_transactions (user_id, points, transaction_type, description)
  VALUES (p_user_id, p_points + streak_bonus, 'earned', 
    CASE WHEN streak_bonus > 0 
    THEN 'Action points with streak bonus'
    ELSE 'Action points'
    END
  );
END;
$$ LANGUAGE plpgsql;
