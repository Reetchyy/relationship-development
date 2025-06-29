# Deployment Guide

This guide explains how to deploy your African Relationship Development Platform.

## 🏗️ Architecture Overview

- **Frontend**: React/Vite app (hosted on Netlify)
- **Backend**: Node.js/Express API (hosted on Railway/Render/Vercel)
- **Database**: Supabase (hosted service)

## 🚀 Frontend Deployment (Netlify)

### Option 1: Deploy via Netlify UI

1. **Push your code to GitHub**
2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Click "Deploy site"

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build your project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Environment Variables for Frontend

In Netlify dashboard → Site settings → Environment variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-backend-url.com/api
```

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway account** at [railway.app](https://railway.app)
2. **Connect your GitHub repo**
3. **Deploy the server directory**:
   - Set root directory to `server`
   - Railway will auto-detect Node.js
4. **Set environment variables**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PORT=3001
   ```

### Option 2: Render

1. **Create Render account** at [render.com](https://render.com)
2. **Create new Web Service**
3. **Connect your GitHub repo**
4. **Configure**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. **Set environment variables** (same as Railway)

### Option 3: Vercel

1. **Create Vercel account** at [vercel.com](https://vercel.com)
2. **Import your GitHub repo**
3. **Configure**:
   - **Root Directory**: `server`
   - **Framework Preset**: Node.js
4. **Set environment variables**

## 🔗 Connecting Frontend to Backend

After deploying both:

1. **Get your backend URL** (e.g., `https://your-app.railway.app`)
2. **Set the API URL in Netlify**:
   - Go to Site settings → Environment variables
   - Add: `VITE_API_URL=https://your-backend-url.com/api`
3. **Redeploy your frontend**

## 🌐 Custom Domain Setup

### Netlify (Frontend)
1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS records

### Backend (Railway/Render)
1. Add custom domain in your backend platform
2. Update `VITE_API_URL` in Netlify

## 🔒 Security Considerations

### CORS Configuration
Update your backend CORS settings:

```javascript
// In server/index.js
app.use(cors({
  origin: [
    'https://your-netlify-app.netlify.app',
    'https://your-custom-domain.com',
    'http://localhost:5173' // for development
  ],
  credentials: true
}));
```

### Environment Variables
- ✅ **Frontend**: Only public keys (VITE_*)
- ✅ **Backend**: All keys including service role
- ❌ **Never commit**: `.env` files

## 📊 Monitoring & Analytics

### Netlify Analytics
- Built-in analytics in Netlify dashboard
- Performance monitoring
- Error tracking

### Backend Monitoring
- Railway/Render provide logs and metrics
- Consider adding application monitoring (Sentry, etc.)

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check CORS configuration in backend
   - Verify frontend URL is in allowed origins

2. **Environment Variables**:
   - Ensure all required variables are set
   - Check variable names match exactly

3. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **API Connection**:
   - Test backend URL directly
   - Check network tab for errors

### Debug Commands

```bash
# Test backend locally
cd server
npm start

# Test frontend build
npm run build

# Check environment variables
echo $VITE_SUPABASE_URL
```

## 📈 Performance Optimization

### Frontend
- Enable Netlify's asset optimization
- Use CDN for static assets
- Implement lazy loading

### Backend
- Enable compression
- Implement caching
- Use connection pooling for database

## 🔄 Continuous Deployment

Both Netlify and Railway/Render support automatic deployments:
- Push to `main` branch triggers deployment
- Preview deployments for pull requests
- Rollback capabilities

## 💰 Cost Considerations

- **Netlify**: Free tier available, paid for advanced features
- **Railway**: Pay-as-you-go, free tier available
- **Render**: Free tier available, paid for production
- **Supabase**: Generous free tier, paid for advanced features 