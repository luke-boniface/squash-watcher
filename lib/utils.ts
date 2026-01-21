export const timeSlots = [
  { value: '0630', label: '06:30' },
  { value: '0715', label: '07:15' },
  { value: '0800', label: '08:00' },
  { value: '0845', label: '08:45' },
  { value: '0930', label: '09:30' },
  { value: '1015', label: '10:15' },
  { value: '1100', label: '11:00' },
  { value: '1145', label: '11:45' },
  { value: '1230', label: '12:30' },
  { value: '1315', label: '13:15' },
  { value: '1400', label: '14:00' },
  { value: '1445', label: '14:45' },
  { value: '1530', label: '15:30' },
  { value: '1615', label: '16:15' },
  { value: '1700', label: '17:00' },
  { value: '1745', label: '17:45' },
  { value: '1830', label: '18:30' },
  { value: '1915', label: '19:15' },
  { value: '2000', label: '20:00' },
  { value: '2045', label: '20:45' },
  { value: '2130', label: '21:30' },
];

export const courts = [
  { value: 1, label: 'Court 1' },
  { value: 2, label: 'Court 2' },
  { value: 3, label: 'Court 3' },
  { value: 4, label: 'Court 4' },
];

export function formatTime(timeStr: string): string {
  return `${timeStr.substring(0, 2)}:${timeStr.substring(2)}`;
}

export function parseTime(timeStr: string): string {
  return timeStr.replace(':', '');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}