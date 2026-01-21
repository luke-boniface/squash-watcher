import { NextApiRequest, NextApiResponse } from 'next';
import { loadAlerts, createAlert } from '@/lib/storage';
import { Alert } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        const alerts = await loadAlerts();
        res.status(200).json(alerts);
        break;

      case 'POST':
        const alertData = req.body as Alert;

        // Validation
        if (!alertData.name || !alertData.date || !alertData.startTime ||
            !alertData.endTime || !alertData.courts || alertData.courts.length === 0) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const newAlert = await createAlert(alertData);
        res.status(201).json(newAlert);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}