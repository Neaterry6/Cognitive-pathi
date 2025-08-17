# CBT Learning Platform - Deployment Guide

This guide covers deployment to multiple hosting platforms with optimized configurations to prevent 404 errors.

## ✅ Supported Platforms

- **Render** - Recommended for production
- **Vercel** - Serverless deployment
- **Netlify** - JAMstack deployment
- **Koyeb** - European hosting
- **Railway** - Container deployment
- **Replit** - Development/testing

---

## 🚀 Platform-Specific Deployments

### 1. Render Deployment

**Configuration**: `render.yaml`

```bash
# 1. Connect your GitHub repository to Render
# 2. Create a new Web Service
# 3. Use the following settings:
```

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables Required**:
  - `DATABASE_URL` (PostgreSQL connection string)
  - `ALOC_ACCESS_TOKEN` (For authentic JAMB questions)
  - `PAYSTACK_SECRET_KEY` (For Nigerian payments)
  - `NODE_ENV=production`

### 2. Vercel Deployment

**Configuration**: `vercel.json`

```bash
# Deploy with Vercel CLI
npx vercel --prod

# Or connect GitHub repository to Vercel dashboard
```

- **Framework**: Node.js
- **Build Command**: `npm run build`
- **Output Directory**: `client/dist`
- **Environment Variables**: Same as Render

### 3. Netlify Deployment

**Configuration**: `netlify.toml`

```bash
# Connect repository to Netlify
# Build settings are auto-configured from netlify.toml
```

- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `client/dist`
- **Functions Directory**: `netlify/functions`

### 4. Koyeb Deployment

**Configuration**: `koyeb.toml`

```bash
# Deploy using Koyeb CLI
koyeb service deploy --app cbt-learning-platform
```

- **Port**: `8080`
- **Health Check**: `/api/health`
- **Auto-scaling**: 1-2 instances

---

## 🔧 Pre-Deployment Setup

### Required Environment Variables

Set these in your hosting platform:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# API Keys
ALOC_ACCESS_TOKEN=your_aloc_api_key
PAYSTACK_SECRET_KEY=sk_test_or_live_key

# Optional AI Services
OPENAI_API_KEY=your_openai_key
GOOGLE_AI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

# Application
NODE_ENV=production
PORT=10000  # Render specific
```

### Database Setup

1. Create PostgreSQL database on your hosting platform
2. Run migrations: `npm run db:push`
3. Database will auto-seed with subjects on first API call

---

## 🛠️ Build Process

The application uses a unified build process:

```bash
# Install dependencies
npm install

# Build frontend and backend
npm run build

# Start production server
npm start
```

**Build Output**:
- Frontend: `client/dist/` (static files)
- Backend: `dist/index.js` (Node.js server)

---

## 🔄 Deployment Troubleshooting

### Common 404 Issues & Solutions

#### Frontend Routes (React Router)
**Problem**: Page refresh shows 404
**Solution**: Each platform handles SPA routing:

- **Render**: Server serves `index.html` for all routes
- **Vercel**: `vercel.json` redirects to `index.html`
- **Netlify**: `_redirects` file handles client routing

#### API Endpoints
**Problem**: `/api/*` returns 404
**Solution**: Platform-specific routing:

- **Render**: Express server handles API routes
- **Vercel**: Serverless functions route `/api/*`
- **Netlify**: Functions redirect `/api/*` to `/.netlify/functions/api`

### Performance Optimization

1. **Static Assets**: Served efficiently on all platforms
2. **API Caching**: Responses cached where appropriate
3. **Database Connection**: Pooled connections for efficiency
4. **Rate Limiting**: Built-in ALOC API rate limiting

### Security Headers

All platforms configured with:
- CORS policies for CBT platform
- Security headers (CSP, HSTS, etc.)
- Environment variable protection

---

## 📊 Platform Comparison

| Platform | Pros | Cons | Best For |
|----------|------|------|----------|
| **Render** | Easy setup, PostgreSQL included | Limited free tier | Production |
| **Vercel** | Excellent performance, CDN | Serverless limitations | High traffic |
| **Netlify** | Great for JAMstack | Function cold starts | Static + API |
| **Koyeb** | European hosting, good pricing | Smaller ecosystem | EU users |

---

## 🎯 Quick Deploy Commands

```bash
# Render (via GitHub)
git push origin main

# Vercel
npx vercel --prod

# Netlify
netlify deploy --prod

# Koyeb
koyeb service deploy
```

---

## ✨ Post-Deployment

1. **Test CBT Practice**: Verify authentic JAMB questions load
2. **Test Payments**: Ensure Paystack integration works
3. **Check Performance**: Monitor response times
4. **Verify SSL**: Confirm HTTPS certificate

All platforms provide SSL certificates automatically.

---

**Need Help?** Check platform-specific logs:
- Render: Build & Runtime logs in dashboard
- Vercel: Function logs in Vercel dashboard  
- Netlify: Deploy logs and function logs
- Koyeb: Application logs in Koyeb console