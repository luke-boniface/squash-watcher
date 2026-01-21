import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface DebugStatus {
  isRunning: boolean;
  lastCheck: Date;
  checkInterval: number;
  nextCheck: Date;
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
  };
}

export class DebugLogger {
  private statusFilePath: string;

  constructor() {
    this.statusFilePath = join(process.cwd(), 'data', 'debug-status.json');
  }

  async ensureDataDirectory(): Promise<void> {
    try {
      await mkdir(join(process.cwd(), 'data'), { recursive: true });
    } catch (error) {
      // Directory already exists or couldn't be created
    }
  }

  async logStatus(status: DebugStatus): Promise<void> {
    try {
      await this.ensureDataDirectory();
      const statusJson = JSON.stringify(status, null, 2);
      await writeFile(this.statusFilePath, statusJson, 'utf-8');
    } catch (error) {
      console.error('Failed to write debug status:', error);
    }
  }

  async logCheckStart(config: any, alertCount: number, activeAlertCount: number): Promise<void> {
    const now = new Date();
    const nextCheck = new Date(now.getTime() + config.checkInterval);

    const status: Partial<DebugStatus> = {
      isRunning: true,
      lastCheck: now,
      checkInterval: config.checkInterval,
      nextCheck,
      alerts: {
        total: alertCount,
        active: activeAlertCount
      }
    };

    await this.updateStatus(status);
  }

  async logCheckResults(
    websiteResult?: { enabled: boolean; url?: string; success: boolean; conditionMet: boolean; message?: string; error?: string },
    apiResult?: { enabled: boolean; success: boolean; conditionMet: boolean; slotsFound: number; message?: string; error?: string }
  ): Promise<void> {
    const now = new Date();

    const resultData = {
      timestamp: now,
      website: websiteResult || { enabled: false, success: false, conditionMet: false, slotsFound: 0 },
      api: apiResult || { enabled: false, success: false, conditionMet: false, slotsFound: 0 }
    };

    await this.updateStatus({ lastResults: resultData });
  }

  private async updateStatus(partialStatus: Partial<DebugStatus>): Promise<void> {
    try {
      // Read existing status or create new one
      let currentStatus: DebugStatus;
      try {
        const { readFile } = await import('fs/promises');
        const existingData = await readFile(this.statusFilePath, 'utf-8');
        currentStatus = JSON.parse(existingData);
      } catch (error) {
        // Create default status
        const now = new Date();
        currentStatus = {
          isRunning: false,
          lastCheck: now,
          checkInterval: 30000,
          nextCheck: now,
          alerts: { total: 0, active: 0 },
          lastResults: {
            timestamp: now,
            website: { enabled: false, success: false, conditionMet: false },
            api: { enabled: false, success: false, conditionMet: false, slotsFound: 0 }
          }
        };
      }

      // Merge with new data
      const updatedStatus = { ...currentStatus, ...partialStatus };

      // If lastResults is being updated, merge it properly
      if (partialStatus.lastResults) {
        updatedStatus.lastResults = {
          ...currentStatus.lastResults,
          ...partialStatus.lastResults
        };
      }

      await this.logStatus(updatedStatus);
    } catch (error) {
      console.error('Failed to update debug status:', error);
    }
  }

  async markStopped(): Promise<void> {
    await this.updateStatus({ isRunning: false });
  }
}