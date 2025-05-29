import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from './mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db("pookie_mistakes");
    const collection = db.collection("complaints");

    switch (req.method) {
      case 'GET':
        const complaints = await collection.find({}).sort({ timestamp: -1 }).toArray();
        res.status(200).json(complaints);
        break;

      case 'POST':
        const newComplaint = {
          ...req.body,
          timestamp: new Date().toISOString(),
          acknowledged: false
        };
        const result = await collection.insertOne(newComplaint);
        res.status(201).json({ ...newComplaint, _id: result.insertedId });
        break;

      case 'PUT':
        const { id, acknowledged } = req.body;
        await collection.updateOne(
          { _id: id },
          { $set: { acknowledged } }
        );
        res.status(200).json({ message: 'Complaint updated' });
        break;

      case 'DELETE':
        const { id: deleteId } = req.body;
        await collection.deleteOne({ _id: deleteId });
        res.status(200).json({ message: 'Complaint deleted' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 