-- GreenLoop Database Initial Setup
-- Create extensions and custom types

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom ENUM types
CREATE TYPE user_role AS ENUM ('employee', 'admin', 'sustainability_manager');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE badge_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');
CREATE TYPE badge_criteria_type AS ENUM ('action_count', 'points_total', 'streak_days', 'category_master');
CREATE TYPE challenge_type AS ENUM ('individual', 'team', 'department', 'company_wide');
CREATE TYPE target_metric AS ENUM ('actions_count', 'points_total', 'impact_value');
CREATE TYPE transaction_type AS ENUM ('earned', 'bonus', 'penalty', 'adjustment');
CREATE TYPE team_member_role AS ENUM ('member', 'leader', 'co_leader');
CREATE TYPE data_type AS ENUM ('string', 'number', 'boolean', 'json');
CREATE TYPE admin_permission_type AS ENUM ('user_management', 'content_management', 'system_settings', 'reports_access', 'challenge_management');
