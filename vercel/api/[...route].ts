import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import cors from 'cors';

// Create Express app for Vercel
const app = express();

// Enhanced CORS for Vercel
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize routes once
let appInitialized = false;
const initializeApp = async () => {
  if (!appInitialized) {
    await registerRoutes(app);
    appInitialized = true;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Initialize app if not already done
  await initializeApp();
  
  // Handle the request with Express
  return new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (err?: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}