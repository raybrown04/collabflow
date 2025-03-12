import { format, parseISO, isSameDay, startOfDay } from 'date-fns';

/**
 * Creates an ISO string while preserving the exact date components (year, month, day)
 * regardless of timezone conversions
 */
export const preserveDateComponents = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Create date string with time set to noon to avoid any timezone edge cases
  return `${year}-${month}-${day}T12:00:00.000Z`;
};

// Convert Supabase DateTime to Day object
export const supabaseToCalendar = (supabaseDate: string) =>
    parseISO(supabaseDate);

// Convert Day selection to Supabase format  
export const calendarToSupabase = (date: Date) =>
    format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

// UI display formatting
export const displayDate = (date: Date) =>
    format(date, "MMMM dd, yyyy");

// Timezone utilities
export const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const toUserTimezone = (date: string) =>
    new Date(date).toLocaleString('en-US', { timeZone: userTimezone });

export const toUTC = (date: Date) =>
    new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));

/**
 * Converts an ISO date string to a date object in the local timezone
 * This ensures consistent date comparisons across components by preserving
 * the actual date components (year, month, day) regardless of timezone
 */
export const toLocalDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  
  try {
    // Parse ISO string to Date object
    const date = parseISO(dateStr);
    
    // Extract UTC date components
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    
    // Create a new date in the local timezone with the same date components
    // This preserves the actual date (e.g., March 12th) regardless of timezone
    const localDate = new Date(year, month, day);
    
    // Set to start of day for consistent comparison
    return startOfDay(localDate);
  } catch (e) {
    console.error(`Error converting date ${dateStr} to local date:`, e);
    return null;
  }
};

/**
 * Compare two dates to check if they're the same day, handling null values
 */
export const isSameDayLocal = (date1: Date | null, date2: Date | null) => {
  if (!date1 || !date2) return false;
  return isSameDay(date1, date2);
};
