# Diaspora Connect

A culturally-aware relationship platform for Africans in the diaspora, connecting people based on shared cultural values, traditions, and compatibility.

## Project Structure

```
diaspora-connect/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── lib/           # Utilities and API client
│   │   └── ...
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── config/        # Configuration files
│   │   ├── utils/         # Utility functions
│   │   └── sockets/       # Socket.IO handlers
│   └── package.json       # Backend dependencies
├── supabase/
│   └── migrations/        # Database migrations
└── README.md
```

## Features

### Core Features
- **Cultural Matching**: Advanced compatibility algorithm based on tribal background, languages, and cultural values
- **Identity Verification**: Multi-layer verification including cultural knowledge quiz and document verification
- **Community Endorsements**: Family and friends can endorse profiles for authenticity
- **Real-time Chat**: Secure messaging with translation support
- **Cultural Events**: Community events and gatherings
- **Admin Dashboard**: Platform management and moderation tools

### Technical Features
- **Frontend**: React 18 with TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js with Express, Socket.IO for real-time features
- **Database**: PostgreSQL with PostGIS for location features
- **Authentication**: Supabase Auth with Row Level Security
- **Real-time**: Socket.IO for chat and notifications
- **File Storage**: Supabase Storage for profile photos and documents

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd diaspora-connect
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   **Frontend (.env):**
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:3001/api
   ```

   **Backend (backend/.env):**
   ```env
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Set up the database**
   - Run the migration in `supabase/migrations/` in your Supabase dashboard
   - Or use the Supabase CLI if you have it set up

5. **Start the development servers**
   ```bash
   npm run start:all
   ```

   This will start both the frontend (http://localhost:5173) and backend (http://localhost:3001) servers.

### Individual Commands

**Frontend only:**
```bash
npm run dev
```

**Backend only:**
```bash
npm run backend:dev
```

**Install backend dependencies:**
```bash
npm run backend:install
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh authentication token

### Profile Endpoints
- `GET /api/profiles/me` - Get current user's profile
- `PUT /api/profiles/me` - Update user profile
- `GET /api/profiles/:userId` - Get public profile
- `PUT /api/profiles/cultural-background` - Update cultural background
- `GET /api/profiles` - Search profiles

### Matching Endpoints
- `GET /api/matching/discover` - Get potential matches
- `POST /api/matching/action` - Like/pass on a user
- `GET /api/matching/matches` - Get user's matches

### Chat Endpoints
- `GET /api/chat/conversations` - Get user's conversations
- `GET /api/chat/conversations/:id/messages` - Get conversation messages
- `POST /api/chat/conversations/:id/messages` - Send message

### Cultural Endpoints
- `POST /api/cultural/quiz-results` - Submit quiz results
- `GET /api/cultural/quiz-questions` - Get quiz questions
- `GET /api/cultural/quiz-history` - Get user's quiz history

### Events Endpoints
- `GET /api/events` - Get cultural events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/attend` - Join/leave event

## Database Schema

The application uses PostgreSQL with the following main tables:

- **profiles** - User profile information
- **cultural_backgrounds** - Cultural heritage and preferences
- **matches** - User matching and compatibility scores
- **conversations** - Chat conversations between matched users
- **messages** - Individual chat messages
- **cultural_events** - Community events and gatherings
- **verification_documents** - Identity verification files
- **user_activities** - User activity tracking for recommendations

## Development

### Code Organization
- **Frontend**: Component-based architecture with React hooks and contexts
- **Backend**: RESTful API with Express.js and modular route handlers
- **Database**: Row Level Security (RLS) policies for data protection
- **Real-time**: Socket.IO for chat and live updates

### Key Technologies
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for styling with custom design system
- **Framer Motion** for smooth animations
- **Express.js** with comprehensive middleware
- **Supabase** for authentication and database
- **Socket.IO** for real-time features

### Testing
```bash
# Frontend tests
npm test

# Backend tests
cd backend && npm test
```

## Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service:
```bash
npm run build
```

### Backend Deployment
The backend can be deployed to any Node.js hosting service. Make sure to:
1. Set production environment variables
2. Configure CORS for your frontend domain
3. Set up SSL/TLS certificates
4. Configure logging and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@diasporaconnect.com or join our community Discord.