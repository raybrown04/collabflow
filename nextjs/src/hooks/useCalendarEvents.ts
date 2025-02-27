"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { startOfMonth, endOfMonth, addDays, addWeeks, addMonths, addYears, isBefore, parseISO, format } from "date-fns"
import { Database } from "@/lib/database.types"
import { supabase, getCurrentUserId, isCurrentUserAdmin } from "@/lib/auth"

export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'] & {
    end_date?: string;
    is_all_day?: boolean;
    location?: string;
    invitees?: string[];
    recurrence_rule?: string;
    is_recurring_instance?: boolean;
}

// Temporary test data for development mode with events across multiple months
const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = today.getMonth()
const currentDay = today.getDate()

// Helper function to create test events
const createTestEvent = (
    id: string,
    title: string,
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    description: string | null,
    type: "meeting" | "task" | "reminder"
): CalendarEvent => ({
    id,
    title,
    date: new Date(year, month, day, hour, minute).toISOString(),
    description,
    type,
    user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
    created_at: new Date().toISOString()
})

// Create a comprehensive set of test events across multiple months
const testEvents: CalendarEvent[] = [
    // Current month events
    createTestEvent(
        "dev-1",
        "Team Standup",
        currentYear,
        currentMonth,
        currentDay,
        10,
        0,
        "Daily team sync meeting",
        "meeting"
    ),
    createTestEvent(
        "dev-2",
        "Project Review",
        currentYear,
        currentMonth,
        currentDay,
        14,
        0,
        "Q1 project progress review",
        "meeting"
    ),
    createTestEvent(
        "dev-3",
        "Submit Report",
        currentYear,
        currentMonth,
        currentDay + 1,
        11,
        0,
        null,
        "task"
    ),
    createTestEvent(
        "dev-4",
        "Dentist Appointment",
        currentYear,
        currentMonth,
        currentDay + 2,
        15,
        0,
        "Regular checkup",
        "reminder"
    ),

    // Previous month events
    createTestEvent(
        "dev-5",
        "Quarterly Planning",
        currentYear,
        currentMonth - 1,
        15,
        9,
        0,
        "Plan for the upcoming quarter",
        "meeting"
    ),
    createTestEvent(
        "dev-6",
        "Team Building",
        currentYear,
        currentMonth - 1,
        20,
        13,
        0,
        "Team building activities",
        "meeting"
    ),

    // Next month events
    createTestEvent(
        "dev-7",
        "Performance Review",
        currentYear,
        currentMonth + 1,
        10,
        11,
        0,
        "Annual performance review",
        "meeting"
    ),
    createTestEvent(
        "dev-8",
        "Conference",
        currentYear,
        currentMonth + 1,
        15,
        9,
        0,
        "Industry conference",
        "meeting"
    ),
    createTestEvent(
        "dev-9",
        "Project Deadline",
        currentYear,
        currentMonth + 1,
        28,
        17,
        0,
        "Final project submission",
        "task"
    ),

    // Events in two months from now
    createTestEvent(
        "dev-10",
        "Vacation",
        currentYear,
        currentMonth + 2,
        5,
        0,
        0,
        "Annual vacation",
        "reminder"
    ),
    createTestEvent(
        "dev-11",
        "Training Session",
        currentYear,
        currentMonth + 2,
        12,
        10,
        0,
        "New technology training",
        "meeting"
    )
]

// Function to expand recurring events based on their recurrence rules
function expandRecurringEvents(events: CalendarEvent[], startDate: Date, endDate: Date): CalendarEvent[] {
    const expandedEvents: CalendarEvent[] = [];

    // Process each event
    events.forEach(event => {
        // Add the original event
        expandedEvents.push(event);

        // If the event has a recurrence rule, generate instances
        if (event.recurrence_rule) {
            const rule = event.recurrence_rule;
            const eventDate = parseISO(event.date);

            // Extract frequency
            const freqMatch = rule.match(/FREQ=([^;]+)/);
            if (!freqMatch || !freqMatch[1]) return;

            const frequency = freqMatch[1].toLowerCase();

            // Extract interval
            const intervalMatch = rule.match(/INTERVAL=([0-9]+)/);
            const interval = intervalMatch && intervalMatch[1] ? parseInt(intervalMatch[1]) : 1;

            // Extract end condition
            const countMatch = rule.match(/COUNT=([0-9]+)/);
            const untilMatch = rule.match(/UNTIL=([^;T]+)/);

            let maxOccurrences = 100; // Default limit
            let untilDate: Date | null = null;

            if (countMatch && countMatch[1]) {
                maxOccurrences = parseInt(countMatch[1]);
            } else if (untilMatch && untilMatch[1]) {
                // Parse the UNTIL date (YYYYMMDD format)
                const year = untilMatch[1].substring(0, 4);
                const month = untilMatch[1].substring(4, 6);
                const day = untilMatch[1].substring(6, 8);
                untilDate = new Date(`${year}-${month}-${day}`);
            }

            // Extract BYDAY for weekly recurrence
            let weeklyDays: string[] = [];
            if (frequency === 'weekly') {
                const bydayMatch = rule.match(/BYDAY=([^;]+)/);
                if (bydayMatch && bydayMatch[1]) {
                    weeklyDays = bydayMatch[1].split(',');
                }
            }

            // Generate recurring instances
            let currentDate = eventDate;
            let count = 0;

            while (count < maxOccurrences) {
                // Move to the next occurrence based on frequency
                if (count > 0) { // Skip the first occurrence as it's the original event
                    switch (frequency) {
                        case 'daily':
                            currentDate = addDays(currentDate, interval);
                            break;
                        case 'weekly':
                            currentDate = addWeeks(currentDate, interval);
                            break;
                        case 'monthly':
                            currentDate = addMonths(currentDate, interval);
                            break;
                        case 'yearly':
                            currentDate = addYears(currentDate, interval);
                            break;
                    }
                }

                count++;

                // Check if we've reached the until date
                if (untilDate && currentDate > untilDate) {
                    break;
                }

                // For weekly recurrence with specific days
                if (frequency === 'weekly' && weeklyDays.length > 0 && count > 0) {
                    // Skip if the current day of week is not in the specified days
                    const dayOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][currentDate.getDay()];
                    if (!weeklyDays.includes(dayOfWeek)) {
                        continue;
                    }
                }

                // Skip if the date is outside our range
                if (currentDate < startDate || currentDate > endDate) {
                    continue;
                }

                // Create a new instance of the event
                const newEvent: CalendarEvent = {
                    ...event,
                    id: `${event.id}-recurrence-${count}`,
                    date: currentDate.toISOString(),
                    is_recurring_instance: true
                };

                // If the original event has an end_date, calculate the new end_date
                if (event.end_date) {
                    const originalStartDate = parseISO(event.date);
                    const originalEndDate = parseISO(event.end_date);
                    const duration = originalEndDate.getTime() - originalStartDate.getTime();

                    const newEndDate = new Date(currentDate.getTime() + duration);
                    newEvent.end_date = newEndDate.toISOString();
                }

                expandedEvents.push(newEvent);
            }
        }
    });

    return expandedEvents;
}

// Check if we're in development mode
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

async function fetchEventsForMonth(date: Date): Promise<CalendarEvent[]> {
    // Calculate start and end dates for the month
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    // In development mode, return all test events without filtering by month
    if (isDevelopment) {
        console.log("Development mode: Returning all test events");

        // Sort events by date
        const sortedEvents = [...testEvents].sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        // Expand recurring events
        const expandedEvents = expandRecurringEvents(sortedEvents, start, end);

        // Sort again after expansion
        const finalSortedEvents = expandedEvents.sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        console.log(`Returning ${finalSortedEvents.length} events (including recurring instances)`);
        return finalSortedEvents;
    }

    try {
        // Get the current user ID
        const userId = await getCurrentUserId();

        // Check if user is admin
        const isAdmin = await isCurrentUserAdmin();

        // Build query - get all events without month filtering
        let query = supabase
            .from('calendar_events')
            .select('*')
            .order('date', { ascending: true });

        // If not admin, filter by user_id
        if (!isAdmin) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching events:', error);
            throw new Error(`Failed to fetch events: ${error.message}`);
        }

        // Expand recurring events
        const events = data || [];
        const expandedEvents = expandRecurringEvents(events, start, end);

        // Sort after expansion
        const sortedEvents = expandedEvents.sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        return sortedEvents;
    } catch (err) {
        console.error('Error in fetchEventsForMonth:', err)

        // Fallback to test events in development mode if there's an error
        if (isDevelopment) {
            console.warn("Falling back to test events after error")
            return testEvents
        }

        throw err
    }
}

async function createEvent(event: Omit<CalendarEvent, 'id' | 'created_at'>): Promise<CalendarEvent> {
    // In development mode, create a mock event
    if (isDevelopment) {
        console.log("Development mode: Creating mock event", event)
        const mockEvent: CalendarEvent = {
            id: Math.random().toString(36).substring(2, 15),
            created_at: new Date().toISOString(),
            ...event
        }

        // Add to test events for display
        testEvents.push(mockEvent)

        return mockEvent
    }

    try {
        // Validate that user_id is a valid UUID
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.user_id)) {
            throw new Error('Invalid user ID format')
        }

        const { data, error } = await supabase
            .from('calendar_events')
            .insert([event])
            .select()
            .single()

        if (error) {
            console.error('Error creating event:', error)
            throw new Error(`Failed to create event: ${error.message}`)
        }

        return data
    } catch (err) {
        console.error('Error in createEvent function:', err)
        throw err
    }
}

async function updateEvent(event: Partial<CalendarEvent> & { id: string }): Promise<CalendarEvent> {
    // In development mode, update a mock event
    if (isDevelopment) {
        console.log("Development mode: Updating mock event", event)

        // Find the event in test events
        const index = testEvents.findIndex(e => e.id === event.id)
        if (index !== -1) {
            // Update the event
            const updatedEvent = { ...testEvents[index], ...event }
            testEvents[index] = updatedEvent
            return updatedEvent
        }

        throw new Error('Event not found')
    }

    try {
        // Validate that user_id is a valid UUID if provided
        if (event.user_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.user_id)) {
            throw new Error('Invalid user ID format')
        }

        const { data, error } = await supabase
            .from('calendar_events')
            .update(event)
            .eq('id', event.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating event:', error)
            throw new Error(`Failed to update event: ${error.message}`)
        }

        return data
    } catch (err) {
        console.error('Error in updateEvent function:', err)
        throw err
    }
}

async function deleteEvent(id: string): Promise<void> {
    // In development mode, delete a mock event
    if (isDevelopment) {
        console.log("Development mode: Deleting mock event", id)

        // Remove the event from test events
        const index = testEvents.findIndex(e => e.id === id)
        if (index !== -1) {
            testEvents.splice(index, 1)
            return
        }

        throw new Error('Event not found')
    }

    try {
        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting event:', error)
            throw new Error(`Failed to delete event: ${error.message}`)
        }
    } catch (err) {
        console.error('Error in deleteEvent function:', err)
        throw err
    }
}

export function useCalendarEvents(date: Date) {
    return useQuery({
        queryKey: ['events', date.toISOString().split('T')[0]],
        queryFn: () => fetchEventsForMonth(date),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

export function useCreateEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
        },
        onError: (error) => {
            console.error('Error in create event mutation:', error)
        },
    })
}

export function useUpdateEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
        },
        onError: (error) => {
            console.error('Error in update event mutation:', error)
        },
    })
}

export function useDeleteEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
        },
        onError: (error) => {
            console.error('Error in delete event mutation:', error)
        },
    })
}
