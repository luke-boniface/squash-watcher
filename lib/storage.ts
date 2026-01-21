import { promises as fs } from 'fs';
import path from 'path';
import { Alert } from './types';

const STORAGE_DIR = path.join(process.cwd(), 'data');
const ALERTS_FILE = path.join(STORAGE_DIR, 'alerts.json');

async function ensureDataDir() {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

export async function loadAlerts(): Promise<Alert[]> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(ALERTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(ALERTS_FILE, JSON.stringify(alerts, null, 2), 'utf-8');
}

export async function createAlert(alert: Alert): Promise<Alert> {
  const alerts = await loadAlerts();
  alerts.push(alert);
  await saveAlerts(alerts);
  return alert;
}

export async function updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
  const alerts = await loadAlerts();
  const index = alerts.findIndex(a => a.id === id);

  if (index === -1) return null;

  alerts[index] = { ...alerts[index], ...updates };
  await saveAlerts(alerts);
  return alerts[index];
}

export async function deleteAlert(id: string): Promise<boolean> {
  const alerts = await loadAlerts();
  const filteredAlerts = alerts.filter(a => a.id !== id);

  if (filteredAlerts.length === alerts.length) return false;

  await saveAlerts(filteredAlerts);
  return true;
}

export async function getActiveAlerts(): Promise<Alert[]> {
  const alerts = await loadAlerts();
  return alerts.filter(alert => alert.active);
}