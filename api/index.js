// Vercel serverless function entry point
import { app, initializeApp } from '../dist/index.js';

// Initialize the app once
let initialized = false;

// Export the handler for Vercel
export default async function handler(req, res) {
  // Initialize the app on first request
  if (!initialized) {
    try {
      await initializeApp();
      initialized = true;
    } catch (error) {
      console.error('Failed to initialize app:', error);
      return res.status(500).json({ error: 'Failed to initialize server' });
    }
  }
  
  // Handle the request with Express
  return app(req, res);
}

