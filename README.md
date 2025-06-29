# African Relationship Development Platform

A modern relationship development platform built with React, Node.js, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd relationship-development
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your Supabase credentials
   # Get these from https://supabase.com/dashboard → Settings → API
   ```

4. **Configure Supabase credentials**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to **Settings → API**
   - Copy the following values to your `.env` file:
     - **Project URL** → `VITE_SUPABASE_URL`
     - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
     - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

5. **Run the development server**
   ```bash
   npm run dev
   ```

   This will start both the client (Vite) and server (Node.js) concurrently:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## 🌐 Deployment

This application uses a **hybrid deployment strategy**:

- **Frontend**: Deploy to [Netlify](https://netlify.com) (React/Vite)
- **Backend**: Deploy to [Railway](https://railway.app) or [Render](https://render.com) (Node.js/Express)
- **Database**: [Supabase](https://supabase.com) (hosted PostgreSQL)

📖 **Detailed deployment guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy

1. **Frontend (Netlify)**:
   - Connect your GitHub repo to Netlify
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Backend (Railway)**:
   - Connect your GitHub repo to Railway
   - Set root directory to `server`
   - Add environment variables

3. **Environment Variables**:
   - Set `VITE_API_URL` to your backend URL
   - Configure Supabase credentials

## 📁 Project Structure

```
relationship-development/
├── src/                 # React frontend
├── server/             # Node.js backend
├── supabase/           # Database migrations
├── .env.example        # Environment variables template
├── netlify.toml        # Netlify configuration
├── DEPLOYMENT.md       # Detailed deployment guide
└── README.md
```

## 🔧 Available Scripts

- `npm run dev` - Start development server (client + server)
- `npm run dev:client` - Start only the frontend
- `npm run dev:server` - Start only the backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `VITE_API_URL` - Backend API URL (for production)

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Deployment**: Netlify (frontend), Railway/Render (backend)

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
