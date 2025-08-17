# CBT Learning Platform - Deployment Guide

## Platform-Specific Deployment Instructions

### 1. Vercel Deployment

**Prerequisites:**
- Vercel CLI installed: `npm i -g vercel`
- Vercel account connected to GitHub

**Environment Variables Required:**
```env
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key (optional)
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key (optional)
NODE_ENV=production
```

**Deploy Steps:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add GEMINI_API_KEY
# ... add other variables

# Redeploy with env vars
vercel --prod
```

### 2. Render Deployment

**Prerequisites:**
- Render account
- GitHub repository connected

**Deploy Steps:**
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use `render.yaml` configuration (already created)
4. Set environment variables in Render dashboard:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY` (optional)
   - `STRIPE_SECRET_KEY` (optional)

**Database:**
- Create PostgreSQL database in Render
- Connect it to your web service
- Run `npm run db:push` after deployment

### 3. Netlify Deployment

**Prerequisites:**
- Netlify CLI: `npm install -g netlify-cli`
- Netlify account

**Deploy Steps:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod

# Set environment variables
netlify env:set DATABASE_URL "your_database_url"
netlify env:set GEMINI_API_KEY "your_api_key"
```

### 4. Koyeb Deployment

**Prerequisites:**
- Koyeb account
- Koyeb CLI

**Deploy Steps:**
1. Create account at koyeb.com
2. Install Koyeb CLI
3. Use `koyeb.toml` configuration
4. Set environment variables in Koyeb dashboard

### 5. Railway Deployment

**Prerequisites:**
- Railway account
- Railway CLI

**Deploy Steps:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set environment variables
railway variables set DATABASE_URL="your_database_url"
railway variables set GEMINI_API_KEY="your_api_key"

# Deploy
railway up
```

## Environment Variables Reference

### Required Variables
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### AI Services (Optional - fallback explanations if not provided)
```env
GEMINI_API_KEY=your_google_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Payment Processing (Optional - for premium features)
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Database Setup

### PostgreSQL Schema Migration
After deployment, run database migration:
```bash
npm run db:push
```

### Default Data
The application will automatically:
- Create 8 subjects (English, Mathematics, Chemistry, Physics, Biology, Economics, Government, Literature)
- Set up premium access system with activation codes: `0814880`, `0901918`, `0803989`

## Premium Access System

### Activation Codes
- **Valid codes**: `0814880`, `0901918`, `0803989`
- **Contact**: WhatsApp +234 814 880 9180
- **Free users**: Limited to 3 quiz attempts
- **Premium users**: Unlimited access

### AI Explanation Features
- **Primary**: Google Gemini API
- **Fallback**: OpenAI GPT-4
- **No API keys**: Standard explanations provided
- **Caching**: Explanations stored in database for performance

## Post-Deployment Checklist

1. ✅ Database connection established
2. ✅ 8 subjects loaded in database
3. ✅ ALOC API integration working (fetches real JAMB questions)
4. ✅ Premium activation system functional
5. ✅ AI explanation system operational
6. ✅ Quiz session creation and submission working
7. ✅ Static assets serving correctly

## Performance Optimization

### Database Indexing
Ensure these indexes exist:
- `users(email, nickname)`
- `quiz_sessions(userId, isCompleted)`
- `explained_questions(userId, questionId)`

### CDN Configuration
For production, configure CDN for:
- Static assets (`/assets/*`)
- Images (`/uploads/*`)

## Monitoring & Health Checks

### Health Check Endpoints
- **Main**: `GET /` - Returns application status
- **API**: `GET /api/subjects` - Database connectivity
- **ALOC**: Test question fetching from external API

### Error Monitoring
Monitor these key endpoints:
- `/api/quiz/create-session`
- `/api/quiz/questions/*`
- `/api/auth/activate`
- `/api/quiz/explanation`

## Security Notes

1. **API Keys**: Store securely in platform environment variables
2. **Database**: Use connection pooling and SSL
3. **CORS**: Configure for your domain
4. **Rate Limiting**: Consider implementing for API endpoints
5. **Activation Codes**: Valid codes are hardcoded for security

## Support & Maintenance

- **WhatsApp Support**: +234 814 880 9180
- **Premium Activation**: Contact via WhatsApp for valid codes
- **Database Migrations**: Use `npm run db:push` for schema updates
- **API Updates**: ALOC API integration automatically handles question fetching