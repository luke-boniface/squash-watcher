import { Page } from 'playwright';
import { CheckResult } from './websiteChecker';
import { StateManager } from './stateManager';

export interface CourtSlot {
  date: string;
  start: string;
  court: number;
  title: string | null;
  present: boolean;
  isUserBookingOwner: boolean;
  booking: any;
}

export interface ApiResponse {
  slots: CourtSlot[];
}

export interface AvailableSlot {
  date: string;
  time: string;
  court: number;
}

/**
 * Build API URL for a specific date
 */
function buildApiUrl(
  facilityId: string,
  courtIds: string[],
  startDate: string
): string {
  const baseUrl = 'https://www.eversports.de/api/slot';
  const params = new URLSearchParams();
  params.append('facilityId', facilityId);
  params.append('startDate', startDate);

  courtIds.forEach(courtId => {
    params.append('courts[]', courtId);
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Format time from 24h format (e.g., "1830") to human readable (e.g., "18:30")
 */
function formatTime(timeStr: string): string {
  return `${timeStr.substring(0, 2)}:${timeStr.substring(2)}`;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate dates for checking (today + next N days)
 */
function generateDates(daysToCheck: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < daysToCheck; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(formatDate(date));
  }

  return dates;
}

/**
 * Create a condition checker for court availability
 */
export function createCourtAvailabilityChecker(
  facilityId: string,
  courtIds: string[],
  targetTimes: string[],
  daysToCheck: number,
  stateManager: StateManager
) {
  return async (page: Page): Promise<CheckResult> => {
    try {
      const datesToCheck = generateDates(daysToCheck);
      const newlyAvailableSlots: AvailableSlot[] = [];

      // Check each date
      for (const date of datesToCheck) {
        const url = buildApiUrl(facilityId, courtIds, date);

        // Navigate to API endpoint
        const response = await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 45000
        });

        if (!response || response.status() !== 200) {
          console.error(`Failed to fetch slots for ${date}: ${response?.status()}`);
          continue;
        }

        // Wait a bit for any JS to execute
        await page.waitForTimeout(2000);

        // Parse JSON response
        const text = await page.textContent('body');
        if (!text) {
          console.error(`No response body for ${date}`);
          continue;
        }

        const data: ApiResponse = JSON.parse(text);

        // Find available slots at target times
        for (const slot of data.slots) {
          // Check if this is a target time and slot is available (booking is null)
          if (targetTimes.includes(slot.start) && slot.booking === null) {
            // Check if we've already notified about this slot
            if (!stateManager.hasNotified(slot.date, slot.start, slot.court)) {
              newlyAvailableSlots.push({
                date: slot.date,
                time: slot.start,
                court: slot.court
              });

              // Mark as notified
              stateManager.markNotified(slot.date, slot.start, slot.court);
            }
          }
        }
      }

      // Return result
      if (newlyAvailableSlots.length > 0) {
        const slotMessages = newlyAvailableSlots.map(slot =>
          `🎾 *Court Available!*\n\n` +
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
          message: `No new available slots found at target times: ${targetTimes.map(formatTime).join(', ')}`
        };
      }

    } catch (error) {
      return {
        conditionMet: false,
        error: `Error checking court availability: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
}
