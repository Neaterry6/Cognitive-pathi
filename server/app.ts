import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { registerRoutes } from './routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();

  // Enhanced CORS configuration for deployment platforms
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://*.vercel.app',
      'https://*.netlify.app',
      'https://*.render.com',
      'https://*.koyeb.app',
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.render\.com$/,
      /^https:\/\/.*\.koyeb\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      platform: 'CBT Learning Platform',
      version: '1.0.0'
    });
  });

  // Setup API routes
  const server = await registerRoutes(app);

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '../client/dist');
    app.use(express.static(clientDistPath));
    
    // Handle client-side routing
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return app;
}