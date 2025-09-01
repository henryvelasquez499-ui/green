-- Default Achievement Badges Seed Data

INSERT INTO badges (id, name, description, icon_url, criteria_type, criteria_value, rarity) VALUES
-- Action Count Badges
(uuid_generate_v4(), 'First Steps', 'Log your first sustainability action', '/badges/first-steps.svg', 'action_count', 1, 'common'),
(uuid_generate_v4(), 'Getting Started', 'Log 5 sustainability actions', '/badges/getting-started.svg', 'action_count', 5, 'common'),
(uuid_generate_v4(), 'Eco Warrior', 'Log 25 sustainability actions', '/badges/eco-warrior.svg', 'action_count', 25, 'rare'),
(uuid_generate_v4(), 'Sustainability Champion', 'Log 100 sustainability actions', '/badges/champion.svg', 'action_count', 100, 'epic'),
(uuid_generate_v4(), 'Planet Guardian', 'Log 500 sustainability actions', '/badges/guardian.svg', 'action_count', 500, 'legendary'),

-- Points Total Badges
(uuid_generate_v4(), 'Point Collector', 'Earn 100 total points', '/badges/collector.svg', 'points_total', 100, 'common'),
(uuid_generate_v4(), 'Point Master', 'Earn 500 total points', '/badges/master.svg', 'points_total', 500, 'rare'),
(uuid_generate_v4(), 'Point Legend', 'Earn 2000 total points', '/badges/legend.svg', 'points_total', 2000, 'epic'),

-- Streak Badges
(uuid_generate_v4(), 'Consistent Contributor', 'Maintain a 7-day streak', '/badges/consistent.svg', 'streak_days', 7, 'common'),
(uuid_generate_v4(), 'Dedication Master', 'Maintain a 30-day streak', '/badges/dedication.svg', 'streak_days', 30, 'rare'),
(uuid_generate_v4(), 'Unstoppable Force', 'Maintain a 100-day streak', '/badges/unstoppable.svg', 'streak_days', 100, 'legendary');
