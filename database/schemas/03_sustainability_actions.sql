-- Sustainability Actions Tables

-- Action categories for organizing sustainability actions
CREATE TABLE action_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7), -- Hex color for theming
  points_multiplier DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Main sustainability actions table
CREATE TABLE sustainability_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES action_categories(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  impact_value DECIMAL(10,2), -- Quantified impact (kg CO2, kWh, etc.)
  impact_unit VARCHAR(20), -- 'kg_co2', 'kwh', 'liters', etc.
  points_earned INTEGER DEFAULT 0,
  verification_status verification_status DEFAULT 'pending',
  verification_notes TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  action_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- File attachments for sustainability actions
CREATE TABLE action_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID REFERENCES sustainability_actions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
