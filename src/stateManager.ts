/**
 * State manager to track which court slots have already been notified
 * to prevent duplicate notifications
 */
export class StateManager {
  private notifiedSlots: Set<string>;

  constructor() {
    this.notifiedSlots = new Set<string>();
  }

  /**
   * Generate a unique key for a court slot
   */
  private getSlotKey(date: string, time: string, court: number): string {
    return `${date}-${time}-${court}`;
  }

  /**
   * Check if a slot has already been notified
   */
  hasNotified(date: string, time: string, court: number): boolean {
    const key = this.getSlotKey(date, time, court);
    return this.notifiedSlots.has(key);
  }

  /**
   * Mark a slot as notified
   */
  markNotified(date: string, time: string, court: number): void {
    const key = this.getSlotKey(date, time, court);
    this.notifiedSlots.add(key);
  }

  /**
   * Remove a slot from notified state (useful if a slot becomes unavailable and then available again)
   */
  unmarkNotified(date: string, time: string, court: number): void {
    const key = this.getSlotKey(date, time, court);
    this.notifiedSlots.delete(key);
  }

  /**
   * Get total count of notified slots
   */
  getNotifiedCount(): number {
    return this.notifiedSlots.size;
  }

  /**
   * Clear all notified slots
   */
  clear(): void {
    this.notifiedSlots.clear();
  }
}
