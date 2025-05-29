import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for required environment variables
    const requiredEnvVars = [
      'MONGODB_USER',
      'MONGODB_PASSWORD',
      'MONGODB_CLUSTER',
      'MONGODB_DATABASE'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    const { db } = await connectToDatabase();
    
    // Test database connection
    await db.command({ ping: 1 });

    return res.status(200).json({
      status: 'ok',
      message: 'API is working',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseName: process.env.MONGODB_DATABASE,
      cluster: process.env.MONGODB_CLUSTER,
      // Don't expose sensitive information
      user: process.env.MONGODB_USER ? 'Set' : 'Not Set',
      password: process.env.MONGODB_PASSWORD ? 'Set' : 'Not Set'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to connect to database',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined,
      environment: process.env.NODE_ENV,
      // Don't expose sensitive information
      user: process.env.MONGODB_USER ? 'Set' : 'Not Set',
      password: process.env.MONGODB_PASSWORD ? 'Set' : 'Not Set',
      cluster: process.env.MONGODB_CLUSTER,
      database: process.env.MONGODB_DATABASE
    });
  }
} 