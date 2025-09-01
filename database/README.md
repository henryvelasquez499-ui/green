# GreenLoop Database Foundation - Phase 1

## Overview
Complete PostgreSQL database schema for the GreenLoop Employee Sustainability Engagement Platform, designed with security, performance, and scalability in mind.

## Database Structure

### Core Tables (17 total)
1. **User Management** (3 tables)
   - users: Main user accounts with role-based access
   - user_sessions: Authentication session management
   - password_resets: Secure password reset tokens

2. **Admin Enhancement** (2 tables)
   - admin_permissions: Granular admin permission system
   - admin_audit_log: Complete audit trail for admin actions

3. **Sustainability Actions** (3 tables)
   - action_categories: Organized action types with point multipliers
   - sustainability_actions: User-logged environmental actions
   - action_attachments: File uploads for action verification

4. **Gamification System** (4 tables)
   - badges: Achievement system with rarity levels
   - user_badges: User-earned achievements tracking
   - user_points: Comprehensive points and streak system
   - point_transactions: Complete point transaction history

5. **Challenges & Teams** (4 tables)
   - challenges: Sustainability challenges and competitions
   - challenge_participants: User participation tracking
   - teams: Team formation for collaborative efforts
   - team_members: Team membership management

6. **Content & Analytics** (3 tables)
   - news_articles: Platform content management
   - user_analytics: User behavior and engagement tracking
   - system_settings: Configurable platform settings

## Security Features
- Row Level Security (RLS) policies for data isolation
- Password encryption using bcrypt
- Admin audit logging for compliance
- Input validation and sanitization
- Session management with expiration

## Performance Optimization
- Strategic indexes for common query patterns
- Optimized foreign key relationships
- Efficient data types and constraints
- Query performance monitoring ready

## Installation Instructions

1. **Setup Database**
   \`\`\`bash
   # Create database
   createdb greenloop
   
   # Run migrations in order
   psql -d greenloop -f database/migrations/000_initial_setup.sql
   psql -d greenloop -f database/schemas/01_users.sql
   psql -d greenloop -f database/schemas/02_admin_tables.sql
   # ... continue with all schema files
   \`\`\`

2. **Apply Security**
   \`\`\`bash
   psql -d greenloop -f database/security/rls_policies.sql
   psql -d greenloop -f database/security/encryption.sql
   \`\`\`

3. **Create Indexes**
   \`\`\`bash
   psql -d greenloop -f database/indexes/performance_indexes.sql
   \`\`\`

4. **Seed Data**
   \`\`\`bash
   psql -d greenloop -f database/seeds/01_default_categories.sql
   psql -d greenloop -f database/seeds/02_default_badges.sql
   psql -d greenloop -f database/seeds/03_system_settings.sql
   psql -d greenloop -f database/seeds/04_admin_user.sql
   \`\`\`

5. **Install Functions**
   \`\`\`bash
   psql -d greenloop -f database/functions/user_functions.sql
   psql -d greenloop -f database/functions/badge_functions.sql
   \`\`\`

## Environment Configuration
Copy `database/config/.env.example` to `.env` and configure your database connection settings.

## Admin Role Features
- Granular permission system with 5 permission types
- Complete audit trail for all admin actions
- User impersonation capabilities for support
- System-wide analytics and reporting access
- Content moderation and management powers

## Next Steps
Phase 1 is now complete. Proceed to Phase 2: Backend Development to build the API layer that will interact with this database foundation.
