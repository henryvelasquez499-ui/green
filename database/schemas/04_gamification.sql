-- Gamification System Tables

-- Achievement badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria_type badge_criteria_type NOT NULL,
  criteria_value INTEGER,
  category_id UUID REFERENCES action_categories(id), -- For category-specific badges
  rarity badge_rarity DEFAULT 'common',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User earned badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- User points tracking
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_action_date DATE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Point transaction history
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_id UUID REFERENCES sustainability_actions(id),
  points INTEGER NOT NULL,
  transaction_type transaction_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
