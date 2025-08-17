import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import { registerRoutes } from '../../server/routes';
import cors from 'cors';

// Create Express app for Netlify
const app = express();

// Enhanced CORS for Netlify
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize routes
let appInitialized = false;
const initializeApp = async () => {
  if (!appInitialized) {
    await registerRoutes(app);
    appInitialized = true;
  }
};

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Initialize app if not already done
  await initializeApp();
  
  // Create serverless handler
  const serverlessHandler = serverless(app);
  
  // Get response from serverless handler
  const response = await serverlessHandler(event, context);
  
  // Ensure response is properly typed
  const typedResponse = response as any;
  
  return {
    statusCode: typedResponse.statusCode || 200,
    body: typedResponse.body || '',
    headers: {
      ...typedResponse.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  };
};