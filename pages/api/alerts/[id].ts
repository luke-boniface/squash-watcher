import { NextApiRequest, NextApiResponse } from 'next';
import { updateAlert, deleteAlert } from '@/lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid alert ID' });
  }

  try {
    switch (req.method) {
      case 'PUT':
        const updatedAlert = await updateAlert(id, req.body);
        if (!updatedAlert) {
          return res.status(404).json({ error: 'Alert not found' });
        }
        res.status(200).json(updatedAlert);
        break;

      case 'PATCH':
        const patchedAlert = await updateAlert(id, req.body);
        if (!patchedAlert) {
          return res.status(404).json({ error: 'Alert not found' });
        }
        res.status(200).json(patchedAlert);
        break;

      case 'DELETE':
        const deleted = await deleteAlert(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Alert not found' });
        }
        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['PUT', 'PATCH', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}