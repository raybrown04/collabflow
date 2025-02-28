"use client"

/**
 * useCalendarEvents.ts
 * Updated: 2/27/2025
 * 
 * This hook has been updated to fix TypeScript issues with null values vs undefined.
 * Fixed scrolling-related issues for better interaction with event selections.
 * Added more detailed development mode test events for better testing.
 * Made date parameter optional with a default value of current date.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, parseISO, addMonths, isSameDay, startOfDay } from "date-fns";
import { useState, useEffect } from "react";
import { Database } from "@/lib/database.types";
import { supabase } from "@/lib/auth";
import { RRule, RRuleSet, rrulestr } from "rrule";

export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'] & {
    end_date?: string | null;
    is_all_day?: boolean | null;
    location?: string | null;
    invitees?: string[] | null;
    recurrence_rule?: string | null;
    is_recurring_instance?: boolean;
    multiDayContinuation?: boolean;
    updated_at?: string | null;
};

export const useCalendarEvents = (date?: Date) => {
    const [isFetching, setIsFetching] = useState(false);

    // Use current date if none provided
    const effectiveDate = date || new Date();

    // Get the first day of the month
    const firstDayOfMonth = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), 1);
    // Get the first day of the next month
    const firstDayOfNextMonth = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth() + 1, 1);

    // Use react-query to fetch events
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["calendar-events", format(firstDayOfMonth, "yyyy-MM")],
        queryFn: async () => {
            setIsFetching(true);
            try {
                // For development, we'll use test data
                if (process.env.NODE_ENV === "development") {
                    console.log("Development mode: Returning all test events");
                    return generateTestEvents();
                }

                // For production, fetch from the database
                const { data, error } = await supabase
                    .from("calendar_events")
                    .select("*")
                    .gte("date", firstDayOfMonth.toISOString())
                    .lt("date", firstDayOfNextMonth.toISOString());

                if (error) {
                    throw new Error(error.message);
                }

                return data || [];
            } finally {
                setIsFetching(false);
            }
        },
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Parse recurring events and add instances
    const eventsWithRecurrences = processRecurringEvents(data || []);

    // Log the events for debugging
    useEffect(() => {
        if (eventsWithRecurrences) {
            console.log(`Returning ${eventsWithRecurrences.length} events (including recurring instances)`);
        }
    }, [eventsWithRecurrences]);

    // Handle manual refresh
    const manualRefresh = async () => {
        setIsFetching(true);
        try {
            await refetch();
        } finally {
            setIsFetching(false);
        }
    };

    return {
        data: eventsWithRecurrences,
        isLoading: isLoading || isFetching,
        error,
        refetch: manualRefresh
    };
};

// Process recurring events
function processRecurringEvents(events: CalendarEvent[]): CalendarEvent[] {
    const now = new Date();
    const lookAheadMonths = 12; // Look ahead 12 months
    const endDate = addMonths(now, lookAheadMonths);

    // Start with the original events
    const allEvents = [...events];

    // Process each event that has a recurrence rule
    events.forEach(event => {
        if (!event.recurrence_rule) return;

        try {
            // Parse the recurrence rule
            let rruleOptions: any = {};

            // Parse FREQ
            const freqMatch = event.recurrence_rule.match(/FREQ=([^;]+)/);
            if (freqMatch && freqMatch[1]) {
                rruleOptions.freq = parseFrequency(freqMatch[1]);
            }

            // Parse INTERVAL
            const intervalMatch = event.recurrence_rule.match(/INTERVAL=([0-9]+)/);
            if (intervalMatch && intervalMatch[1]) {
                rruleOptions.interval = parseInt(intervalMatch[1]);
            }

            // Parse UNTIL
            const untilMatch = event.recurrence_rule.match(/UNTIL=([^;T]+)/);
            if (untilMatch && untilMatch[1]) {
                // Parse YYYYMMDD format
                const year = parseInt(untilMatch[1].substring(0, 4));
                const month = parseInt(untilMatch[1].substring(4, 6)) - 1; // Months are 0-indexed in JS
                const day = parseInt(untilMatch[1].substring(6, 8));
                rruleOptions.until = new Date(year, month, day, 23, 59, 59);
            } else {
                // Default end date if no UNTIL
                rruleOptions.until = endDate;
            }

            // Parse COUNT
            const countMatch = event.recurrence_rule.match(/COUNT=([0-9]+)/);
            if (countMatch && countMatch[1]) {
                rruleOptions.count = parseInt(countMatch[1]);
            }

            // Parse BYDAY for weekly recurrence
            if (rruleOptions.freq === RRule.WEEKLY) {
                const bydayMatch = event.recurrence_rule.match(/BYDAY=([^;]+)/);
                if (bydayMatch && bydayMatch[1]) {
                    const days = bydayMatch[1].split(',');
                    rruleOptions.byweekday = days.map(day => parseWeekday(day));
                }
            }

            // Set the start date (DTSTART)
            rruleOptions.dtstart = parseISO(event.date);

            // Create the rule
            const rule = new RRule(rruleOptions);

            // Get all occurrences between now and end date
            const occurrences = rule.between(now, endDate);

            // Generate event instances for each occurrence (except the first one, which is the original event)
            occurrences.forEach((date: Date) => {
                // Skip the original event date to avoid duplicates
                if (isSameDay(date, parseISO(event.date))) return;

                // Create a new event instance
                const newEvent: CalendarEvent = {
                    ...event,
                    id: `${event.id}-${format(date, 'yyyyMMdd')}`, // Generate a unique ID
                    date: format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"), // Format date as ISO string
                    is_recurring_instance: true,
                    updated_at: null
                };

                // If there's an end_date, adjust it for the new instance
                if (event.end_date) {
                    const originalStartDate = parseISO(event.date);
                    const originalEndDate = parseISO(event.end_date);
                    const durationMs = originalEndDate.getTime() - originalStartDate.getTime();

                    const newEndDate = new Date(date.getTime() + durationMs);
                    newEvent.end_date = format(newEndDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
                }

                allEvents.push(newEvent);
            });
        } catch (error) {
            console.error(`Error processing recurrence rule for event ${event.id}:`, error);
        }
    });

    return allEvents;
}

// Helper function to parse frequency strings to RRule constants
function parseFrequency(freq: string): number {
    switch (freq.toLowerCase()) {
        case 'daily': return RRule.DAILY;
        case 'weekly': return RRule.WEEKLY;
        case 'monthly': return RRule.MONTHLY;
        case 'yearly': return RRule.YEARLY;
        default: return RRule.DAILY; // Default to daily
    }
}

// Helper function to parse weekday strings to RRule weekday constants
function parseWeekday(weekday: string): any {
    switch (weekday) {
        case 'MO': return RRule.MO;
        case 'TU': return RRule.TU;
        case 'WE': return RRule.WE;
        case 'TH': return RRule.TH;
        case 'FR': return RRule.FR;
        case 'SA': return RRule.SA;
        case 'SU': return RRule.SU;
        default: return RRule.MO; // Default to Monday
    }
}

// Generate test events for development
function generateTestEvents(): CalendarEvent[] {
    const userId = '12345'; // Mock user ID

    return [
        {
            id: '1',
            title: 'Quarterly Planning',
            description: 'Q1 planning meeting with department heads',
            type: 'meeting',
            date: '2025-01-15T17:00:00.000Z',
            end_date: '2025-01-15T19:00:00.000Z',
            is_all_day: false,
            location: 'Conference Room A',
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: ['john@example.com', 'sarah@example.com'],
            recurrence_rule: null
        },
        {
            id: '2',
            title: 'Team Building',
            description: 'Team building activities and lunch',
            type: 'meeting',
            date: '2025-01-20T21:00:00.000Z',
            end_date: '2025-01-20T23:00:00.000Z',
            is_all_day: false,
            location: 'Downtown Restaurant',
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: ['team@example.com'],
            recurrence_rule: null
        },
        {
            id: '3',
            title: 'Team Standup',
            description: 'Weekly team standup meeting',
            type: 'meeting',
            date: '2025-02-27T18:00:00.000Z',
            end_date: '2025-02-27T18:30:00.000Z',
            is_all_day: false,
            location: 'Zoom',
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: null,
            recurrence_rule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR'
        },
        {
            id: '4',
            title: 'Project Review',
            description: 'Monthly project review meeting',
            type: 'meeting',
            date: '2025-02-27T22:00:00.000Z',
            end_date: '2025-02-27T23:00:00.000Z',
            is_all_day: false,
            location: 'Meeting Room B',
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: null,
            recurrence_rule: null
        },
        {
            id: '5',
            title: 'Submit Report',
            description: 'Submit monthly progress report',
            type: 'task',
            date: '2025-02-28T19:00:00.000Z',
            end_date: null,
            is_all_day: false,
            location: null,
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: null,
            recurrence_rule: null
        },
        {
            id: '6',
            title: 'Dentist Appointment',
            description: 'Regular dental checkup',
            type: 'reminder',
            date: '2025-03-01T23:00:00.000Z',
            end_date: '2025-03-01T23:30:00.000Z',
            is_all_day: false,
            location: 'Dental Clinic',
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: null,
            recurrence_rule: null
        },
        {
            id: '7',
            title: 'Performance Review',
            description: 'Quarterly performance review',
            type: 'meeting',
            date: '2025-03-10T18:00:00.000Z',
            end_date: '2025-03-10T19:00:00.000Z',
            is_all_day: false,
            location: 'Manager\'s Office',
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: null,
            recurrence_rule: null
        },
        {
            id: '8',
            title: 'Conference',
            description: 'Industry conference',
            type: 'meeting',
            date: '2025-03-15T16:00:00.000Z',
            end_date: '2025-03-17T23:00:00.000Z',
            is_all_day: true,
            location: 'Convention Center',
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: null,
            recurrence_rule: null
        },
        {
            id: '9',
            title: 'Project Deadline',
            description: 'Final project submission deadline',
            type: 'task',
            date: '2025-03-29T00:00:00.000Z',
            end_date: null,
            is_all_day: true,
            location: null,
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: null,
            recurrence_rule: null
        },
        {
            id: '10',
            title: 'Vacation',
            description: 'Annual vacation',
            type: 'reminder',
            date: '2025-04-05T07:00:00.000Z',
            end_date: '2025-04-12T07:00:00.000Z',
            is_all_day: true,
            location: 'Beach Resort',
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: null,
            recurrence_rule: null
        },
        {
            id: '11',
            title: 'Training Session',
            description: 'New tools training session',
            type: 'meeting',
            date: '2025-04-12T17:00:00.000Z',
            end_date: '2025-04-12T19:00:00.000Z',
            is_all_day: false,
            location: 'Training Room',
            user_id: userId,
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null,
            invitees: null,
            recurrence_rule: null
        }
    ];
}

// Hook for updating events
export const useUpdateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (event: Partial<CalendarEvent> & { id: string }) => {
            // For development, just console log
            if (process.env.NODE_ENV === "development") {
                console.log("Development mode: Event update simulation", event);
                return event;
            }

            // For production, update in the database
            const { data, error } = await supabase
                .from("calendar_events")
                .update(event)
                .eq("id", event.id)
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }

            return data;
        },
        onSuccess: () => {
            // Invalidate the calendar events query to trigger a refetch
            queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
        },
    });
};

// Hook for creating events
export const useCreateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (event: Omit<CalendarEvent, "id" | "created_at" | "updated_at">) => {
            // For development, just console log
            if (process.env.NODE_ENV === "development") {
                console.log("Development mode: Event creation simulation", event);
                return { ...event, id: Math.random().toString(36).substr(2, 9) };
            }

            // For production, insert into the database
            const { data, error } = await supabase
                .from("calendar_events")
                .insert(event)
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }

            return data;
        },
        onSuccess: () => {
            // Invalidate the calendar events query to trigger a refetch
            queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
        },
    });
};

// Hook for deleting events
export const useDeleteEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Check if this is a recurring instance
            const isRecurringInstance = id.includes('-');

            // For development, just console log
            if (process.env.NODE_ENV === "development") {
                console.log(`Development mode: ${isRecurringInstance ? 'Recurring instance' : 'Event'} deletion simulation`, id);
                return { id };
            }

            // For recurring instances, we would need special handling
            // For real events, delete from the database
            if (!isRecurringInstance) {
                const { data, error } = await supabase
                    .from("calendar_events")
                    .delete()
                    .eq("id", id);

                if (error) {
                    throw new Error(error.message);
                }
            }

            return { id };
        },
        onSuccess: () => {
            // Invalidate the calendar events query to trigger a refetch
            queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
        },
    });
};

export const useUpdateEventDate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { event: CalendarEvent, newDate: Date }) => {
            const { event, newDate } = params;

            // Calculate the time difference between the original date and the new date
            const originalDate = parseISO(event.date);
            const timeDiff = newDate.getTime() - startOfDay(originalDate).getTime();

            // Create a new date that preserves the original time
            const newDateTime = new Date(originalDate.getTime() + timeDiff);

            // Format as ISO string
            const newDateString = format(newDateTime, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

            // Calculate new end date if it exists
            let newEndDateString = undefined;
            if (event.end_date) {
                const originalEndDate = parseISO(event.end_date);
                const duration = originalEndDate.getTime() - originalDate.getTime();
                const newEndDate = new Date(newDateTime.getTime() + duration);
                newEndDateString = format(newEndDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
            }

            // For development, just console log
            if (process.env.NODE_ENV === "development") {
                console.log("Development mode: Event date update simulation", {
                    id: event.id,
                    date: newDateString,
                    end_date: newEndDateString
                });
                return { ...event, date: newDateString, end_date: newEndDateString };
            }

            // For production, update in the database
            const updateData = { date: newDateString, ...(newEndDateString && { end_date: newEndDateString }) };
            const { data, error } = await supabase
                .from("calendar_events")
                .update(updateData)
                .eq("id", event.id)
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }

            return data;
        },
        onSuccess: () => {
            // Invalidate the calendar events query to trigger a refetch
            queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
        },
    });
};
