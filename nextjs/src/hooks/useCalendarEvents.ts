"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { startOfMonth, endOfMonth } from "date-fns"
import { Database } from "@/lib/database.types"
import { supabase, getCurrentUserId, isCurrentUserAdmin } from "@/lib/auth"

export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

async function fetchEventsForMonth(date: Date): Promise<CalendarEvent[]> {
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
        throw err
    }
}

async function createEvent(event: Omit<CalendarEvent, 'id' | 'created_at'>): Promise<CalendarEvent> {
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
