import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from './mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db("pookie_mistakes");
    
    // Test database connection
    await db.command({ ping: 1 });
    
    res.status(200).json({ 
      status: 'ok',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 