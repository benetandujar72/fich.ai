import { format } from "date-fns";

export interface ScheduleSession {
  id: string;
  dayOfWeek: number;
  hourPeriod: number;
  subjectCode: string;
  subjectName: string;
  groupCode: string;
  classroomCode: string;
  isLectiveHour: boolean;
}

export interface ExpectedTimes {
  expectedEntry: string | null;
  expectedExit: string | null;
  hasScheduleToday: boolean;
}

// Institut Bitàcola time periods mapping
export const TIME_PERIODS = {
  1: { start: "08:00", end: "09:00" },
  2: { start: "09:00", end: "10:00" },
  3: { start: "10:00", end: "11:00" },
  4: { start: "11:30", end: "12:30" }, // després del pati 11:00-11:30
  5: { start: "12:30", end: "13:30" },
  6: { start: "13:30", end: "14:30" },
  7: { start: "15:30", end: "16:30" }, // després del dinar 14:30-15:30
  8: { start: "16:30", end: "17:30" }
};

/**
 * Calculate expected entry and exit times for a teacher based on their schedule for a specific day
 */
export function calculateExpectedTimes(scheduleData: ScheduleSession[], dayOfWeek: number): ExpectedTimes {
  if (!scheduleData || scheduleData.length === 0) {
    return {
      expectedEntry: null,
      expectedExit: null,
      hasScheduleToday: false
    };
  }

  // Filter sessions for the specific day
  const daySchedule = scheduleData.filter(session => session.dayOfWeek === dayOfWeek);

  if (daySchedule.length === 0) {
    return {
      expectedEntry: null,
      expectedExit: null,
      hasScheduleToday: false
    };
  }

  // Find the earliest hour period for entry time
  const earliestHour = Math.min(...daySchedule.map(session => session.hourPeriod));
  
  // Find the latest hour period for exit time
  const latestHour = Math.max(...daySchedule.map(session => session.hourPeriod));

  const expectedEntry = TIME_PERIODS[earliestHour as keyof typeof TIME_PERIODS]?.start || null;
  const expectedExit = TIME_PERIODS[latestHour as keyof typeof TIME_PERIODS]?.end || null;

  return {
    expectedEntry,
    expectedExit,
    hasScheduleToday: true
  };
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  const url = window.location.hostname;
  return !url.includes('replit.dev') && !url.includes('localhost') && !url.includes('127.0.0.1');
}

/**
 * Compare actual check-in/out time with expected times and return status
 */
export interface AttendanceStatus {
  entryStatus: 'on-time' | 'late' | 'early' | 'missing';
  exitStatus: 'on-time' | 'early' | 'late' | 'missing';
  overallStatus: 'complete-ok' | 'complete-with-issues' | 'partial' | 'absent';
  entryColor: 'green' | 'red' | 'gray';
  exitColor: 'green' | 'red' | 'gray';
  overallColor: 'green' | 'red' | 'orange' | 'gray';
}

export function getAttendanceStatus(
  checkInTime: string | null,
  checkOutTime: string | null,
  expectedEntry: string | null,
  expectedExit: string | null
): AttendanceStatus {
  const status: AttendanceStatus = {
    entryStatus: 'missing',
    exitStatus: 'missing',
    overallStatus: 'absent',
    entryColor: 'gray',
    exitColor: 'gray',
    overallColor: 'gray'
  };

  // Parse expected times for comparison
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes; // Convert to minutes since midnight
  };

  const parseDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.getHours() * 60 + date.getMinutes(); // Convert to minutes since midnight
  };

  // Check entry status
  if (checkInTime && expectedEntry) {
    const actualEntryMinutes = parseDateTime(checkInTime);
    const expectedEntryMinutes = parseTime(expectedEntry);
    
    if (actualEntryMinutes <= expectedEntryMinutes) {
      status.entryStatus = 'early'; // Before or on time = green
      status.entryColor = 'green';
    } else {
      status.entryStatus = 'late'; // After expected time = late but present
      status.entryColor = 'red';
    }
  } else if (checkInTime) {
    status.entryStatus = 'on-time';
    status.entryColor = 'green';
  }

  // Check exit status
  if (checkOutTime && expectedExit) {
    const actualExitMinutes = parseDateTime(checkOutTime);
    const expectedExitMinutes = parseTime(expectedExit);
    
    if (actualExitMinutes < expectedExitMinutes) {
      status.exitStatus = 'early'; // Before expected time = red
      status.exitColor = 'red';
    } else {
      status.exitStatus = 'on-time'; // After expected time = green
      status.exitColor = 'green';
    }
  } else if (checkOutTime) {
    status.exitStatus = 'on-time';
    status.exitColor = 'green';
  }

  // Determine overall status
  if (checkInTime && checkOutTime) {
    if (status.entryColor === 'green' && status.exitColor === 'green') {
      status.overallStatus = 'complete-ok';
      status.overallColor = 'green';
    } else {
      status.overallStatus = 'complete-with-issues';
      status.overallColor = 'red';
    }
  } else if (checkInTime) {
    status.overallStatus = 'partial';
    status.overallColor = status.entryColor === 'red' ? 'red' : 'orange';
  } else {
    status.overallStatus = 'absent';
    status.overallColor = 'gray';
  }

  return status;
}

/**
 * Get today's day of week (Monday = 1, Tuesday = 2, etc.)
 */
export function getTodayDayOfWeek(): number {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday = 7, Monday = 1
}

/**
 * Check if user has already checked in/out today (for production restriction)
 */
export function hasCheckedInToday(attendanceRecords: any[]): boolean {
  const today = format(new Date(), 'yyyy-MM-dd');
  return attendanceRecords.some(record => 
    record.type === 'check_in' && 
    format(new Date(record.timestamp), 'yyyy-MM-dd') === today
  );
}

export function hasCheckedOutToday(attendanceRecords: any[]): boolean {
  const today = format(new Date(), 'yyyy-MM-dd');
  return attendanceRecords.some(record => 
    record.type === 'check_out' && 
    format(new Date(record.timestamp), 'yyyy-MM-dd') === today
  );
}