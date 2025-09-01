-- Default Action Categories Seed Data

INSERT INTO action_categories (id, name, description, icon, color, points_multiplier) VALUES
(uuid_generate_v4(), 'Transportation', 'Sustainable commuting and travel options', 'car', '#2563eb', 1.0),
(uuid_generate_v4(), 'Energy Conservation', 'Reducing energy consumption at work and home', 'zap', '#059669', 1.2),
(uuid_generate_v4(), 'Waste Reduction', 'Recycling and waste minimization efforts', 'trash-2', '#0891b2', 1.1),
(uuid_generate_v4(), 'Water Conservation', 'Efficient water usage practices', 'droplets', '#0284c7', 1.0),
(uuid_generate_v4(), 'Green Initiatives', 'Environmental projects and volunteering', 'leaf', '#16a34a', 1.3),
(uuid_generate_v4(), 'Sustainable Purchasing', 'Eco-friendly product choices', 'shopping-cart', '#7c3aed', 1.1),
(uuid_generate_v4(), 'Digital Sustainability', 'Reducing digital carbon footprint', 'monitor', '#dc2626', 1.0);
