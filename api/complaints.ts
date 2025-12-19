import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './mongodb';
import { ObjectId } from 'mongodb';


const MASTER_PASSKEY = process.env.INBOX_MANAGER_PASSKEY;


// Rate limiting
const RATE_LIMIT = 100; // requests per minute
const rateLimit = new Map();

function isRateLimited(ip: string) {
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
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE' && req.method !== 'PUT') {
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
      const complaints = await db.collection('complaints').find({}).sort({ createdAt: -1 }).toArray();
      // Normalize data format for frontend
      const normalizedComplaints = complaints.map(complaint => {
        const timestamp = complaint.timestamp || complaint.createdAt || new Date();
        return {
          _id: complaint._id.toString(),
          text: complaint.text,
          acknowledged: complaint.acknowledged || false,
          timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp
        };
      });
      return res.status(200).json(normalizedComplaints);
    }

    // POST /api/complaints
    if (req.method === 'POST') {
      const { text, isInboxManager, inboxManagerPasskey } = req.body;

      // Validate input
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Invalid complaint text' });
      }

      // If it's an inbox manager complaint, verify the passkey
      if (isInboxManager) {
        if (inboxManagerPasskey !== MASTER_PASSKEY) {
          return res.status(401).json({ error: 'Invalid inbox manager passkey' });
        }
      }

      const now = new Date();
      const complaint = {
        text: text.trim(),
        isInboxManager: isInboxManager || false,
        acknowledged: false,
        createdAt: now,
        updatedAt: now,
      };

      const result = await db.collection('complaints').insertOne(complaint);
      const insertedComplaint = {
        _id: result.insertedId.toString(),
        text: complaint.text,
        acknowledged: complaint.acknowledged,
        timestamp: complaint.createdAt.toISOString()
      };
      return res.status(201).json(insertedComplaint);
    }

    // PUT /api/complaints - Update complaint (acknowledge)
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { acknowledged, inboxManagerPasskey } = req.body;

      // Verify inbox manager passkey
     if (inboxManagerPasskey !== MASTER_PASSKEY) {
      return res.status(401).json({ error: 'Invalid inbox manager passkey' });
      }

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Complaint ID is required' });
      }
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const updateData: {acknwledged?: Boolean}= {};
      if (acknowledged !== undefined) {
        // @ts-ignore
        updateData.acknowledged = acknowledged;
      }

      const result = await db.collection('complaints').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      // Fetch updated complaint
      const updatedComplaint = await db.collection('complaints').findOne({ _id: new ObjectId(id) });
      const timestamp = updatedComplaint.timestamp || updatedComplaint.createdAt || new Date();
      const normalizedComplaint = {
        _id: updatedComplaint._id.toString(),
        text: updatedComplaint.text,
        acknowledged: updatedComplaint.acknowledged || false,
        timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp
      };

      return res.status(200).json(normalizedComplaint);
    }

    // DELETE /api/complaints
    if (req.method === 'DELETE') {
      const { id, inboxManagerPasskey } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Complaint ID is required' });
      }

      // If passkey is provided, verify it (for inbox manager operations)
      // Otherwise, allow deletion (users can delete their own complaints)
      if (inboxManagerPasskey !== MASTER_PASSKEY) {
       return res.status(401).json({ error: 'Invalid inbox manager passkey' });
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