import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

// Rate limiting
const RATE_LIMIT = 100; // requests per minute
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit) {
    rateLimit.set(ip, { count: 1, resetTime: now + 60000 });
    return false;
  }

  if (now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + 60000 });
    return false;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return true;
  }

  userLimit.count++;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Basic security checks
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (typeof ip === 'string' && isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const { db } = await connectToDatabase();

    // GET /api/complaints
    if (req.method === 'GET') {
      const complaints = await db.collection('complaints').find({}).toArray();
      return res.status(200).json(complaints);
    }

    // POST /api/complaints
    if (req.method === 'POST') {
      const { text, isAdmin, adminPasskey } = req.body;

      // Validate input
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Invalid complaint text' });
      }

      // If it's an admin complaint, verify the passkey
      if (isAdmin) {
        const correctPasskey = process.env.ADMIN_PASSKEY;
        if (!correctPasskey || adminPasskey !== correctPasskey) {
          return res.status(401).json({ error: 'Invalid admin passkey' });
        }
      }

      const complaint = {
        text,
        isAdmin,
        createdAt: new Date(),
      };

      const result = await db.collection('complaints').insertOne(complaint);
      return res.status(201).json({ ...complaint, _id: result.insertedId });
    }

    // DELETE /api/complaints
    if (req.method === 'DELETE') {
      const { id, adminPasskey } = req.body;

      // Verify admin passkey
      const correctPasskey = process.env.ADMIN_PASSKEY;
      if (!correctPasskey || adminPasskey !== correctPasskey) {
        return res.status(401).json({ error: 'Invalid admin passkey' });
      }

      if (!id) {
        return res.status(400).json({ error: 'Complaint ID is required' });
      }

      const result = await db.collection('complaints').deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      return res.status(200).json({ message: 'Complaint deleted successfully' });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 