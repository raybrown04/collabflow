import { format, parseISO } from 'date-fns';

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
