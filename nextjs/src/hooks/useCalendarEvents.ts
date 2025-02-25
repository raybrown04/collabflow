"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { startOfMonth, endOfMonth } from "date-fns"
import { Database } from "@/lib/database.types"
import { supabase, getCurrentUserId, isCurrentUserAdmin } from "@/lib/auth"

export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

// Temporary test data for development mode
const today = new Date()
const testEvents: CalendarEvent[] = [
    {
        id: "dev-1",
        title: "Team Standup",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
        description: "Daily team sync meeting",
        type: "meeting",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    },
    {
        id: "dev-2",
        title: "Project Review",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
        description: "Q1 project progress review",
        type: "meeting",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    },
    {
        id: "dev-3",
        title: "Submit Report",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0).toISOString(),
        description: null,
        type: "task",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    },
    {
        id: "dev-4",
        title: "Dentist Appointment",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0).toISOString(),
        description: "Regular checkup",
        type: "reminder",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    }
]

// Check if we're in development mode
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

async function fetchEventsForMonth(date: Date): Promise<CalendarEvent[]> {
    // In development mode, return test events
    if (isDevelopment) {
        console.log("Development mode: Using test events")
        return testEvents
    }

    try {
        const start = startOfMonth(date)
        const end = endOfMonth(date)

        // Get the current user ID
        const userId = await getCurrentUserId()

        // Check if user is admin
        const isAdmin = await isCurrentUserAdmin()

        // Build query
        let query = supabase
            .from('calendar_events')
            .select('*')
            .gte('date', start.toISOString())
            .lte('date', end.toISOString())
            .order('date', { ascending: true })

        // If not admin, filter by user_id
        if (!isAdmin) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching events:', error)
            throw new Error(`Failed to fetch events: ${error.message}`)
        }

        return data || []
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
