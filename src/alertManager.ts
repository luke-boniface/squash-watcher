import { Page } from 'playwright';
import { CheckResult } from './websiteChecker';
import { StateManager } from './stateManager';
import { getActiveAlerts } from '../lib/storage';
import { Alert } from '../lib/types';

interface AvailableSlot {
  date: string;
  time: string;
  court: number;
  alertName: string;
}

interface ApiResponse {
  slots: Array<{
    date: string;
    start: string;
    court: number;
    title: string | null;
    present: boolean;
    isUserBookingOwner: boolean;
    booking: any;
  }> | {
    slots: Array<{
      date: string;
      start: string;
      court: number;
      title: string | null;
      present: boolean;
      isUserBookingOwner: boolean;
      booking: any;
    }>;
  };
}

function buildApiUrl(facilityId: string, courtIds: string[], startDate: string): string {
  const baseUrl = 'https://www.eversports.de/api/slot';
  const params = new URLSearchParams();
  params.append('facilityId', facilityId);
  params.append('startDate', startDate);

  courtIds.forEach(courtId => {
    params.append('courts[]', courtId);
  });

  return `${baseUrl}?${params.toString()}`;
}

function formatTime(timeStr: string): string {
  return `${timeStr.substring(0, 2)}:${timeStr.substring(2)}`;
}

function generateTimeRange(startTime: string, endTime: string): string[] {
  const times: string[] = [];
  const timeSlots = [
    '0630', '0715', '0800', '0845', '0930', '1015', '1100', '1145',
    '1230', '1315', '1400', '1445', '1530', '1615', '1700', '1745',
    '1830', '1915', '2000', '2045', '2130'
  ];

  const startIndex = timeSlots.indexOf(startTime);
  const endIndex = timeSlots.indexOf(endTime);

  if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
    for (let i = startIndex; i <= endIndex; i++) {
      times.push(timeSlots[i]);
    }
  }

  return times;
}

export function createAlertChecker(facilityId: string, stateManager: StateManager) {
  return async (page: Page): Promise<CheckResult> => {
    try {
      const alerts = await getActiveAlerts();

      if (alerts.length === 0) {
        return {
          conditionMet: false,
          message: 'No active alerts configured'
        };
      }

      const newlyAvailableSlots: AvailableSlot[] = [];

      for (const alert of alerts) {
        const targetTimes = generateTimeRange(alert.startTime, alert.endTime);
        const courtIds = alert.courts.map(String);

        const url = buildApiUrl(facilityId, courtIds, alert.date);

        const response = await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 45000
        });

        if (!response || response.status() !== 200) {
          console.error(`Failed to fetch slots for ${alert.date}: ${response?.status()}`);
          continue;
        }

        await page.waitForTimeout(2000);

        const text = await page.textContent('body');
        if (!text) {
          console.error(`No response body for ${alert.date}`);
          continue;
        }

        let data: ApiResponse;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error(`Failed to parse JSON for ${alert.date}:`, text?.substring(0, 100));
          continue;
        }

        // Handle nested slots structure: {"slots":{"slots":[]}} or {"slots":[]}
        let slotsArray: any[];
        if (data.slots && Array.isArray(data.slots)) {
          slotsArray = data.slots;
        } else if (data.slots && typeof data.slots === 'object' && 'slots' in data.slots && Array.isArray(data.slots.slots)) {
          slotsArray = data.slots.slots;
        } else {
          console.error(`Invalid API response for ${alert.date} - missing slots array:`, text?.substring(0, 100));
          continue;
        }

        const bookedCourtsByTime = new Map<string, Set<number>>();

        for (const slot of slotsArray) {
          if (slot.date === alert.date && targetTimes.includes(slot.start)) {
            if (!bookedCourtsByTime.has(slot.start)) {
              bookedCourtsByTime.set(slot.start, new Set());
            }
            bookedCourtsByTime.get(slot.start)!.add(slot.court);
          }
        }

        for (const targetTime of targetTimes) {
          const bookedCourts = bookedCourtsByTime.get(targetTime) || new Set();

          for (const courtId of alert.courts) {
            if (!bookedCourts.has(courtId)) {
              const slotKey = `${alert.date}-${targetTime}-${courtId}`;
              if (!stateManager.hasNotified(alert.date, targetTime, courtId)) {
                newlyAvailableSlots.push({
                  date: alert.date,
                  time: targetTime,
                  court: courtId,
                  alertName: alert.name
                });

                stateManager.markNotified(alert.date, targetTime, courtId);
              }
            }
          }
        }
      }

      if (newlyAvailableSlots.length > 0) {
        const slotMessages = newlyAvailableSlots.map(slot =>
          `🎾 *Court Available!*\n\n` +
          `📋 Alert: ${slot.alertName}\n` +
          `📅 Date: ${slot.date}\n` +
          `🕐 Time: ${formatTime(slot.time)}\n` +
          `🏟️ Court: ${slot.court}\n\n` +
          `[Book Now](https://www.eversports.de/venue/squashpoint-schoneberg)`
        );

        return {
          conditionMet: true,
          message: slotMessages.join('\n\n---\n\n')
        };
      } else {
        return {
          conditionMet: false,
          message: `Checking ${alerts.length} active alert(s) - no new available slots found`
        };
      }

    } catch (error) {
      return {
        conditionMet: false,
        error: `Error checking alerts: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
}