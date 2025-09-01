-- Team Challenges & Competitions Tables

-- Sustainability challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  challenge_type challenge_type NOT NULL,
  target_metric target_metric NOT NULL,
  target_value INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reward_points INTEGER DEFAULT 0,
  reward_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Challenge participation tracking
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Teams for collaborative challenges
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  department VARCHAR(100),
  team_leader UUID REFERENCES users(id),
  max_members INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team membership
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role team_member_role DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
