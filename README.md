# GreenLoop - Employee Sustainability Platform

A comprehensive platform for tracking and gamifying employee sustainability actions within organizations.

## Features

### Core Functionality
- **Action Logging**: Track sustainability activities with impact measurements
- **Gamification**: Points, badges, streaks, and leaderboards
- **Challenges**: Individual and team sustainability competitions
- **Teams**: Collaborative sustainability efforts
- **Analytics**: Personal and organizational impact reporting
- **Admin Panel**: User management, action verification, and ESG reporting

### Technical Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with comprehensive schema
- **Authentication**: JWT-based with role-based access control
- **Email**: Nodemailer for notifications and verification

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd greenloop-platform
   npm run install:all
   ```

2. **Database Setup**
   ```bash
   # Create database
   createdb greenloop
   
   # Run migrations
   cd database
   psql -d greenloop -f migrations/000_initial_setup.sql
   psql -d greenloop -f schemas/01_users.sql
   psql -d greenloop -f schemas/02_admin_tables.sql
   psql -d greenloop -f schemas/03_sustainability_actions.sql
   psql -d greenloop -f schemas/04_gamification.sql
   psql -d greenloop -f schemas/05_challenges_teams.sql
   psql -d greenloop -f schemas/06_content_analytics.sql
   
   # Apply security
   psql -d greenloop -f security/rls_policies.sql
   psql -d greenloop -f security/encryption.sql
   
   # Create indexes
   psql -d greenloop -f indexes/performance_indexes.sql
   
   # Seed data
   psql -d greenloop -f seeds/01_default_categories.sql
   psql -d greenloop -f seeds/02_default_badges.sql
   psql -d greenloop -f seeds/03_system_settings.sql
   psql -d greenloop -f seeds/04_admin_user.sql
   
   # Install functions
   psql -d greenloop -f functions/user_functions.sql
   psql -d greenloop -f functions/badge_functions.sql
   ```

3. **Environment Configuration**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database and email settings
   
   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your API URL
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

   This starts both backend (port 8000) and frontend (port 3000) concurrently.

## Project Structure

```
greenloop-platform/
├── backend/                 # Node.js/Express API
│   ├── api/                # API route handlers
│   ├── auth/               # Authentication strategies
│   ├── config/             # Database and app configuration
│   ├── middleware/         # Security and validation middleware
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic services
│   └── validation/         # Zod schemas
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── stores/         # Zustand state management
│   │   └── utils/          # Helper functions
└── database/               # PostgreSQL schema and migrations
    ├── migrations/         # Database migrations
    ├── schemas/            # Table definitions
    ├── security/           # RLS policies and encryption
    ├── indexes/            # Performance indexes
    ├── seeds/              # Default data
    └── functions/          # Database functions
```

## API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `POST /api/users/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### Actions
- `GET /api/actions` - Get user actions
- `POST /api/actions` - Create new action
- `GET /api/actions/categories` - Get action categories
- `GET /api/actions/export` - Export user actions

### Gamification
- `GET /api/gamification/points` - Get user points
- `GET /api/gamification/badges` - Get user badges
- `GET /api/gamification/leaderboard` - Get leaderboard
- `GET /api/gamification/progress` - Get user progress

### Admin (Requires admin role)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/actions` - Get actions for verification
- `PUT /api/admin/actions/:id/verify` - Verify action
- `GET /api/admin/reports/esg` - Generate ESG report

## Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (Employee, Admin, Sustainability Manager)
- Row Level Security (RLS) policies
- Password encryption with bcrypt
- Rate limiting and security headers
- Input validation with Zod schemas
- Admin audit logging

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Ensure all production environment variables are set:
- Database connection details
- JWT secret key
- SMTP configuration for emails
- Frontend URL for CORS

## Contributing

1. Follow the established code organization patterns
2. Maintain file size limits (under 300 lines)
3. Use proper TypeScript types
4. Follow security best practices
5. Test all functionality thoroughly

## License

Proprietary - All rights reserved