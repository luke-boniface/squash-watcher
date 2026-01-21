import { NextApiRequest, NextApiResponse } from 'next';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface DebugStatus {
  isRunning: boolean;
  lastCheck: Date | null;
  checkInterval: number;
  nextCheck: Date | null;
  alerts: {
    total: number;
    active: number;
  };
  lastResults: {
    timestamp: Date;
    website: {
      enabled: boolean;
      url?: string;
      success: boolean;
      conditionMet: boolean;
      message?: string;
      error?: string;
    };
    api: {
      enabled: boolean;
      success: boolean;
      conditionMet: boolean;
      slotsFound: number;
      message?: string;
      error?: string;
    };
  } | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Read debug status from a status file if it exists
    let debugData: DebugStatus = {
      isRunning: false,
      lastCheck: null,
      checkInterval: 30000,
      nextCheck: null,
      alerts: { total: 0, active: 0 },
      lastResults: null
    };

    try {
      // Try to read status from a debug file
      const statusFilePath = join(process.cwd(), 'data', 'debug-status.json');
      const statusData = await readFile(statusFilePath, 'utf-8');
      const parsedData = JSON.parse(statusData);

      debugData = {
        ...debugData,
        ...parsedData,
        lastCheck: parsedData.lastCheck ? new Date(parsedData.lastCheck) : null,
        nextCheck: parsedData.nextCheck ? new Date(parsedData.nextCheck) : null,
        lastResults: parsedData.lastResults ? {
          ...parsedData.lastResults,
          timestamp: new Date(parsedData.lastResults.timestamp)
        } : null
      };
    } catch (error) {
      // Status file doesn't exist or is malformed - return default status
      console.log('Debug status file not found, returning default status');
    }

    // Try to read alerts to get current count
    try {
      const alertsFilePath = join(process.cwd(), 'data', 'alerts.json');
      const alertsData = await readFile(alertsFilePath, 'utf-8');
      const alerts = JSON.parse(alertsData);

      debugData.alerts = {
        total: alerts.length,
        active: alerts.filter((alert: any) => alert.active).length
      };
    } catch (error) {
      console.log('Could not read alerts file');
    }

    // Check if process might be running by looking for recent activity
    const now = new Date();
    if (debugData.lastCheck) {
      const timeSinceLastCheck = now.getTime() - debugData.lastCheck.getTime();
      debugData.isRunning = timeSinceLastCheck < (debugData.checkInterval * 3); // Consider running if checked within 3 intervals

      if (debugData.isRunning && debugData.lastCheck) {
        const nextCheckTime = new Date(debugData.lastCheck.getTime() + debugData.checkInterval);
        debugData.nextCheck = nextCheckTime;
      }
    }

    res.status(200).json(debugData);
  } catch (error) {
    console.error('Debug status API error:', error);
    res.status(500).json({ error: 'Failed to get debug status' });
  }
}