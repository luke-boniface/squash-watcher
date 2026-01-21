export interface Alert {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  courts: number[];
  active: boolean;
  created: string;
}

export interface CourtSlot {
  date: string;
  start: string;
  court: number;
  title: string | null;
  present: boolean;
  isUserBookingOwner: boolean;
  booking: any;
}

export interface TimeSlot {
  value: string;
  label: string;
}